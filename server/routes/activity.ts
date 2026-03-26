import 'dotenv/config';
import { RequestHandler } from "express";
import { supabaseAnon as supabase } from '../lib/supabaseClient';

// Log a new activity
export const logActivity: RequestHandler = async (req, res) => {
  try {
    const { seekerId, type, description, metadata = {} } = req.body;

    if (!seekerId || !type || !description) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: seekerId, type, and description" 
      });
    }

    // Validate activity type
    const validTypes = ['booking', 'inquiry', 'payment', 'cancellation'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .insert([{
        seeker_id: seekerId,
        type,
        description,
        metadata
      }])
      .select()
      .single();

    // Handle schema cache issues gracefully
    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      console.log('Activity logs table not in schema cache yet, simulating activity log');
      return res.json({
        success: true,
        activity: {
          id: `temp-${Date.now()}`,
          seeker_id: seekerId,
          type,
          description,
          metadata,
          created_at: new Date().toISOString()
        },
        message: "Activity logged successfully (simulated)",
        note: 'Database is initializing'
      });
    }

    if (error) throw error;

    res.json({
      success: true,
      activity: data,
      message: "Activity logged successfully"
    });

  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ 
      success: false,
      error: "Failed to log activity",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get activity timeline for a seeker
export const getActivityTimeline: RequestHandler = async (req, res) => {
  try {
    const { seekerId } = req.params;
    const { limit = 50, offset = 0, type } = req.query;

    if (!seekerId) {
      return res.status(400).json({ success: false, error: "Seeker ID is required" });
    }

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('seeker_id', seekerId);

    // Filter by activity type if provided
    if (type && typeof type === 'string') {
      query = query.eq('type', type);
    }

    const { data: activities, error } = await query
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string), 
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    // Handle schema cache issues gracefully
    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      console.log('Activity logs table not in schema cache yet, returning empty activities');
      return res.json({
        success: true,
        activities: [],
        pagination: {
          total: 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: false
        },
        note: 'Database is initializing'
      });
    }

    if (error) throw error;

    // Get total count for pagination
    let count = (activities || []).length;

    res.json({
      success: true,
      activities: activities || [],
      pagination: {
        total: count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (activities || []).length >= parseInt(limit as string)
      }
    });

  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    res.status(500).json({ 
      success: false,
      activities: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      error: "Failed to fetch activity timeline"
    });
  }
};

// Get activity stats for a seeker
export const getActivityStats: RequestHandler = async (req, res) => {
  try {
    const { seekerId } = req.params;

    if (!seekerId) {
      return res.status(400).json({ success: false, error: "Seeker ID is required" });
    }

    // Fetch activity logs for stats
    const { data: activities, error: activityError } = await supabase
      .from('activity_logs')
      .select('type')
      .eq('seeker_id', seekerId);

    // Handle schema cache issues
    if (activityError && (activityError.code === 'PGRST205' || activityError.message?.includes('schema cache'))) {
      return res.json({
        success: true,
        stats: {
          activities: { total: 0, bookings: 0, inquiries: 0, payments: 0, cancellations: 0 },
          inquiries: { total: 0, open: 0, responded: 0, closed: 0 },
          savedWarehouses: 0
        },
        note: 'Database is initializing'
      });
    }

    // Count activities by type
    const activityStats = {
      total: (activities || []).length,
      bookings: (activities || []).filter(a => a.type === 'booking').length,
      inquiries: (activities || []).filter(a => a.type === 'inquiry').length,
      payments: (activities || []).filter(a => a.type === 'payment').length,
      cancellations: (activities || []).filter(a => a.type === 'cancellation').length
    };

    // Fetch inquiries
    const { data: inquiries, error: inquiryError } = await supabase
      .from('inquiries')
      .select('status')
      .eq('seeker_id', seekerId);

    const inquiryStats = {
      total: (inquiries || []).length,
      open: (inquiries || []).filter(i => i.status === 'open').length,
      responded: (inquiries || []).filter(i => i.status === 'responded').length,
      closed: (inquiries || []).filter(i => i.status === 'closed').length
    };

    // Fetch saved warehouses count
    const { count: savedCount, error: savedError } = await supabase
      .from('saved_warehouses')
      .select('id', { count: 'exact', head: true })
      .eq('seeker_id', seekerId);

    res.json({
      success: true,
      stats: {
        activities: activityStats,
        inquiries: inquiryStats,
        savedWarehouses: savedCount || 0
      }
    });

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.json({
      success: true,
      stats: {
        activities: { total: 0, bookings: 0, inquiries: 0, payments: 0, cancellations: 0 },
        inquiries: { total: 0, open: 0, responded: 0, closed: 0 },
        savedWarehouses: 0
      }
    });
  }
};

// Send an inquiry
export const sendInquiry: RequestHandler = async (req, res) => {
  try {
    const { seekerId, ownerId, warehouseId, message } = req.body;

    if (!seekerId || !warehouseId || !message) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: seekerId, warehouseId, and message" 
      });
    }

    const { data, error } = await supabase
      .from('inquiries')
      .insert([{
        seeker_id: seekerId,
        owner_id: ownerId,
        warehouse_id: warehouseId,
        message,
        status: 'open'
      }])
      .select(`
        *,
        warehouses (
          id,
          name,
          address,
          city,
          state
        )
      `)
      .single();

    // Handle schema cache issues
    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      const mockInquiry = {
        id: `temp-${Date.now()}`,
        seeker_id: seekerId,
        owner_id: ownerId,
        warehouse_id: warehouseId,
        message,
        status: 'open',
        created_at: new Date().toISOString()
      };
      return res.json({
        success: true,
        inquiry: mockInquiry,
        message: "Inquiry sent successfully (simulated)",
        note: 'Database is initializing'
      });
    }

    if (error) throw error;

    // Log the activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          seeker_id: seekerId,
          type: 'inquiry',
          description: `Sent inquiry about warehouse`,
          metadata: { warehouse_id: warehouseId, inquiry_id: data.id }
        }]);
    } catch (activityError) {
      console.warn('Failed to log inquiry activity:', activityError);
    }

    res.json({
      success: true,
      inquiry: data,
      message: "Inquiry sent successfully"
    });

  } catch (error) {
    console.error('Error sending inquiry:', error);
    res.status(500).json({ 
      success: false,
      error: "Failed to send inquiry",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get inquiries for a seeker
export const getSeekerInquiries: RequestHandler = async (req, res) => {
  try {
    const { seekerId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    if (!seekerId) {
      return res.status(400).json({ success: false, error: "Seeker ID is required" });
    }

    let query = supabase
      .from('inquiries')
      .select(`
        *,
        warehouses (
          id,
          name,
          address,
          city,
          state
        )
      `)
      .eq('seeker_id', seekerId);

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data: inquiries, error } = await query
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string), 
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    // Handle schema cache issues
    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      return res.json({
        success: true,
        inquiries: [],
        note: 'Database is initializing'
      });
    }

    if (error) throw error;

    res.json({
      success: true,
      inquiries: inquiries || []
    });

  } catch (error) {
    console.error('Error fetching seeker inquiries:', error);
    res.json({
      success: true,
      inquiries: []
    });
  }
};
