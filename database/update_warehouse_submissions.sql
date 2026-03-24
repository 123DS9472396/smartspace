-- CLEAN UPDATE SCRIPT FOR EXISTING WAREHOUSE_SUBMISSIONS TABLE
-- Run this script after you have already created the basic warehouse_submissions table

-- First, let's create the missing handle_updated_at function that Supabase needs
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the admin check function. This first checks `public.users` for a role
-- column, falling back to `public.profiles` if it exists. Run as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  users_exists BOOLEAN;
  profiles_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') INTO users_exists;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') INTO profiles_exists;

  IF users_exists THEN
    RETURN EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR user_type = 'admin')
    );
  ELSIF profiles_exists THEN
    RETURN EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
    );
  ELSE
    -- No users/profiles table found; default to false
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing columns to warehouse_submissions if they don't exist
ALTER TABLE public.warehouse_submissions 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

ALTER TABLE public.warehouse_submissions 
ADD COLUMN IF NOT EXISTS document_urls JSONB DEFAULT '{}';

ALTER TABLE public.warehouse_submissions 
ADD COLUMN IF NOT EXISTS ocr_results JSONB DEFAULT '{}';

-- Update the table to use proper column names that match our code
-- Only add the column if it doesn't exist to avoid conflicts
DO $$ 
BEGIN
  -- If an old 'images' column exists and the new 'image_urls' does not, rename it.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'images'
      AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'image_urls'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.warehouse_submissions RENAME COLUMN images TO image_urls;

  -- If both exist (migration partially applied), copy data from images -> image_urls where new is empty
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'images'
      AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'image_urls'
      AND table_schema = 'public'
  ) THEN
    EXECUTE 'UPDATE public.warehouse_submissions SET image_urls = images WHERE (image_urls IS NULL OR array_length(image_urls,1) = 0) AND images IS NOT NULL';
  END IF;

  -- If an old 'documents' column exists and the new 'document_urls' does not, rename it.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'documents'
      AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'document_urls'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.warehouse_submissions RENAME COLUMN documents TO document_urls;

  -- If both exist, merge docs where new is empty
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'documents'
      AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_submissions'
      AND column_name = 'document_urls'
      AND table_schema = 'public'
  ) THEN
    EXECUTE 'UPDATE public.warehouse_submissions SET document_urls = documents::jsonb WHERE (document_urls IS NULL OR document_urls = ''{}''::jsonb) AND documents IS NOT NULL';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add admin view policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
           WHERE tablename = 'warehouse_submissions' 
           AND policyname = 'Admins can view all submissions') THEN
    EXECUTE $pol$CREATE POLICY "Admins can view all submissions" ON public.warehouse_submissions FOR SELECT USING (public.is_admin())$pol$;
  END IF;

  -- Add admin update policy  
  IF NOT EXISTS (SELECT 1 FROM pg_policies 
           WHERE tablename = 'warehouse_submissions' 
           AND policyname = 'Admins can update all submissions') THEN
    EXECUTE $pol$CREATE POLICY "Admins can update all submissions" ON public.warehouse_submissions FOR UPDATE USING (public.is_admin())$pol$;
  END IF;
END $$;

-- Add updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS handle_updated_at_warehouse_submissions ON public.warehouse_submissions;
CREATE TRIGGER handle_updated_at_warehouse_submissions
    BEFORE UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to move approved submission to warehouses table
CREATE OR REPLACE FUNCTION public.move_submission_to_warehouses()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to approved, create warehouse entry
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Insert into warehouses table with proper column mapping
    -- Insert a new warehouse row using the submission data. Map the
    -- submission's image_urls -> images and document_urls -> documents.
    INSERT INTO public.warehouses (
      name,
      description,
      address,
      city,
      state,
      pincode,
      total_area,
      price_per_sqft,
      amenities,
      features,
      images,
      documents,
      status,
      owner_id,
      created_at,
      updated_at,
      approved_at,
      approved_by,
      submission_id
    ) VALUES (
      NEW.name,
      NEW.description,
      NEW.address,
      NEW.city,
      NEW.state,
      NEW.pincode,
      NEW.total_area,
      NEW.price_per_sqft,
      COALESCE(NEW.amenities, '{}'),
      COALESCE(NEW.features, '{}'),
      COALESCE(NEW.image_urls, '{}'),
  COALESCE(NEW.document_urls, '{}'::jsonb),
  'active',
  NEW.owner_id,
  NOW(),
  NOW(),
  COALESCE(NEW.reviewed_at, NOW()),
  -- prefer reviewed_by set by the updater; fall back to auth.uid() if available
  COALESCE(NULLIF(NEW.reviewed_by, '')::uuid, NULLIF(auth.uid(), '')::uuid),
  NEW.id
    );
    
    RAISE NOTICE 'Moved approved submission % to warehouses table', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-move approved submissions (remove if exists first)
DROP TRIGGER IF EXISTS move_approved_submission_to_warehouses ON public.warehouse_submissions;
CREATE TRIGGER move_approved_submission_to_warehouses
    AFTER UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE FUNCTION public.move_submission_to_warehouses();

-- Ensure warehouses table has the required columns
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Create storage buckets if they don't exist (Supabase specific)
-- Note: These commands might need to be run separately in Supabase dashboard
INSERT INTO storage.buckets (id, name, public) 
VALUES ('warehouse-images', 'warehouse-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('warehouse-documents', 'warehouse-documents', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view images') THEN
    EXECUTE $pol$CREATE POLICY "Public can view images" ON storage.objects FOR SELECT USING (bucket_id = 'warehouse-images')$pol$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload images') THEN
    EXECUTE $pol$CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'warehouse-images' AND auth.role() = 'authenticated')$pol$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view documents') THEN
    EXECUTE $pol$CREATE POLICY "Public can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'warehouse-documents')$pol$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload documents') THEN
    EXECUTE $pol$CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'warehouse-documents' AND auth.role() = 'authenticated')$pol$;
  END IF;
END$$;

-- Add helpful comments
COMMENT ON TABLE public.warehouse_submissions IS 'Stores pending warehouse listings waiting for admin approval';
COMMENT ON FUNCTION public.move_submission_to_warehouses() IS 'Automatically moves approved submissions to public warehouses table';
COMMENT ON FUNCTION public.is_admin() IS 'Checks if current user has admin privileges';

-- Success message
SELECT 'Database setup completed successfully! ✅' as status;