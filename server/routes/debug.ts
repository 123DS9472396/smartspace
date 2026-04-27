import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';

const router = Router();

router.get('/warehouses-sample', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('warehouses').select('id, name, city, district, price_per_sqft, total_area').limit(20);
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ message: 'No data returned' });
    return res.json({ count: data.length, sample: data.slice(0, 10) });
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
});


// POST /api/debug/create-test-bookings
router.post('/create-test-bookings', async (req, res) => {
  try {
    // Sample test data (customize as needed)
    const testBookings = [
      {
        seeker_id: '550e8400-e29b-41d4-a716-446655440001',
        warehouse_id: 'c3a3b899', // Radha Nagar (example)
        blocks: [1,2,3],
        start_date: new Date(Date.now() + 24*60*60*1000).toISOString(),
        end_date: new Date(Date.now() + 8*24*60*60*1000).toISOString(),
        total_amount: 6000,
        payment_method: 'test',
        goods_type: 'General Goods',
        customer_details: { name: 'Test Seeker', email: 'test@smartspace.com' }
      },
      {
        seeker_id: '550e8400-e29b-41d4-a716-446655440002',
        warehouse_id: 'c3a3b899',
        blocks: [4,5],
        start_date: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
        end_date: new Date(Date.now() + 10*24*60*60*1000).toISOString(),
        total_amount: 4000,
        payment_method: 'test',
        goods_type: 'Packaged Foods',
        customer_details: { name: 'Demo User', email: 'demo@smartspace.com' }
      }
    ];

    let bookingsCreated = 0;
    let errors = [];
    for (const b of testBookings) {
      // Insert into activity_logs as a pending booking
      const { data, error } = await req.app.locals.supabase
        ? req.app.locals.supabase.from('activity_logs').insert({
            seeker_id: b.seeker_id,
            type: 'booking',
            description: `Block booking for warehouse ${b.warehouse_id} - ${b.blocks.length} blocks`,
            metadata: {
              warehouse_id: b.warehouse_id,
              blocks_booked: b.blocks,
              area_sqft: b.blocks.length * 100,
              start_date: b.start_date,
              end_date: b.end_date,
              total_amount: b.total_amount,
              payment_method: b.payment_method,
              goods_type: b.goods_type,
              customer_details: b.customer_details,
              booking_status: 'pending',
              booking_type: 'block_booking'
            }
          }).select().single()
        : supabase.from('activity_logs').insert({
            seeker_id: b.seeker_id,
            type: 'booking',
            description: `Block booking for warehouse ${b.warehouse_id} - ${b.blocks.length} blocks`,
            metadata: {
              warehouse_id: b.warehouse_id,
              blocks_booked: b.blocks,
              area_sqft: b.blocks.length * 100,
              start_date: b.start_date,
              end_date: b.end_date,
              total_amount: b.total_amount,
              payment_method: b.payment_method,
              goods_type: b.goods_type,
              customer_details: b.customer_details,
              booking_status: 'pending',
              booking_type: 'block_booking'
            }
          }).select().single();
      if (error) {
        errors.push(error.message);
      } else {
        bookingsCreated++;
      }
    }

    return res.json({
      success: errors.length === 0,
      bookingsCreated,
      errors,
      message: errors.length === 0 ? 'Test bookings created successfully.' : 'Some bookings failed.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
