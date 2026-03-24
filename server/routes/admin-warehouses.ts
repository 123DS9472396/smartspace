import 'dotenv/config';
import { RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeBlocksBooked = (raw: any) => {
  if (!raw) return [];

  const blocks = Array.isArray(raw) ? raw : [raw];

  return blocks.map((block: any, index: number) => {
    if (typeof block === 'number' || typeof block === 'string') {
      return {
        id: String(block),
        block_number: block,
        area: null,
        label: `Block ${block}`
      };
    }

    const blockNumber = block?.block_number ?? block?.number ?? block?.blockNo ?? block?.label ?? index + 1;

    return {
      id: block?.id ? String(block.id) : `block_${index + 1}`,
      block_number: blockNumber,
      area: typeof block?.area === 'number' ? block.area : null,
      label: `Block ${blockNumber}`
    };
  });
};

export const getAdminWarehouses: RequestHandler = async (req, res) => {
  try {
    console.log('🏢 Fetching warehouses for admin dashboard...');

    // Get all warehouses
    const { data: warehouses, error: whError } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });

    if (whError) {
      console.error('❌ Error fetching warehouses:', whError);
      return res.json({ success: true, warehouses: [], summary: {} });
    }

    // Get all bookings
    const { data: bookings, error: bookError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('type', 'booking');

    if (bookError) {
      console.error('❌ Error fetching bookings:', bookError);
    }

    // Map bookings to warehouses
    const bookingsByWarehouse = new Map();
    const bookingsByWarehouseName = new Map();

    bookings?.forEach((log: any) => {
      const warehouseId = log.metadata?.warehouse_id;
      const warehouseName = log.metadata?.warehouse_name;

      if (warehouseId) {
        if (!bookingsByWarehouse.has(warehouseId)) {
          bookingsByWarehouse.set(warehouseId, []);
        }
        bookingsByWarehouse.get(warehouseId).push(log);
      }

      if (warehouseName) {
        if (!bookingsByWarehouseName.has(warehouseName)) {
          bookingsByWarehouseName.set(warehouseName, []);
        }
        bookingsByWarehouseName.get(warehouseName).push(log);
      }
    });

    // Enrich warehouses with booking data
    const withBookings = (warehouses || []).map((wh: any) => {
      let warehouseBookings = bookingsByWarehouse.get(wh.id) || bookingsByWarehouse.get(wh.wh_id) || [];
      
      // Fallback to name-based lookup
      if (warehouseBookings.length === 0) {
        warehouseBookings = bookingsByWarehouseName.get(wh.name) || [];
      }

      const approvedBookings = warehouseBookings.filter((b: any) => b.metadata?.booking_status === 'approved');
      const pendingBookings = warehouseBookings.filter((b: any) => b.metadata?.booking_status === 'pending');
      const rejectedBookings = warehouseBookings.filter((b: any) => b.metadata?.booking_status === 'rejected');

      const totalRevenue = approvedBookings.reduce((sum: number, b: any) => sum + (b.metadata?.total_amount || 0), 0);
      const occupiedArea = approvedBookings.reduce((sum: number, b: any) => sum + (b.metadata?.area_sqft || 0), 0);

      return {
        id: wh.id,
        wh_id: wh.wh_id,
        name: wh.name,
        city: wh.city,
        state: wh.state,
        address: wh.address,
        warehouse_type: wh.warehouse_type,
        status: wh.status,
        total_area: wh.total_area,
        occupied_area: occupiedArea,
        available_area: Math.max(0, (wh.total_area || 0) - occupiedArea),
        occupancy_pct: wh.total_area ? Math.round((occupiedArea / wh.total_area) * 100) : 0,
        price_per_sqft: wh.price_per_sqft,
        rating: wh.rating,
        owner_id: wh.owner_id,
        owner_name: wh.owner_name || 'Unknown Owner',
        owner_email: wh.owner_email || '',
        owner_phone: wh.owner_phone || '',
        owner_company: wh.owner_company || '',
        total_bookings: warehouseBookings.length,
        approved_bookings: approvedBookings.length,
        pending_bookings: pendingBookings.length,
        rejected_bookings: rejectedBookings.length,
        total_revenue: totalRevenue,
        bookings: warehouseBookings.map((b: any) => ({
          booking_id: b.id,
          seeker_id: b.metadata?.seeker_id,
          seeker_name: b.metadata?.customer_details?.name || b.metadata?.seeker_name || 'Unknown',
          seeker_email: b.metadata?.customer_details?.email || b.metadata?.seeker_email || '',
          seeker_phone: b.metadata?.customer_details?.phone || b.metadata?.seeker_phone || '',
          area_sqft: b.metadata?.area_sqft,
          blocks_booked: normalizeBlocksBooked(b.metadata?.blocks_booked),
          start_date: b.metadata?.start_date,
          end_date: b.metadata?.end_date,
          total_amount: b.metadata?.total_amount,
          payment_method: b.metadata?.payment_method,
          status: b.metadata?.booking_status || 'pending',
          goods_type: b.metadata?.goods_type,
          warehouse_name: b.metadata?.warehouse_name,
          created_at: b.created_at
        }))
      };
    });

    // Calculate summary
    const summary = {
      total_warehouses: withBookings.length,
      total_bookings: bookings?.length || 0,
      approved_bookings: bookings?.filter((b: any) => b.metadata?.booking_status === 'approved').length || 0,
      pending_bookings: bookings?.filter((b: any) => b.metadata?.booking_status === 'pending').length || 0,
      rejected_bookings: bookings?.filter((b: any) => b.metadata?.booking_status === 'rejected').length || 0,
      total_revenue: withBookings.reduce((sum, wh) => sum + wh.total_revenue, 0),
      occupied_area_sqft: withBookings.reduce((sum, wh) => sum + wh.occupied_area, 0),
      average_occupancy_pct: withBookings.length > 0 
        ? Math.round(withBookings.reduce((sum, wh) => sum + wh.occupancy_pct, 0) / withBookings.length)
        : 0
    };

    console.log(`✅ Fetched ${withBookings.length} warehouses with booking data`);
    return res.json({
      success: true,
      warehouses: withBookings,
      summary
    });
  } catch (error) {
    console.error('❌ Admin warehouses error:', error);
    return res.json({ success: true, warehouses: [], summary: {} });
  }
};

export const getAdminUsers: RequestHandler = async (req, res) => {
  try {
    console.log('👥 Fetching all users for admin...');

    // Fetch from seeker_profiles table
    const { data: seekerProfiles } = await supabase
      .from('seeker_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch from owner_profiles table
    const { data: ownerProfiles } = await supabase
      .from('owner_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch owners from warehouses table (the real source of owner data)
    const { data: warehouses, error: whErr } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });
    if (whErr) console.error('❌ warehouses query error:', whErr);

    // Fetch bookings from activity_logs to get real seeker data
    const { data: bookingLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('type', 'booking')
      .order('created_at', { ascending: false });

    // Build deduplicated owners list (from warehouses table - the real data source)
    const ownerMap = new Map<string, any>();
    (warehouses || []).forEach((wh: any) => {
      if (!wh.owner_name || wh.owner_name === 'Unknown Owner') return;
      const key = wh.owner_email || wh.owner_name;
      if (!ownerMap.has(key)) {
        ownerMap.set(key, {
          id: wh.owner_id || wh.id,
          name: wh.owner_name,
          email: wh.owner_email || '',
          phone: wh.owner_phone || '',
          company_name: wh.owner_company || '',
          city: wh.city || '',
          state: wh.state || '',
          user_type: 'owner',
          verification_status: 'verified',
          total_warehouses: 0,
          warehouses: [],
          created_at: wh.created_at
        });
      }
      const owner = ownerMap.get(key);
      owner.total_warehouses = (owner.total_warehouses || 0) + 1;
      owner.warehouses.push({
        id: wh.id,
        wh_id: wh.wh_id,
        name: wh.name || 'Unnamed Warehouse',
        city: wh.city || '',
        state: wh.state || '',
        status: wh.status || 'unknown',
        warehouse_type: wh.warehouse_type || '',
        total_area: wh.total_area || 0,
        price_per_sqft: wh.price_per_sqft || 0,
        created_at: wh.created_at,
      });
    });

    // Also merge owner_profiles data if any
    (ownerProfiles || []).forEach((o: any) => {
      const key = o.email || o.name;
      if (!ownerMap.has(key)) {
        ownerMap.set(key, {
          id: o.id,
          name: o.name || 'Unknown',
          email: o.email || '',
          phone: o.phone || '',
          company_name: o.company_name || '',
          city: o.city || '',
          state: o.state || '',
          user_type: 'owner',
          verification_status: o.verification_status || 'verified',
          total_warehouses: 0,
          warehouses: [],
          created_at: o.created_at
        });
      }
    });

    const owners = Array.from(ownerMap.values())
      .sort((a, b) => (b.total_warehouses || 0) - (a.total_warehouses || 0));

    // Build deduplicated seekers list (from seeker_profiles + activity_logs bookings)
    const seekerMap = new Map<string, any>();

    // First from seeker_profiles
    (seekerProfiles || []).forEach((s: any) => {
      const key = s.email || s.id;
      seekerMap.set(key, {
        id: s.id,
        name: s.name || 'Unknown',
        email: s.email || '',
        phone: s.phone || '',
        company_name: s.company_name || '',
        user_type: 'seeker',
        verification_status: s.verification_status || 'verified',
        total_bookings: 0,
        total_spent: 0,
        bookings: [],
        created_at: s.created_at
      });
    });

    // Then extract unique seekers from booking logs
    (bookingLogs || []).forEach((log: any) => {
      const name = log.metadata?.customer_details?.name || log.metadata?.seeker_name || '';
      const email = log.metadata?.customer_details?.email || log.metadata?.seeker_email || '';
      if (!email && !name) return;
      const key = email || name;
      if (!seekerMap.has(key)) {
        seekerMap.set(key, {
          id: log.metadata?.seeker_id || key,
          name: name || 'Unknown',
          email: email || '',
          phone: log.metadata?.customer_details?.phone || log.metadata?.seeker_phone || '',
          company_name: '',
          user_type: 'seeker',
          verification_status: 'verified',
          total_bookings: 0,
          total_spent: 0,
          bookings: [],
          created_at: log.created_at
        });
      }
      const seeker = seekerMap.get(key);
      seeker.total_bookings = (seeker.total_bookings || 0) + 1;
      seeker.total_spent = (seeker.total_spent || 0) + (log.metadata?.total_amount || 0);
      seeker.bookings.push({
        booking_id: log.id,
        warehouse_name: log.metadata?.warehouse_name || 'Unknown Warehouse',
        warehouse_city: log.metadata?.warehouse_city || '',
        warehouse_state: log.metadata?.warehouse_state || '',
        area_sqft: log.metadata?.area_sqft || 0,
        total_amount: log.metadata?.total_amount || 0,
        payment_method: log.metadata?.payment_method || '',
        status: log.metadata?.booking_status || 'pending',
        goods_type: log.metadata?.goods_type || '',
        blocks_booked: normalizeBlocksBooked(log.metadata?.blocks_booked),
        created_at: log.created_at,
        start_date: log.metadata?.start_date || '',
        end_date: log.metadata?.end_date || '',
      });
      // Update with latest name/phone if missing
      if (!seeker.name || seeker.name === 'Unknown') seeker.name = name;
      if (!seeker.phone) seeker.phone = log.metadata?.customer_details?.phone || log.metadata?.seeker_phone || '';
    });

    const seekers = Array.from(seekerMap.values())
      .sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0));

    const summary = {
      total_seekers: seekers.length,
      total_owners: owners.length,
      total_users: seekers.length + owners.length,
      total_bookings: bookingLogs?.length || 0,
      total_warehouses: warehouses?.length || 0
    };

    console.log(`✅ Fetched ${seekers.length} seekers and ${owners.length} owners`);
    return res.json({
      success: true,
      seekers,
      owners,
      summary
    });
  } catch (error) {
    console.error('❌ Admin users error:', error);
    return res.json({ success: true, seekers: [], owners: [], summary: {} });
  }
};
