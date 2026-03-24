-- FINAL CLEAN SCRIPT - Only adds missing components without conflicts
-- This script is safe to run and won't cause column exists errors

-- 1. Create the missing handle_updated_at function that Supabase needs
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add admin policies only if they don't exist
DO $$ 
BEGIN
    -- Add admin view policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE tablename = 'warehouse_submissions' 
                   AND policyname = 'Admins can view all submissions') THEN
        CREATE POLICY "Admins can view all submissions" ON public.warehouse_submissions
          FOR SELECT USING (public.is_admin());
    END IF;

    -- Add admin update policy  
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE tablename = 'warehouse_submissions' 
                   AND policyname = 'Admins can update all submissions') THEN
        CREATE POLICY "Admins can update all submissions" ON public.warehouse_submissions
          FOR UPDATE USING (public.is_admin());
    END IF;
END $$;

-- 4. Add updated_at trigger (safe to recreate)
DROP TRIGGER IF EXISTS handle_updated_at_warehouse_submissions ON public.warehouse_submissions;
CREATE TRIGGER handle_updated_at_warehouse_submissions
    BEFORE UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Function to move approved submission to warehouses table
CREATE OR REPLACE FUNCTION public.move_submission_to_warehouses()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to approved, create warehouse entry
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Insert into warehouses table with proper column mapping
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
      status,
      owner_id,
      created_at,
      updated_at
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
      'active',
      NEW.owner_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Moved approved submission % to warehouses table', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-move approved submissions (safe to recreate)
DROP TRIGGER IF EXISTS move_approved_submission_to_warehouses ON public.warehouse_submissions;
CREATE TRIGGER move_approved_submission_to_warehouses
    AFTER UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE FUNCTION public.move_submission_to_warehouses();

-- 7. Ensure warehouses table has the required columns
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 8. Success message
SELECT 'Database setup completed successfully! ✅' as status,
       'warehouse_submissions table ready for admin workflow' as message;