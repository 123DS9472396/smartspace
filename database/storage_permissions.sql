-- ============================================================
-- STORAGE BUCKET SETUP FOR USER DOCUMENTS
-- Run this in Supabase SQL Editor AFTER creating the bucket
-- ============================================================

-- First, create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage → New bucket
-- 2. Name: user-documents
-- 3. UNCHECK "Public bucket" (keep private)
-- 4. Click Create

-- Then run these policies:

-- Allow anyone to upload (for demo purposes - disable RLS like we did for tables)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create very permissive policies for demo mode
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'user-documents');

DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
CREATE POLICY "Allow public select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'user-documents');

DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
CREATE POLICY "Allow public update" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'user-documents');

DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'user-documents');

-- ============================================================
-- DONE! Now documents can be uploaded by anyone
-- ============================================================
