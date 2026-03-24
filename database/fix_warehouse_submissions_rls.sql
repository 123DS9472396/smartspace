-- Fix warehouse_submissions RLS policies
-- This allows properly authenticated owners to create their own submissions

-- First, ensure the table has RLS enabled
ALTER TABLE public.warehouse_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "warehouse_submissions_owner_select" ON public.warehouse_submissions;
DROP POLICY IF EXISTS "warehouse_submissions_owner_insert" ON public.warehouse_submissions;
DROP POLICY IF EXISTS "warehouse_submissions_owner_update" ON public.warehouse_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.warehouse_submissions;
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.warehouse_submissions;

-- POLICY 1: Owners can SELECT their own submissions
CREATE POLICY "warehouse_submissions_owner_select"
ON public.warehouse_submissions FOR SELECT
USING (owner_id = auth.uid());

-- POLICY 2: Owners can INSERT their own submissions
-- Using WITH CHECK to verify the owner_id matches the authenticated user
CREATE POLICY "warehouse_submissions_owner_insert"
ON public.warehouse_submissions FOR INSERT
WITH CHECK (
  owner_id = auth.uid() 
  AND auth.role() = 'authenticated'
);

-- POLICY 3: Owners can UPDATE their own pending submissions
CREATE POLICY "warehouse_submissions_owner_update"
ON public.warehouse_submissions FOR UPDATE
USING (
  owner_id = auth.uid() 
  AND status = 'pending'
);

-- POLICY 4: Admin can view all submissions
-- Using is_admin() function that checks profiles table
CREATE POLICY "warehouse_submissions_admin_select"
ON public.warehouse_submissions FOR SELECT
USING (public.is_admin());

-- POLICY 5: Admin can update all submissions
CREATE POLICY "warehouse_submissions_admin_update"
ON public.warehouse_submissions FOR UPDATE
USING (public.is_admin());

-- POLICY 6: Service role can do anything (for server-side operations)
-- This is a fallback for service operations
CREATE POLICY "warehouse_submissions_service_role"
ON public.warehouse_submissions
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Verify policies
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'warehouse_submissions'
ORDER BY policyname;
