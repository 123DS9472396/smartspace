-- ═══════════════════════════════════════════════════════════════
-- SIMPLE DIAGNOSTIC - Just check if data exists
-- ═══════════════════════════════════════════════════════════════

-- 1. Count approved submissions
SELECT 
  COUNT(*) as approved_submission_count,
  '📝 Approved submissions in warehouse_submissions table' as description
FROM warehouse_submissions
WHERE status = 'approved';

-- 2. List them
SELECT 
  name,
  city,
  state,
  status,
  '📝 From warehouse_submissions' as source
FROM warehouse_submissions
WHERE status = 'approved';

-- 3. Count warehouses with submission_id
SELECT 
  COUNT(*) as warehouse_count,
  '🏭 Warehouses created from submissions' as description
FROM warehouses
WHERE submission_id IS NOT NULL;

-- 4. List them
SELECT 
  name,
  city,
  state,
  status,
  submission_id,
  '🏭 From warehouses table' as source
FROM warehouses
WHERE submission_id IS NOT NULL;

-- 5. Search for korum in BOTH tables
SELECT 
  COUNT(*) as korum_in_warehouses,
  '🔍 korum found in warehouses table' as description
FROM warehouses
WHERE LOWER(name) LIKE '%korum%';

SELECT 
  COUNT(*) as korum_in_submissions,
  '🔍 korum found in warehouse_submissions table' as description
FROM warehouse_submissions
WHERE LOWER(name) LIKE '%korum%' AND status = 'approved';

-- 6. Check if state is NULL
SELECT 
  name,
  state,
  status,
  CASE 
    WHEN state IS NULL THEN '❌ NULL state (will not appear in search)'
    WHEN state != 'Maharashtra' THEN '❌ Wrong state (will not appear in search)'
    ELSE '✅ Correct state'
  END as state_check
FROM warehouses
WHERE submission_id IS NOT NULL;
