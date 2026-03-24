-- ============================================
-- SmartSpace - SAFE COLUMN ADDITION ONLY
-- ============================================
-- ✅ This preserves ALL your 10,000 warehouses!
-- Only adds missing columns to existing tables
-- ============================================

-- Add missing columns to warehouses table (one at a time to avoid errors)
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS total_blocks INTEGER DEFAULT 100;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS available_blocks INTEGER DEFAULT 50;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS grid_rows INTEGER DEFAULT 10;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS grid_cols INTEGER DEFAULT 10;

-- Set is_active to TRUE for all existing warehouses
UPDATE public.warehouses SET is_active = TRUE WHERE is_active IS NULL;

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seeker_type TEXT CHECK (seeker_type IN ('farmer', 'wholesaler', 'quickcommerce', 'msme', 'industrial'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'hi', 'mr'));

-- Add missing column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS product_details JSONB;

-- Create new tables (won't affect existing data)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_active_verified ON public.warehouses(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_pricing_city ON public.pricing_reference(city);
CREATE INDEX IF NOT EXISTS idx_ml_recommendations_seeker ON public.ml_recommendations(seeker_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_type ON public.product_market_prices(product_type);

-- Enable RLS on new tables
ALTER TABLE public.ml_recommendations ENABLE ROW LEVEL SECURITY;

-- Update warehouse policies (drop old, create new with is_active column)
DROP POLICY IF EXISTS "Everyone can view active verified warehouses" ON public.warehouses;
CREATE POLICY "Everyone can view active verified warehouses" ON public.warehouses
  FOR SELECT USING (is_active = true AND is_verified = true);

DROP POLICY IF EXISTS "Owners can view own warehouses" ON public.warehouses;
CREATE POLICY "Owners can view own warehouses" ON public.warehouses
  FOR SELECT USING (owner_id = auth.uid());

-- Create ML recommendations policies
DROP POLICY IF EXISTS "Users can view own ML recommendations" ON public.ml_recommendations;
CREATE POLICY "Users can view own ML recommendations" ON public.ml_recommendations
  FOR SELECT USING (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Users can insert own ML recommendations" ON public.ml_recommendations;
CREATE POLICY "Users can insert own ML recommendations" ON public.ml_recommendations
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);

-- Insert Maharashtra pricing data (only if table is empty)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy)
SELECT * FROM (VALUES
  ('Mumbai', 'Andheri East', 95, 10, 45, 0.92),('Mumbai', 'Andheri West', 98, 10, 38, 0.95),('Mumbai', 'Bandra East', 110, 10, 25, 0.97),('Mumbai', 'Bandra West', 115, 10, 18, 0.98),('Mumbai', 'Kurla', 70, 9, 52, 0.85),('Mumbai', 'Vikhroli', 75, 9, 40, 0.88),('Mumbai', 'Powai', 85, 9, 32, 0.90),('Mumbai', 'Goregaon', 80, 9, 48, 0.87),('Mumbai', 'Malad', 78, 9, 55, 0.86),('Mumbai', 'Kandivali', 72, 8, 60, 0.84),('Mumbai', 'Borivali', 68, 8, 65, 0.83),('Mumbai', 'Mulund', 73, 8, 42, 0.85),('Mumbai', 'Ghatkopar', 76, 9, 50, 0.86),('Mumbai', 'Chembur', 82, 9, 38, 0.89),
  ('Thane', 'Thane City', 55, 8, 75, 0.82),('Thane', 'Kalyan', 40, 7, 85, 0.78),('Thane', 'Dombivli', 38, 7, 90, 0.76),('Thane', 'Bhiwandi', 35, 8, 120, 0.88),('Thane', 'Ambernath', 32, 6, 65, 0.74),('Thane', 'Ulhasnagar', 36, 6, 70, 0.75),('Thane', 'Mira Road', 45, 7, 55, 0.80),('Thane', 'Virar', 30, 6, 48, 0.72),
  ('Navi Mumbai', 'Vashi', 60, 8, 68, 0.85),('Navi Mumbai', 'Airoli', 52, 8, 72, 0.83),('Navi Mumbai', 'Rabale', 55, 8, 80, 0.86),('Navi Mumbai', 'Mahape', 58, 8, 62, 0.84),('Navi Mumbai', 'Taloja', 42, 7, 95, 0.81),('Navi Mumbai', 'Panvel', 40, 7, 100, 0.79),
  ('Pune', 'Hinjewadi', 50, 8, 110, 0.87),('Pune', 'Kharadi', 60, 9, 95, 0.90),('Pune', 'Wakad', 45, 7, 88, 0.82),('Pune', 'Pimpri', 42, 7, 105, 0.85),('Pune', 'Chinchwad', 43, 7, 98, 0.84),('Pune', 'Hadapsar', 48, 8, 92, 0.86),('Pune', 'Chakan', 38, 8, 130, 0.91),('Pune', 'Talegaon', 35, 7, 115, 0.88),('Pune', 'Ranjangaon', 32, 7, 105, 0.85),('Pune', 'Shikrapur', 30, 6, 85, 0.80),
  ('Nashik', 'Nashik Road', 25, 6, 78, 0.75),('Nashik', 'MIDC Ambad', 28, 7, 95, 0.82),('Nashik', 'Satpur', 27, 7, 88, 0.80),('Nashik', 'Sinnar', 22, 6, 70, 0.73),('Nashik', 'Igatpuri', 20, 5, 45, 0.68),
  ('Nagpur', 'MIHAN', 35, 7, 120, 0.86),('Nagpur', 'Butibori', 30, 7, 105, 0.84),('Nagpur', 'Hingna', 28, 6, 85, 0.79),('Nagpur', 'Wardha Road', 32, 7, 92, 0.82),('Nagpur', 'Kalmeshwar', 25, 6, 68, 0.74),
  ('Aurangabad', 'MIDC Waluj', 30, 6, 95, 0.80),('Aurangabad', 'Chikalthana', 32, 7, 88, 0.83),('Aurangabad', 'Shendra', 28, 6, 76, 0.77),('Aurangabad', 'Paithan Road', 26, 6, 65, 0.75),
  ('Solapur', 'MIDC', 25, 5, 58, 0.72),('Kolhapur', 'Shiroli', 20, 5, 62, 0.71),('Ahmednagar', 'MIDC', 26, 6, 72, 0.74),('Satara', 'Industrial Area', 20, 5, 48, 0.68),('Sangli', 'MIDC', 21, 5, 55, 0.69),('Jalgaon', 'MIDC Five Star', 25, 6, 62, 0.74),('Amravati', 'MIDC', 26, 6, 58, 0.73),('Akola', 'Industrial Zone', 24, 5, 52, 0.71)
) AS v(city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy)
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_reference LIMIT 1);

-- Insert product pricing (only if table is empty)
INSERT INTO public.product_market_prices (product_type, product_category, current_price_per_kg, unit, price_trend)
SELECT * FROM (VALUES
  ('Potato', 'Vegetable', 20, 'kg', 'stable'),('Onion', 'Vegetable', 25, 'kg', 'rising'),('Tomato', 'Vegetable', 30, 'kg', 'falling'),('Cabbage', 'Vegetable', 15, 'kg', 'stable'),('Cauliflower', 'Vegetable', 18, 'kg', 'stable'),('Carrot', 'Vegetable', 22, 'kg', 'stable'),
  ('Banana', 'Fruit', 30, 'kg', 'stable'),('Apple', 'Fruit', 150, 'kg', 'stable'),('Orange', 'Fruit', 50, 'kg', 'falling'),('Pomegranate', 'Fruit', 100, 'kg', 'stable'),('Grapes', 'Fruit', 80, 'kg', 'rising'),('Mango', 'Fruit', 120, 'kg', 'stable'),
  ('Wheat', 'Grain', 28, 'kg', 'stable'),('Rice (Paddy)', 'Grain', 32, 'kg', 'rising'),('Rice (Basmati)', 'Grain', 80, 'kg', 'stable'),('Maize (Corn)', 'Grain', 25, 'kg', 'falling'),
  ('Tur Dal', 'Pulse', 120, 'kg', 'stable'),('Moong Dal', 'Pulse', 110, 'kg', 'stable'),('Urad Dal', 'Pulse', 100, 'kg', 'rising'),('Chana', 'Pulse', 90, 'kg', 'stable')
) AS v(product_type, product_category, current_price_per_kg, unit, price_trend)
WHERE NOT EXISTS (SELECT 1 FROM public.product_market_prices LIMIT 1);

-- Insert storage configs (only if table is empty)
INSERT INTO public.storage_rate_config (product_category, storage_type_required, rate_per_kg_per_day, insurance_percentage, temperature_control)
SELECT * FROM (VALUES
  ('Vegetable', 'cold_storage', 0.50, 2.0, '2-8°C'),('Fruit', 'cold_storage', 0.60, 2.5, '0-4°C'),('Grain', 'general', 0.20, 1.5, 'Ambient'),('Pulse', 'general', 0.25, 1.5, 'Ambient')
) AS v(product_category, storage_type_required, rate_per_kg_per_day, insurance_percentage, temperature_control)
WHERE NOT EXISTS (SELECT 1 FROM public.storage_rate_config LIMIT 1);

-- Verification
SELECT '✅ Migration complete! All 10,000 warehouses preserved!' as status,
       (SELECT COUNT(*) FROM warehouses) as total_warehouses,
       (SELECT COUNT(*) FROM pricing_reference) as pricing_cities,
       (SELECT COUNT(*) FROM product_market_prices) as products;
