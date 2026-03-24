-- SmartSpace Platform Enhancement - Database Schema Updates
-- Add new tables and columns for pricing recommendations, product calculator, and OCR verification
-- Run this in Supabase SQL Editor AFTER the main schema.sql

-- ============================================
-- 1. CREATE pricing_reference TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  avg_price_per_sqft NUMERIC NOT NULL,
  demand_score INTEGER CHECK (demand_score >= 1 AND demand_score <= 10),
  warehouse_count INTEGER DEFAULT 0,
  avg_occupancy NUMERIC DEFAULT 0.7,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pricing_city ON public.pricing_reference(city);
CREATE INDEX IF NOT EXISTS idx_pricing_district ON public.pricing_reference(district);
CREATE INDEX IF NOT EXISTS idx_pricing_demand ON public.pricing_reference(demand_score DESC);

-- ============================================
-- 2. UPDATE profiles TABLE
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seeker_type TEXT 
CHECK (seeker_type IN ('farmer', 'wholesaler', 'quickcommerce', 'msme', 'industrial'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en'
CHECK (language_preference IN ('en', 'hi', 'mr'));

-- Add comment
COMMENT ON COLUMN public.profiles.seeker_type IS 'Type of seeker: farmer, wholesaler, quickcommerce (Zepto/Blinkit), msme, or industrial';
COMMENT ON COLUMN public.profiles.language_preference IS 'User language preference: en (English), hi (Hindi), mr (Marathi)';

-- ============================================
-- 3. UPDATE bookings TABLE
-- ============================================
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS product_details JSONB;

-- Add comment explaining structure
COMMENT ON COLUMN public.bookings.product_details IS 'For farmer bookings: {product_type, quantity, unit, weight_per_unit_kg, market_price_per_kg, total_product_value, insurance_percentage, insurance_amount}';

-- ============================================
-- 4. CREATE ml_recommendations TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ml_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL,
  recommended_warehouses JSONB NOT NULL,
  algorithm_used TEXT NOT NULL,
  clicked_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  booked BOOLEAN DEFAULT false,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ml_recommendations_seeker ON public.ml_recommendations(seeker_id);
CREATE INDEX IF NOT EXISTS idx_ml_recommendations_clicked ON public.ml_recommendations(clicked_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_ml_recommendations_algorithm ON public.ml_recommendations(algorithm_used);
CREATE INDEX IF NOT EXISTS idx_ml_recommendations_created ON public.ml_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE public.ml_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own recommendations
CREATE POLICY "Users can view own ML recommendations" ON public.ml_recommendations
  FOR SELECT USING (auth.uid() = seeker_id);

CREATE POLICY "Users can insert own ML recommendations" ON public.ml_recommendations
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);

-- ============================================
-- 5. CREATE document_verifications TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_submission_id UUID REFERENCES public.warehouse_submissions(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  ocr_extracted_text TEXT,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  validation_status TEXT CHECK (validation_status IN ('pending', 'passed', 'failed', 'manual_review')) DEFAULT 'pending',
  validation_errors TEXT[],
  detected_fields JSONB,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doc_verifications_submission ON public.document_verifications(warehouse_submission_id);
CREATE INDEX IF NOT EXISTS idx_doc_verifications_status ON public.document_verifications(validation_status);
CREATE INDEX IF NOT EXISTS idx_doc_verifications_type ON public.document_verifications(document_type);

-- Enable RLS
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all document verifications" ON public.document_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Owners can view own document verifications" ON public.document_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.warehouse_submissions 
      WHERE warehouse_submissions.id = warehouse_submission_id 
      AND warehouse_submissions.owner_id = auth.uid()
    )
  );

-- ============================================
-- 6. CREATE product_market_prices TABLE (Mock Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL,
  product_category TEXT NOT NULL,
  current_price_per_kg NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  market_name TEXT DEFAULT 'Maharashtra APMC',
  price_trend TEXT CHECK (price_trend IN ('rising', 'stable', 'falling')) DEFAULT 'stable',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_prices_type ON public.product_market_prices(product_type);
CREATE INDEX IF NOT EXISTS idx_product_prices_category ON public.product_market_prices(product_category);

-- ============================================
-- 7. ADD TRIGGER for timestamp updates
-- ============================================

-- Trigger for pricing_reference
CREATE TRIGGER update_pricing_reference_timestamp
  BEFORE UPDATE ON public.pricing_reference
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. CREATE FUNCTIONS for analytics
-- ============================================

-- Function to get warehouse recommendation statistics
CREATE OR REPLACE FUNCTION public.get_recommendation_stats(user_id UUID)
RETURNS TABLE (
  total_recommendations BIGINT,
  total_clicks BIGINT,
  total_bookings BIGINT,
  click_through_rate NUMERIC,
  booking_conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_recommendations,
    COUNT(clicked_warehouse_id) as total_clicks,
    COUNT(*) FILTER (WHERE booked = true) as total_bookings,
    ROUND((COUNT(clicked_warehouse_id)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as click_through_rate,
    ROUND((COUNT(*) FILTER (WHERE booked = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as booking_conversion_rate
  FROM public.ml_recommendations
  WHERE seeker_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pricing trends for a city
CREATE OR REPLACE FUNCTION public.get_city_pricing_trend(city_name TEXT)
RETURNS TABLE (
  city TEXT,
  avg_price NUMERIC,
  demand_score INTEGER,
  warehouse_count INTEGER,
  comparison_to_state_avg NUMERIC
) AS $$
DECLARE
  state_avg NUMERIC;
BEGIN
  -- Calculate state average
  SELECT AVG(avg_price_per_sqft) INTO state_avg
  FROM public.pricing_reference;
  
  RETURN QUERY
  SELECT 
    pr.city,
    pr.avg_price_per_sqft,
    pr.demand_score,
    pr.warehouse_count,
    ROUND(((pr.avg_price_per_sqft - state_avg) / NULLIF(state_avg, 0)) * 100, 2) as comparison_to_state_avg
  FROM public.pricing_reference pr
  WHERE pr.city = city_name
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_reference', 'ml_recommendations', 'document_verifications', 'product_market_prices')
ORDER BY table_name;

-- Verify columns added to profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('seeker_type', 'language_preference');

-- Verify column added to bookings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'product_details';

