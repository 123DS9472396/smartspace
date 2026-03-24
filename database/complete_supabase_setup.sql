-- COMPLETE SUPABASE SETUP - Fix all submission issues
-- Run this script in Supabase SQL Editor to fix storage buckets and tables

-- 1. Create warehouse_submissions table (if not exists)
CREATE TABLE IF NOT EXISTS public.warehouse_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    total_area INTEGER NOT NULL,
    price_per_sqft INTEGER NOT NULL,
    amenities JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    image_urls JSONB DEFAULT '[]',
    document_urls JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on warehouse_submissions
ALTER TABLE public.warehouse_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for warehouse_submissions
CREATE POLICY "Users can view own submissions" ON public.warehouse_submissions
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own submissions" ON public.warehouse_submissions
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 4. Create storage buckets (requires admin privileges)
-- Note: These need to be created in the Supabase Dashboard Storage section
-- Go to Storage > Create Bucket and create:
-- - warehouse-images (public)
-- - warehouse-documents (public)

-- 5. Create policies for storage buckets
-- (Run these after creating the buckets in the dashboard)

-- Policy for warehouse-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('warehouse-images', 'warehouse-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('warehouse-documents', 'warehouse-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage policies for warehouse-images
CREATE POLICY "Anyone can upload images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'warehouse-images');

CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT 
USING (bucket_id = 'warehouse-images');

CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE 
USING (bucket_id = 'warehouse-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Create storage policies for warehouse-documents
CREATE POLICY "Anyone can upload documents" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'warehouse-documents');

CREATE POLICY "Anyone can view documents" ON storage.objects FOR SELECT 
USING (bucket_id = 'warehouse-documents');

CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE 
USING (bucket_id = 'warehouse-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Ensure profiles table exists (for admin check)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    name TEXT,
    user_type TEXT DEFAULT 'seeker' CHECK (user_type IN ('seeker', 'owner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 10. Create profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 11. Re-run the functions and triggers from final_warehouse_setup.sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Add admin policies for warehouse_submissions
CREATE POLICY "Admins can view all submissions" ON public.warehouse_submissions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all submissions" ON public.warehouse_submissions
  FOR UPDATE USING (public.is_admin());

-- 13. Add triggers
DROP TRIGGER IF EXISTS handle_updated_at_warehouse_submissions ON public.warehouse_submissions;
CREATE TRIGGER handle_updated_at_warehouse_submissions
    BEFORE UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. Function to move approved submissions to warehouses
CREATE OR REPLACE FUNCTION public.move_submission_to_warehouses()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.warehouses (
      name, description, address, city, state, pincode,
      total_area, price_per_sqft, amenities, features, images,
      status, owner_id, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.description, NEW.address, NEW.city, NEW.state, NEW.pincode,
      NEW.total_area, NEW.price_per_sqft, 
      COALESCE(NEW.amenities, '[]'),
      COALESCE(NEW.features, '[]'),
      COALESCE(NEW.image_urls, '[]'),
      'active', NEW.owner_id, NOW(), NOW()
    );
    RAISE NOTICE 'Moved approved submission % to warehouses table', NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Create auto-move trigger
DROP TRIGGER IF EXISTS move_approved_submission_to_warehouses ON public.warehouse_submissions;
CREATE TRIGGER move_approved_submission_to_warehouses
    AFTER UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE FUNCTION public.move_submission_to_warehouses();

-- 16. Success message
SELECT 'Complete Supabase setup finished! ✅' as status,
       'Storage buckets and tables ready for warehouse submissions' as message;