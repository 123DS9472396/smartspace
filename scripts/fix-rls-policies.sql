-- Fix RLS policies for warehouses table
-- This allows anonymous users to READ warehouse data

-- First, disable RLS temporarily to check if that's the issue
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, add a policy that allows anyone to read
-- ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Allow anonymous read access" ON warehouses;

-- CREATE POLICY "Allow anonymous read access"
-- ON warehouses
-- FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'warehouses';
