-- =====================================================
-- CHECK AND FIX SAVED WAREHOUSES DATA
-- Run this in Supabase SQL Editor to check and fix seeker IDs
-- =====================================================

-- First, check what seeker_ids are in the table
SELECT seeker_id, COUNT(*) as count 
FROM saved_warehouses 
GROUP BY seeker_id;

-- Check what warehouse_ids are saved
SELECT * FROM saved_warehouses LIMIT 20;

-- If the seeker_ids don't match the demo account, update them
-- The demo seeker ID is: 550e8400-e29b-41d4-a716-446655440001

-- OPTION 1: Update all existing saved warehouses to the demo seeker ID
-- Uncomment and run this if you want to reassign all saved warehouses to demo account:
/*
UPDATE saved_warehouses 
SET seeker_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE seeker_id != '550e8400-e29b-41d4-a716-446655440001';
*/

-- OPTION 2: Add some sample saved warehouses for the demo account
-- Using id::text to convert UUID to TEXT for storage
INSERT INTO saved_warehouses (seeker_id, warehouse_id, created_at)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  id::text,
  NOW()
FROM warehouses 
WHERE status = 'active'
LIMIT 5
ON CONFLICT (seeker_id, warehouse_id) DO NOTHING;

-- Verify the saved warehouses for demo account
-- Using explicit type casting for the JOIN
SELECT 
  sw.*,
  w.name as warehouse_name,
  w.city,
  w.state,
  w.price_per_sqft
FROM saved_warehouses sw
LEFT JOIN warehouses w ON sw.warehouse_id = w.id::text OR sw.warehouse_id = w.wh_id
WHERE sw.seeker_id = '550e8400-e29b-41d4-a716-446655440001';
