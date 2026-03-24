-- ============================================
-- SmartSpace Platform - SAFE DATABASE SETUP
-- ============================================
-- This script safely updates existing database OR creates from scratch
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Add missing columns to existing tables
-- ============================================

-- Add missing columns to warehouses table (safe - won't error if column exists)
DO $$ 
BEGIN
  -- Add is_active if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='is_active') THEN
    ALTER TABLE public.warehouses ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Add is_verified if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='is_verified') THEN
    ALTER TABLE public.warehouses ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add district if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='district') THEN
    ALTER TABLE public.warehouses ADD COLUMN district TEXT;
  END IF;
  
  -- Add grid columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='total_blocks') THEN
    ALTER TABLE public.warehouses ADD COLUMN total_blocks INTEGER DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='available_blocks') THEN
    ALTER TABLE public.warehouses ADD COLUMN available_blocks INTEGER DEFAULT 50;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='grid_rows') THEN
    ALTER TABLE public.warehouses ADD COLUMN grid_rows INTEGER DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouses' AND column_name='grid_cols') THEN
    ALTER TABLE public.warehouses ADD COLUMN grid_cols INTEGER DEFAULT 10;
  END IF;
END $$;

-- Add missing columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='seeker_type') THEN
    ALTER TABLE public.profiles ADD COLUMN seeker_type TEXT CHECK (seeker_type IN ('farmer', 'wholesaler', 'quickcommerce', 'msme', 'industrial'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='language_preference') THEN
    ALTER TABLE public.profiles ADD COLUMN language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'hi', 'mr'));
  END IF;
END $$;

-- Add missing column to bookings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='product_details') THEN
    ALTER TABLE public.bookings ADD COLUMN product_details JSONB;
  END IF;
END $$;

-- ============================================
-- STEP 2: Create new tables (only if not exist)
-- ============================================

-- Pricing reference table
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

-- ML recommendations table
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

-- Product market prices table
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

-- Storage rate config table
CREATE TABLE IF NOT EXISTS public.storage_rate_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_category TEXT NOT NULL,
  storage_type_required TEXT NOT NULL,
  rate_per_kg_per_day NUMERIC NOT NULL,
  min_storage_days INTEGER DEFAULT 7,
  insurance_percentage NUMERIC DEFAULT 2.0,
  special_handling_required BOOLEAN DEFAULT false,
  temperature_control TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pricing_city ON public.pricing_reference(city);
CREATE INDEX IF NOT EXISTS idx_pricing_district ON public.pricing_reference(district);
CREATE INDEX IF NOT EXISTS idx_ml_recommendations_seeker ON public.ml_recommendations(seeker_id);
CREATE INDEX IF NOT EXISTS idx_ml_recommendations_algorithm ON public.ml_recommendations(algorithm_used);
CREATE INDEX IF NOT EXISTS idx_product_prices_type ON public.product_market_prices(product_type);

-- ============================================
-- STEP 4: Enable RLS
-- ============================================

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create/Update RLS policies
-- ============================================

-- Warehouses policies
DROP POLICY IF EXISTS "Everyone can view active verified warehouses" ON public.warehouses;
CREATE POLICY "Everyone can view active verified warehouses" ON public.warehouses
  FOR SELECT USING (is_active = true AND is_verified = true);

DROP POLICY IF EXISTS "Owners can view own warehouses" ON public.warehouses;
CREATE POLICY "Owners can view own warehouses" ON public.warehouses
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can insert own warehouses" ON public.warehouses;
CREATE POLICY "Owners can insert own warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update own warehouses" ON public.warehouses;
CREATE POLICY "Owners can update own warehouses" ON public.warehouses
  FOR UPDATE USING (owner_id = auth.uid());

-- ML recommendations policies
DROP POLICY IF EXISTS "Users can view own ML recommendations" ON public.ml_recommendations;
CREATE POLICY "Users can view own ML recommendations" ON public.ml_recommendations
  FOR SELECT USING (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Users can insert own ML recommendations" ON public.ml_recommendations;
CREATE POLICY "Users can insert own ML recommendations" ON public.ml_recommendations
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);

-- ============================================
-- STEP 6: Insert Maharashtra pricing data
-- ============================================

-- Clear existing data
TRUNCATE TABLE public.pricing_reference RESTART IDENTITY CASCADE;

INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
-- Mumbai Region (14 locations)
('Mumbai', 'Andheri East', 95.00, 10, 45, 0.92),
('Mumbai', 'Andheri West', 98.00, 10, 38, 0.95),
('Mumbai', 'Bandra East', 110.00, 10, 25, 0.97),
('Mumbai', 'Bandra West', 115.00, 10, 18, 0.98),
('Mumbai', 'Kurla', 70.00, 9, 52, 0.85),
('Mumbai', 'Vikhroli', 75.00, 9, 40, 0.88),
('Mumbai', 'Powai', 85.00, 9, 32, 0.90),
('Mumbai', 'Goregaon', 80.00, 9, 48, 0.87),
('Mumbai', 'Malad', 78.00, 9, 55, 0.86),
('Mumbai', 'Kandivali', 72.00, 8, 60, 0.84),
('Mumbai', 'Borivali', 68.00, 8, 65, 0.83),
('Mumbai', 'Mulund', 73.00, 8, 42, 0.85),
('Mumbai', 'Ghatkopar', 76.00, 9, 50, 0.86),
('Mumbai', 'Chembur', 82.00, 9, 38, 0.89),

-- Thane Region (8 locations)
('Thane', 'Thane City', 55.00, 8, 75, 0.82),
('Thane', 'Kalyan', 40.00, 7, 85, 0.78),
('Thane', 'Dombivli', 38.00, 7, 90, 0.76),
('Thane', 'Bhiwandi', 35.00, 8, 120, 0.88),
('Thane', 'Ambernath', 32.00, 6, 65, 0.74),
('Thane', 'Ulhasnagar', 36.00, 6, 70, 0.75),
('Thane', 'Mira Road', 45.00, 7, 55, 0.80),
('Thane', 'Virar', 30.00, 6, 48, 0.72),

-- Navi Mumbai (6 locations)
('Navi Mumbai', 'Vashi', 60.00, 8, 68, 0.85),
('Navi Mumbai', 'Airoli', 52.00, 8, 72, 0.83),
('Navi Mumbai', 'Rabale', 55.00, 8, 80, 0.86),
('Navi Mumbai', 'Mahape', 58.00, 8, 62, 0.84),
('Navi Mumbai', 'Taloja', 42.00, 7, 95, 0.81),
('Navi Mumbai', 'Panvel', 40.00, 7, 100, 0.79),

-- Pune Region (10 locations)
('Pune', 'Hinjewadi', 50.00, 8, 110, 0.87),
('Pune', 'Kharadi', 60.00, 9, 95, 0.90),
('Pune', 'Wakad', 45.00, 7, 88, 0.82),
('Pune', 'Pimpri', 42.00, 7, 105, 0.85),
('Pune', 'Chinchwad', 43.00, 7, 98, 0.84),
('Pune', 'Hadapsar', 48.00, 8, 92, 0.86),
('Pune', 'Chakan', 38.00, 8, 130, 0.91),
('Pune', 'Talegaon', 35.00, 7, 115, 0.88),
('Pune', 'Ranjangaon', 32.00, 7, 105, 0.85),
('Pune', 'Shikrapur', 30.00, 6, 85, 0.80),

-- Nashik (5 locations)
('Nashik', 'Nashik Road', 25.00, 6, 78, 0.75),
('Nashik', 'MIDC Ambad', 28.00, 7, 95, 0.82),
('Nashik', 'Satpur', 27.00, 7, 88, 0.80),
('Nashik', 'Sinnar', 22.00, 6, 70, 0.73),
('Nashik', 'Igatpuri', 20.00, 5, 45, 0.68),

-- Nagpur (5 locations)
('Nagpur', 'MIHAN', 35.00, 7, 120, 0.86),
('Nagpur', 'Butibori', 30.00, 7, 105, 0.84),
('Nagpur', 'Hingna', 28.00, 6, 85, 0.79),
('Nagpur', 'Wardha Road', 32.00, 7, 92, 0.82),
('Nagpur', 'Kalmeshwar', 25.00, 6, 68, 0.74),

-- Aurangabad (4 locations)
('Aurangabad', 'MIDC Waluj', 30.00, 6, 95, 0.80),
('Aurangabad', 'Chikalthana', 32.00, 7, 88, 0.83),
('Aurangabad', 'Shendra', 28.00, 6, 76, 0.77),
('Aurangabad', 'Paithan Road', 26.00, 6, 65, 0.75),

-- Other major cities (8 locations)
('Solapur', 'MIDC', 25.00, 5, 58, 0.72),
('Kolhapur', 'Shiroli', 20.00, 5, 62, 0.71),
('Ahmednagar', 'MIDC', 26.00, 6, 72, 0.74),
('Satara', 'Industrial Area', 20.00, 5, 48, 0.68),
('Sangli', 'MIDC', 21.00, 5, 55, 0.69),
('Jalgaon', 'MIDC Five Star', 25.00, 6, 62, 0.74),
('Amravati', 'MIDC', 26.00, 6, 58, 0.73),
('Akola', 'Industrial Zone', 24.00, 5, 52, 0.71);

-- ============================================
-- STEP 7: Insert product pricing data
-- ============================================

-- Clear existing data
TRUNCATE TABLE public.product_market_prices RESTART IDENTITY CASCADE;

INSERT INTO public.product_market_prices (product_type, product_category, current_price_per_kg, unit, price_trend) VALUES
-- Vegetables (6 items)
('Potato', 'Vegetable', 20.00, 'kg', 'stable'),
('Onion', 'Vegetable', 25.00, 'kg', 'rising'),
('Tomato', 'Vegetable', 30.00, 'kg', 'falling'),
('Cabbage', 'Vegetable', 15.00, 'kg', 'stable'),
('Cauliflower', 'Vegetable', 18.00, 'kg', 'stable'),
('Carrot', 'Vegetable', 22.00, 'kg', 'stable'),

-- Fruits (6 items)
('Banana', 'Fruit', 30.00, 'kg', 'stable'),
('Apple', 'Fruit', 150.00, 'kg', 'stable'),
('Orange', 'Fruit', 50.00, 'kg', 'falling'),
('Pomegranate', 'Fruit', 100.00, 'kg', 'stable'),
('Grapes', 'Fruit', 80.00, 'kg', 'rising'),
('Mango', 'Fruit', 120.00, 'kg', 'stable'),

-- Grains (4 items)
('Wheat', 'Grain', 28.00, 'kg', 'stable'),
('Rice (Paddy)', 'Grain', 32.00, 'kg', 'rising'),
('Rice (Basmati)', 'Grain', 80.00, 'kg', 'stable'),
('Maize (Corn)', 'Grain', 25.00, 'kg', 'falling'),

-- Pulses (4 items)
('Tur Dal', 'Pulse', 120.00, 'kg', 'stable'),
('Moong Dal', 'Pulse', 110.00, 'kg', 'stable'),
('Urad Dal', 'Pulse', 100.00, 'kg', 'rising'),
('Chana', 'Pulse', 90.00, 'kg', 'stable');

-- Storage configurations
TRUNCATE TABLE public.storage_rate_config RESTART IDENTITY CASCADE;

INSERT INTO public.storage_rate_config (product_category, storage_type_required, rate_per_kg_per_day, insurance_percentage, temperature_control) VALUES
('Vegetable', 'cold_storage', 0.50, 2.0, '2-8°C'),
('Fruit', 'cold_storage', 0.60, 2.5, '0-4°C'),
('Grain', 'general', 0.20, 1.5, 'Ambient'),
('Pulse', 'general', 0.25, 1.5, 'Ambient');

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Setup complete!' as status;
SELECT COUNT(*) as total_cities FROM pricing_reference;
SELECT COUNT(*) as total_products FROM product_market_prices;
SELECT COUNT(*) as storage_configs FROM storage_rate_config;

-- Show sample pricing data
SELECT city, district, avg_price_per_sqft, demand_score 
FROM pricing_reference 
ORDER BY avg_price_per_sqft DESC 
LIMIT 5;
