-- Add warehouse_submissions table for admin approval workflow

CREATE TABLE IF NOT EXISTS public.warehouse_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  total_area NUMERIC(10, 2) NOT NULL,
  price_per_sqft NUMERIC(10, 2) NOT NULL,
  amenities TEXT[],
  features TEXT[],
  image_urls TEXT[],
  document_urls JSONB,
  ocr_results JSONB,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_owner_id ON public.warehouse_submissions(owner_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_status ON public.warehouse_submissions(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_submitted_at ON public.warehouse_submissions(submitted_at);

-- Enable RLS
ALTER TABLE public.warehouse_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warehouse_submissions
CREATE POLICY "Owners can view own submissions" ON public.warehouse_submissions
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert own submissions" ON public.warehouse_submissions
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own pending submissions" ON public.warehouse_submissions
  FOR UPDATE USING (owner_id = auth.uid() AND status = 'pending');

-- Admin policies (need to create admin check function)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all submissions" ON public.warehouse_submissions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all submissions" ON public.warehouse_submissions
  FOR UPDATE USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_warehouse_submissions
    BEFORE UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to move approved submission to warehouses table
CREATE OR REPLACE FUNCTION public.move_submission_to_warehouses()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to approved, create warehouse entry
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.warehouses (
      owner_id,
      warehouse_name,
      description,
      address,
      city,
      state,
      pincode,
      total_size_sqft,
      pricing_inr_sqft_month,
      amenities,
      features,
      images,
      is_verified,
      is_active,
      verification_date
    ) VALUES (
      NEW.owner_id,
      NEW.name,
      NEW.description,
      NEW.address,
      NEW.city,
      NEW.state,
      NEW.pincode,
      NEW.total_area::INTEGER,
      NEW.price_per_sqft,
      NEW.amenities,
      NEW.features,
      NEW.image_urls,
      true,
      true,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-move approved submissions
CREATE TRIGGER move_approved_submission_to_warehouses
    AFTER UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE PROCEDURE public.move_submission_to_warehouses();