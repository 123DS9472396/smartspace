-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Verify current state of approved submissions
-- ═══════════════════════════════════════════════════════════════

-- Check if approved submissions exist
SELECT 
  id,
  name,
  city,
  state,
  status,
  owner_id,
  total_area,
  price_per_sqft,
  created_at,
  reviewed_at
FROM warehouse_submissions
WHERE status = 'approved'
ORDER BY reviewed_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Check if warehouses were created from submissions
-- ═══════════════════════════════════════════════════════════════

-- Look for warehouses with submission_id
SELECT 
  id,
  wh_id,
  name,
  city,
  district,
  state,
  status,
  submission_id,
  created_at
FROM warehouses
WHERE submission_id IS NOT NULL
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Search for korum and Mega Logistics by name
-- ═══════════════════════════════════════════════════════════════

-- Search warehouses table
SELECT 
  id,
  wh_id,
  name,
  city,
  district,
  state,
  status,
  submission_id,
  owner_id
FROM warehouses
WHERE LOWER(name) LIKE '%korum%'
   OR LOWER(name) LIKE '%mega%logistics%'
   OR LOWER(name) LIKE '%logistics%center%';

-- ═══════════════════════════════════════════════════════════════
-- STEP 4: If no warehouses found, CREATE them manually with EXACT data
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Delete any partial/broken entries first
DELETE FROM warehouses
WHERE submission_id IN (
  SELECT id FROM warehouse_submissions WHERE status = 'approved'
)
AND status != 'active';

-- Insert warehouses from approved submissions with EXACT correct mapping
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
  uuid_generate_v4(),
  'WH-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 8)),
  ws.name,
  COALESCE(ws.description, 'Premium warehouse facility'),
  ws.address,
  ws.city,
  ws.city,  -- Use city as district
  'Maharashtra',  -- Hardcode state
  ws.pincode,
  ws.total_area,
  ws.total_area,  -- Use total_area as capacity
  ws.price_per_sqft,
  'General Warehouse',
  COALESCE(ws.images, ARRAY[]::text[]),  -- text[] type
  COALESCE(ws.amenities, ARRAY[]::text[]),  -- text[] type
  COALESCE(ws.features, ARRAY[]::text[]),  -- text[] type
  COALESCE(ws.images, ARRAY[]::text[]),  -- documents use images
  'active',  -- CRITICAL: Must be 'active' for search
  ws.owner_id,
  ws.id,
  COALESCE(ws.reviewed_at, NOW()),
  NOW(),
  NOW()
FROM warehouse_submissions ws
WHERE ws.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.submission_id = ws.id
    AND w.status = 'active'  -- Only skip if active warehouse exists
  );

-- ═══════════════════════════════════════════════════════════════
-- STEP 5: Verify the fix worked
-- ═══════════════════════════════════════════════════════════════

-- Count warehouses created
SELECT 
  COUNT(*) as total_warehouses_with_submission_id,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_warehouses,
  COUNT(CASE WHEN state = 'Maharashtra' THEN 1 END) as maharashtra_warehouses
FROM warehouses
WHERE submission_id IS NOT NULL;

-- Show the created warehouses
SELECT 
  wh_id,
  name,
  city,
  district,
  state,
  status,
  total_area,
  price_per_sqft,
  '✅ Created from submission' as source
FROM warehouses
WHERE submission_id IS NOT NULL
ORDER BY created_at DESC;

-- Final verification: Search like the app does
SELECT 
  COUNT(*) as search_result_count,
  '🔍 This is what search should find for korum' as message
FROM warehouses
WHERE state = 'Maharashtra'
  AND status = 'active'
  AND (LOWER(name) LIKE '%korum%' OR LOWER(city) LIKE '%korum%');
