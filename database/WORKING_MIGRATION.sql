-- ============================================
-- SmartSpace - Migration for YOUR Existing Schema
-- ============================================
-- ✅ Works with your ACTUAL tables: users, warehouses, etc.
-- ✅ Preserves all 10,000 warehouses
-- ============================================

-- Add missing columns to YOUR existing warehouses table
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS total_blocks INTEGER DEFAULT 100;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS available_blocks INTEGER DEFAULT 50;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS grid_rows INTEGER DEFAULT 10;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS grid_cols INTEGER DEFAULT 10;

-- Add missing columns to YOUR users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seeker_type TEXT CHECK (seeker_type IN ('farmer', 'wholesaler', 'quickcommerce', 'msme', 'industrial'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'hi', 'mr'));

-- Add missing column to YOUR bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS product_details JSONB;

-- Create NEW tables (these don't exist yet)
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
CREATE INDEX IF NOT EXISTS idx_pricing_city ON public.pricing_reference(city);
CREATE INDEX IF NOT EXISTS idx_pricing_district ON public.pricing_reference(district);
CREATE INDEX IF NOT EXISTS idx_product_prices_type ON public.product_market_prices(product_type);
CREATE INDEX IF NOT EXISTS idx_product_prices_category ON public.product_market_prices(product_category);

-- Insert Maharashtra pricing data (60 cities)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy)
SELECT * FROM (VALUES
  ('Mumbai', 'Andheri East', 95::numeric, 10, 45, 0.92::numeric),
  ('Mumbai', 'Andheri West', 98::numeric, 10, 38, 0.95::numeric),
  ('Mumbai', 'Bandra East', 110::numeric, 10, 25, 0.97::numeric),
  ('Mumbai', 'Bandra West', 115::numeric, 10, 18, 0.98::numeric),
  ('Mumbai', 'Kurla', 70::numeric, 9, 52, 0.85::numeric),
  ('Mumbai', 'Vikhroli', 75::numeric, 9, 40, 0.88::numeric),
  ('Mumbai', 'Powai', 85::numeric, 9, 32, 0.90::numeric),
  ('Mumbai', 'Goregaon', 80::numeric, 9, 48, 0.87::numeric),
  ('Mumbai', 'Malad', 78::numeric, 9, 55, 0.86::numeric),
  ('Mumbai', 'Kandivali', 72::numeric, 8, 60, 0.84::numeric),
  ('Mumbai', 'Borivali', 68::numeric, 8, 65, 0.83::numeric),
  ('Mumbai', 'Mulund', 73::numeric, 8, 42, 0.85::numeric),
  ('Mumbai', 'Ghatkopar', 76::numeric, 9, 50, 0.86::numeric),
  ('Mumbai', 'Chembur', 82::numeric, 9, 38, 0.89::numeric),
  ('Thane', 'Thane City', 55::numeric, 8, 75, 0.82::numeric),
  ('Thane', 'Kalyan', 40::numeric, 7, 85, 0.78::numeric),
  ('Thane', 'Dombivli', 38::numeric, 7, 90, 0.76::numeric),
  ('Thane', 'Bhiwandi', 35::numeric, 8, 120, 0.88::numeric),
  ('Thane', 'Ambernath', 32::numeric, 6, 65, 0.74::numeric),
  ('Thane', 'Ulhasnagar', 36::numeric, 6, 70, 0.75::numeric),
  ('Thane', 'Mira Road', 45::numeric, 7, 55, 0.80::numeric),
  ('Thane', 'Virar', 30::numeric, 6, 48, 0.72::numeric),
  ('Navi Mumbai', 'Vashi', 60::numeric, 8, 68, 0.85::numeric),
  ('Navi Mumbai', 'Airoli', 52::numeric, 8, 72, 0.83::numeric),
  ('Navi Mumbai', 'Rabale', 55::numeric, 8, 80, 0.86::numeric),
  ('Navi Mumbai', 'Mahape', 58::numeric, 8, 62, 0.84::numeric),
  ('Navi Mumbai', 'Taloja', 42::numeric, 7, 95, 0.81::numeric),
  ('Navi Mumbai', 'Panvel', 40::numeric, 7, 100, 0.79::numeric),
  ('Pune', 'Hinjewadi', 50::numeric, 8, 110, 0.87::numeric),
  ('Pune', 'Kharadi', 60::numeric, 9, 95, 0.90::numeric),
  ('Pune', 'Wakad', 45::numeric, 7, 88, 0.82::numeric),
  ('Pune', 'Pimpri', 42::numeric, 7, 105, 0.85::numeric),
  ('Pune', 'Chinchwad', 43::numeric, 7, 98, 0.84::numeric),
  ('Pune', 'Hadapsar', 48::numeric, 8, 92, 0.86::numeric),
  ('Pune', 'Chakan', 38::numeric, 8, 130, 0.91::numeric),
  ('Pune', 'Talegaon', 35::numeric, 7, 115, 0.88::numeric),
  ('Pune', 'Ranjangaon', 32::numeric, 7, 105, 0.85::numeric),
  ('Pune', 'Shikrapur', 30::numeric, 6, 85, 0.80::numeric),
  ('Nashik', 'Nashik Road', 25::numeric, 6, 78, 0.75::numeric),
  ('Nashik', 'MIDC Ambad', 28::numeric, 7, 95, 0.82::numeric),
  ('Nashik', 'Satpur', 27::numeric, 7, 88, 0.80::numeric),
  ('Nashik', 'Sinnar', 22::numeric, 6, 70, 0.73::numeric),
  ('Nashik', 'Igatpuri', 20::numeric, 5, 45, 0.68::numeric),
  ('Nagpur', 'MIHAN', 35::numeric, 7, 120, 0.86::numeric),
  ('Nagpur', 'Butibori', 30::numeric, 7, 105, 0.84::numeric),
  ('Nagpur', 'Hingna', 28::numeric, 6, 85, 0.79::numeric),
  ('Nagpur', 'Wardha Road', 32::numeric, 7, 92, 0.82::numeric),
  ('Nagpur', 'Kalmeshwar', 25::numeric, 6, 68, 0.74::numeric),
  ('Aurangabad', 'MIDC Waluj', 30::numeric, 6, 95, 0.80::numeric),
  ('Aurangabad', 'Chikalthana', 32::numeric, 7, 88, 0.83::numeric),
  ('Aurangabad', 'Shendra', 28::numeric, 6, 76, 0.77::numeric),
  ('Aurangabad', 'Paithan Road', 26::numeric, 6, 65, 0.75::numeric),
  ('Solapur', 'MIDC', 25::numeric, 5, 58, 0.72::numeric),
  ('Kolhapur', 'Shiroli', 20::numeric, 5, 62, 0.71::numeric),
  ('Ahmednagar', 'MIDC', 26::numeric, 6, 72, 0.74::numeric),
  ('Satara', 'Industrial Area', 20::numeric, 5, 48, 0.68::numeric),
  ('Sangli', 'MIDC', 21::numeric, 5, 55, 0.69::numeric),
  ('Jalgaon', 'MIDC Five Star', 25::numeric, 6, 62, 0.74::numeric),
  ('Amravati', 'MIDC', 26::numeric, 6, 58, 0.73::numeric),
  ('Akola', 'Industrial Zone', 24::numeric, 5, 52, 0.71::numeric)
) AS v(city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy)
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_reference LIMIT 1);

-- Insert product pricing (20 products)
INSERT INTO public.product_market_prices (product_type, product_category, current_price_per_kg, unit, price_trend)
SELECT * FROM (VALUES
  ('Potato', 'Vegetable', 20::numeric, 'kg', 'stable'),
  ('Onion', 'Vegetable', 25::numeric, 'kg', 'rising'),
  ('Tomato', 'Vegetable', 30::numeric, 'kg', 'falling'),
  ('Cabbage', 'Vegetable', 15::numeric, 'kg', 'stable'),
  ('Cauliflower', 'Vegetable', 18::numeric, 'kg', 'stable'),
  ('Carrot', 'Vegetable', 22::numeric, 'kg', 'stable'),
  ('Banana', 'Fruit', 30::numeric, 'kg', 'stable'),
  ('Apple', 'Fruit', 150::numeric, 'kg', 'stable'),
  ('Orange', 'Fruit', 50::numeric, 'kg', 'falling'),
  ('Pomegranate', 'Fruit', 100::numeric, 'kg', 'stable'),
  ('Grapes', 'Fruit', 80::numeric, 'kg', 'rising'),
  ('Mango', 'Fruit', 120::numeric, 'kg', 'stable'),
  ('Wheat', 'Grain', 28::numeric, 'kg', 'stable'),
  ('Rice (Paddy)', 'Grain', 32::numeric, 'kg', 'rising'),
  ('Rice (Basmati)', 'Grain', 80::numeric, 'kg', 'stable'),
  ('Maize (Corn)', 'Grain', 25::numeric, 'kg', 'falling'),
  ('Tur Dal', 'Pulse', 120::numeric, 'kg', 'stable'),
  ('Moong Dal', 'Pulse', 110::numeric, 'kg', 'stable'),
  ('Urad Dal', 'Pulse', 100::numeric, 'kg', 'rising'),
  ('Chana', 'Pulse', 90::numeric, 'kg', 'stable')
) AS v(product_type, product_category, current_price_per_kg, unit, price_trend)
WHERE NOT EXISTS (SELECT 1 FROM public.product_market_prices LIMIT 1);

-- Insert storage configurations
INSERT INTO public.storage_rate_config (product_category, storage_type_required, rate_per_kg_per_day, insurance_percentage, temperature_control)
SELECT * FROM (VALUES
  ('Vegetable', 'cold_storage', 0.50::numeric, 2.0::numeric, '2-8°C'),
  ('Fruit', 'cold_storage', 0.60::numeric, 2.5::numeric, '0-4°C'),
  ('Grain', 'general', 0.20::numeric, 1.5::numeric, 'Ambient'),
  ('Pulse', 'general', 0.25::numeric, 1.5::numeric, 'Ambient')
) AS v(product_category, storage_type_required, rate_per_kg_per_day, insurance_percentage, temperature_control)
WHERE NOT EXISTS (SELECT 1 FROM public.storage_rate_config LIMIT 1);

-- Verification
SELECT 
  '✅ Migration complete! All warehouses preserved!' as status,
  (SELECT COUNT(*) FROM warehouses) as total_warehouses,
  (SELECT COUNT(*) FROM pricing_reference) as pricing_cities,
  (SELECT COUNT(*) FROM product_market_prices) as products,
  (SELECT COUNT(*) FROM storage_rate_config) as storage_configs;
