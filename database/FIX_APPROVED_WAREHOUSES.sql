-- ═══════════════════════════════════════════════════════════════
-- FIX APPROVED WAREHOUSES SO THEY SHOW IN PUBLIC SEARCH
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Check current status of approved warehouses
SELECT 
  name, 
  city, 
  state, 
  status,
  submission_id,
  created_at
FROM warehouses
WHERE submission_id IS NOT NULL
ORDER BY created_at DESC;

-- 2. Update approved warehouses to ensure they're searchable
UPDATE warehouses
SET 
  state = COALESCE(state, 'Maharashtra'),
  status = 'active'
WHERE submission_id IS NOT NULL;

-- 3. Verify the fix
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
  '✅ Approved warehouses fixed!' as status,
  'korum and Mega Logistics Center should now show in search!' as message;
