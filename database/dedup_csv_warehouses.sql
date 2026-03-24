-- ============================================================
-- Deduplicate CSV-imported warehouses
-- Keeps the OLDEST row (first import) for each duplicate name+city
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Preview duplicates before deleting (run first to verify)
SELECT name, city, COUNT(*) as count
FROM warehouses
GROUP BY name, city
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Delete duplicates, keeping only the first (oldest) row per name+city
DELETE FROM warehouses
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(TRIM(name)), LOWER(TRIM(city)))
    id
  FROM warehouses
  ORDER BY LOWER(TRIM(name)), LOWER(TRIM(city)), created_at ASC
);

-- 3. Verify result - should show all counts = 1
SELECT name, city, COUNT(*) as count
FROM warehouses
GROUP BY name, city
ORDER BY name;

-- 4. Optional: also deduplicate warehouse_submissions if duplicated there
DELETE FROM warehouse_submissions
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(TRIM(name)), LOWER(TRIM(city)))
    id
  FROM warehouse_submissions
  ORDER BY LOWER(TRIM(name)), LOWER(TRIM(city)), created_at ASC
);
