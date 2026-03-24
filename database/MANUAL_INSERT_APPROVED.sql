-- ═══════════════════════════════════════════════════════════════
-- MANUAL FIX: Insert approved warehouses directly
-- Run this in Supabase SQL Editor if trigger isn't working
-- ═══════════════════════════════════════════════════════════════

-- First, let's manually create the warehouses from approved submissions
INSERT INTO warehouses (
  id,
  wh_id,
  name,
  description,
  address,
  city,
  district,
  state,
  pincode,
  total_area,
  capacity,
  price_per_sqft,
  warehouse_type,
  images,
  amenities,
  features,
  documents,
  status,
  owner_id,
  submission_id,
  approved_at,
  created_at,
  updated_at
)
SELECT 
  uuid_generate_v4() as id,
  'WH-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 8)) as wh_id,
  ws.name,
  ws.description,
  ws.address,
  ws.city,
  ws.city as district,
  COALESCE(ws.state, 'Maharashtra') as state,
  ws.pincode,
  ws.total_area,
  ws.total_area as capacity,
  ws.price_per_sqft,
  'General Warehouse' as warehouse_type,
  COALESCE(ws.images, '{}') as images,
  COALESCE(ws.amenities, '{}') as amenities,
  COALESCE(ws.features, '{}') as features,
  COALESCE(ws.images, '{}') as documents,
  'active' as status,
  ws.owner_id,
  ws.id as submission_id,
  ws.reviewed_at as approved_at,
  NOW() as created_at,
  NOW() as updated_at
FROM warehouse_submissions ws
WHERE ws.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.submission_id = ws.id
  );

-- Check results
SELECT 
  name,
  city,
  state,
  status,
  submission_id
FROM warehouses
WHERE submission_id IS NOT NULL
ORDER BY created_at DESC;

-- Success message
SELECT 
  COUNT(*) as warehouses_created,
  '✅ Manually inserted approved warehouses!' as message
FROM warehouses
WHERE submission_id IS NOT NULL;
