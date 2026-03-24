-- ============================================================
-- Insert Test Bookings for Admin Warehouse Analytics Demo
-- ============================================================

-- Get warehouse IDs and create bookings
WITH warehouses_to_book AS (
  SELECT 
    id,
    wh_id,
    name,
    total_area,
    '550e8400-e29b-41d4-a716-446655440001'::uuid as seeker_id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.warehouses
  WHERE status = 'active'
  ORDER BY created_at
  LIMIT 5
)
INSERT INTO public.activity_logs (
  seeker_id,
  type,
  description,
  metadata
)
SELECT
  seeker_id,
  'booking',
  'Test booking for ' || name || ' - ' || (300 + (rn * 100)) || ' sqft',
  jsonb_build_object(
    'warehouse_id', id,
    'warehouse_name', name,
    'warehouse_city', 'Test City',
    'warehouse_state', 'Maharashtra',
    'blocks_booked', jsonb_build_array(
      jsonb_build_object('id', 'block_' || rn, 'block_number', rn, 'area', 300 + (rn * 100))
    ),
    'area_sqft', 300 + (rn * 100),
    'start_date', NOW()::DATE,
    'end_date', (NOW() + INTERVAL '30 days')::DATE,
    'total_amount', 15000 + (rn * 5000),
    'payment_method', 'credit_card',
    'goods_type', CASE rn
      WHEN 1 THEN 'Electronics'
      WHEN 2 THEN 'Textiles'
      WHEN 3 THEN 'Food Grains'
      WHEN 4 THEN 'Pharmaceuticals'
      ELSE 'General Goods'
    END,
    'customer_details', jsonb_build_object(
      'name', 'Test Seeker ' || rn,
      'email', 'seeker' || rn || '@test.com',
      'phone', '98000' || LPAD(CAST(rn AS text), 5, '0'),
      'company', 'Test Company ' || rn
    ),
    'booking_status', 'approved'
  )
FROM warehouses_to_book
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT 
  COUNT(*) as total_bookings,
  SUM((metadata->>'area_sqft')::INTEGER) as total_area_booked,
  MAX((metadata->>'total_amount')::NUMERIC) as max_booking_amount
FROM public.activity_logs
WHERE type = 'booking';
