-- ═══════════════════════════════════════════════════════════════
-- DEBUG: Why can't we find approved warehouses?
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Find ALL warehouses with "korum" in the name (case-insensitive)
SELECT 
  id,
  wh_id,
  name,
  city,
  state,
  status,
  submission_id,
  created_at
FROM warehouses
WHERE LOWER(name) LIKE '%korum%'
ORDER BY created_at DESC;

-- 2. Find ALL warehouses with "Mega Logistics" in the name
SELECT 
  id,
  wh_id,
  name,
  city,
  state,
  status,
  submission_id,
  created_at
FROM warehouses
WHERE LOWER(name) LIKE '%mega%logistics%'
ORDER BY created_at DESC;

-- 3. Check if ANY warehouses have submission_id set
SELECT COUNT(*) as total_approved_warehouses
FROM warehouses
WHERE submission_id IS NOT NULL;

-- 4. Show ALL columns for approved warehouses to see what's wrong
SELECT *
FROM warehouses
WHERE submission_id IS NOT NULL
LIMIT 5;

-- 5. Check the warehouse_submissions table for approved items
SELECT 
  id,
  name,
  city,
  state,
  status,
  reviewed_at
FROM warehouse_submissions
WHERE status = 'approved'
ORDER BY reviewed_at DESC;
