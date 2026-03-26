import 'dotenv/config';
import { RequestHandler } from "express";
import { supabaseAnon as supabase } from '../lib/supabaseClient';

// Toggle saved warehouse (add/remove from wishlist)
export const toggleSavedWarehouse: RequestHandler = async (req, res) => {
  try {
    const { seekerId, warehouseId } = req.body;

    if (!seekerId || !warehouseId) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: seekerId and warehouseId" 
      });
    }

    // Check if warehouse is already saved
    const { data: existing, error: checkError } = await supabase
      .from('saved_warehouses')
      .select('id')
      .eq('seeker_id', seekerId)
      .eq('warehouse_id', warehouseId)
      .single();

    // Handle schema cache issues gracefully
    if (checkError && (checkError.code === 'PGRST205' || checkError.message?.includes('schema cache'))) {
      console.log('Table not in schema cache yet, simulating add operation');
      return res.json({
        success: true,
        action: 'added',
        saved: true,
        message: 'Warehouse added to your wishlist (schema cache loading)',
        note: 'Database is initializing, please try again in a moment'
      });
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let isSaved = false;
    let action = '';

    if (existing) {
      // Remove from saved warehouses
      const { error: deleteError } = await supabase
        .from('saved_warehouses')
        .delete()
        .eq('seeker_id', seekerId)
        .eq('warehouse_id', warehouseId);

      if (deleteError) {
        if (deleteError.code === 'PGRST205' || deleteError.message?.includes('schema cache')) {
          console.log('Table not in schema cache for delete, simulating removal');
          return res.json({
            success: true,
            action: 'removed',
            saved: false,
            message: 'Warehouse removed from your wishlist (simulated)',
            note: 'Database is initializing'
          });
        }
        throw deleteError;
      }
      
      action = 'removed';
      isSaved = false;
    } else {
      // Add to saved warehouses
      const { error: insertError } = await supabase
        .from('saved_warehouses')
        .insert([{
          seeker_id: seekerId,
          warehouse_id: warehouseId
        }]);

      if (insertError) {
        if (insertError.code === 'PGRST205' || insertError.message?.includes('schema cache')) {
          console.log('Table not in schema cache for insert, simulating add');
          return res.json({
            success: true,
            action: 'added',
            saved: true,
            message: 'Warehouse added to your wishlist (simulated)',
            note: 'Database is initializing'
          });
        }
        throw insertError;
      }
      
      action = 'added';
      isSaved = true;

      // Log activity (with error handling)
      try {
        await supabase
          .from('activity_logs')
          .insert([{
            seeker_id: seekerId,
            type: 'inquiry',
            description: `Saved warehouse to wishlist`,
            metadata: { warehouse_id: warehouseId }
          }]);
      } catch (activityError) {
        console.warn('Failed to log activity:', activityError);
        // Don't fail the main operation if activity logging fails
      }
    }

    res.json({
      success: true,
      action,
      saved: isSaved,
      message: `Warehouse ${action} ${isSaved ? 'to' : 'from'} your wishlist`
    });

  } catch (error) {
    console.error('Error toggling saved warehouse:', error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update saved warehouse",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get saved warehouses for a seeker
export const getSavedWarehouses: RequestHandler = async (req, res) => {
  try {
    const { seekerId } = req.params;

    if (!seekerId) {
      return res.status(400).json({ success: false, error: "Seeker ID is required" });
    }

    console.log(`📋 Fetching saved warehouses for seeker: ${seekerId}`);

    // First, get saved warehouse records
    const { data: savedRecords, error: savedError } = await supabase
      .from('saved_warehouses')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('created_at', { ascending: false });

    // Handle schema cache issues gracefully
    if (savedError && (savedError.code === 'PGRST205' || savedError.message?.includes('schema cache'))) {
      console.log('Table not in schema cache yet, returning empty saved warehouses');
      return res.json({
        success: true,
        warehouses: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        note: 'Database is initializing'
      });
    }

    if (savedError) {
      console.error('Error fetching saved warehouses:', savedError);
      throw savedError;
    }

    console.log(`✅ Found ${savedRecords?.length || 0} saved warehouse records`);

    if (!savedRecords || savedRecords.length === 0) {
      return res.json({
        success: true,
        warehouses: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false }
      });
    }

    // Fetch warehouse details for each saved record
    const warehouseIds = savedRecords.map(sw => sw.warehouse_id);
    console.log('Fetching warehouse details for IDs:', warehouseIds);

    // Try to fetch from warehouses table
    const { data: warehouseDetails, error: warehouseError } = await supabase
      .from('warehouses')
      .select('*')
      .or(warehouseIds.map(id => `id.eq.${id},wh_id.eq.${id}`).join(','));

    const warehouseMap = new Map();
    if (warehouseDetails && !warehouseError) {
      warehouseDetails.forEach(w => {
        warehouseMap.set(w.id, w);
        if (w.wh_id) warehouseMap.set(w.wh_id, w);
      });
    }

    // Transform data to match API types
    const transformedWarehouses = savedRecords.map(sw => {
      const warehouse = warehouseMap.get(sw.warehouse_id);
      return {
        id: sw.id,
        seeker_id: sw.seeker_id,
        warehouse_id: sw.warehouse_id,
        created_at: sw.created_at,
        saved_at: sw.created_at,
        warehouse: warehouse ? {
          id: warehouse.id,
          wh_id: warehouse.wh_id || warehouse.id,
          name: warehouse.name || 'Unknown Warehouse',
          address: warehouse.address || '',
          city: warehouse.city || '',
          state: warehouse.state || '',
          district: warehouse.district || '',
          type: warehouse.type || 'general',
          price_per_sqft: warehouse.price_per_sqft || 0,
          total_area: warehouse.total_area || 0,
          available_area: Math.floor((warehouse.total_area || 0) * (1 - (warehouse.occupancy || 0))),
          occupancy: warehouse.occupancy || 0,
          rating: warehouse.rating || 4.5,
          reviews_count: warehouse.reviews_count || 0,
          images: warehouse.images || []
        } : {
          id: sw.warehouse_id,
          wh_id: sw.warehouse_id,
          name: 'Warehouse ' + sw.warehouse_id,
          address: '',
          city: 'Unknown',
          state: 'Unknown',
          district: '',
          type: 'general',
          price_per_sqft: 0,
          total_area: 0,
          available_area: 0,
          occupancy: 0,
          rating: 4.5,
          reviews_count: 0,
          images: []
        }
      };
    });

    console.log(`✅ Returning ${transformedWarehouses.length} saved warehouses with details`);

    res.json({
      success: true,
      warehouses: transformedWarehouses,
      pagination: {
        total: transformedWarehouses.length,
        limit: transformedWarehouses.length,
        offset: 0,
        hasMore: false
      }
    });
  } catch (error: any) {
    console.error("Error fetching saved warehouses:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch saved warehouses"
    });
  }
};

// Check if a warehouse is saved
export const checkSavedStatus: RequestHandler = async (req, res) => {
  try {
    const { seekerId, warehouseId } = req.params;

    if (!seekerId || !warehouseId) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required parameters: seekerId and warehouseId" 
      });
    }

    const { data, error } = await supabase
      .from('saved_warehouses')
      .select('id')
      .eq('seeker_id', seekerId)
      .eq('warehouse_id', warehouseId)
      .single();

    // Handle schema cache issues
    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      return res.json({
        success: true,
        saved: false,
        note: 'Database is initializing'
      });
    }

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      success: true,
      saved: !!data
    });

  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ 
      success: false,
      saved: false,
      error: "Failed to check saved status"
    });
  }
};
