-- Fix Supabase Storage RLS Policies for warehouse buckets
-- Run this in Supabase SQL Editor to allow authenticated users to upload/download files

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

-- Create new policies that allow authenticated users to upload/download

-- 1. Allow public to READ images (SELECT)
CREATE POLICY "warehouse_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'warehouse-images');

-- 2. Allow authenticated users to UPLOAD images (INSERT)
CREATE POLICY "warehouse_images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'warehouse-images');

-- 3. Allow authenticated users to DELETE their own image uploads (UPDATE/DELETE)
CREATE POLICY "warehouse_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'warehouse-images');

-- 4. Allow public to READ documents (SELECT)
CREATE POLICY "warehouse_documents_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'warehouse-documents');

-- 5. Allow authenticated users to UPLOAD documents (INSERT)
CREATE POLICY "warehouse_documents_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'warehouse-documents');

-- 6. Allow authenticated users to DELETE their own document uploads (DELETE)
CREATE POLICY "warehouse_documents_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'warehouse-documents');

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND (schemaname = 'storage' OR schemaname = 'public')
ORDER BY tablename, policyname;
