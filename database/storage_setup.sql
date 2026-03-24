-- ============================================================
-- Supabase Storage Setup - Run in SQL Editor
-- ============================================================

-- Note: Storage buckets are typically created via Supabase Dashboard
-- Go to: Storage > New Bucket

-- Bucket 1: warehouse-images
-- - Public: Yes (for displaying images)
-- - File size limit: 5MB
-- - Allowed types: image/jpeg, image/png, image/webp

-- Bucket 2: user-documents
-- - Public: No (private documents)
-- - File size limit: 10MB
-- - Allowed types: application/pdf, image/jpeg, image/png

-- Bucket 3: profile-images
-- - Public: Yes (for avatars)
-- - File size limit: 2MB
-- - Allowed types: image/jpeg, image/png, image/webp

-- ============================================================
-- Storage Policies (run after creating buckets)
-- ============================================================

-- For warehouse-images bucket
CREATE POLICY "Anyone can view warehouse images"
ON storage.objects FOR SELECT
USING (bucket_id = 'warehouse-images');

CREATE POLICY "Owners can upload warehouse images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'warehouse-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Owners can update their warehouse images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'warehouse-images' AND
  auth.uid() = owner
);

CREATE POLICY "Owners can delete their warehouse images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'warehouse-images' AND
  auth.uid() = owner
);

-- For user-documents bucket (private)
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' AND
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- For profile-images bucket
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create 3 buckets: warehouse-images, user-documents, profile-images
-- 3. Run the policies above in SQL Editor
-- ============================================================
