-- ============================================
-- SmartSpace - COMPLETE RESET & SETUP
-- ============================================
-- ⚠️ WARNING: This will DELETE all existing data!
-- Only run this if you want a FRESH start
-- ============================================

-- Step 1: Drop all existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.ml_recommendations CASCADE;
DROP TABLE IF EXISTS public.storage_rate_config CASCADE;
DROP TABLE IF EXISTS public.product_market_prices CASCADE;
DROP TABLE IF EXISTS public.pricing_reference CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.saved_warehouses CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('owner', 'seeker', 'admin')) NOT NULL DEFAULT 'seeker',
  seeker_type TEXT CHECK (seeker_type IN ('farmer', 'wholesaler', 'quickcommerce', 'msme', 'industrial')),
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'hi', 'mr')),
  company_name TEXT,
  gst_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create warehouses table
CREATE TABLE public.warehouses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  warehouse_name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  pincode TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  warehouse_type TEXT,
  total_size_sqft INTEGER NOT NULL,
  available_area INTEGER,
  height_feet NUMERIC(5, 2),
  pricing_inr_sqft_month NUMERIC(10, 2) NOT NULL,
  minimum_lease_months INTEGER DEFAULT 12,
  security_deposit_months INTEGER DEFAULT 2,
  amenities TEXT[],
  features TEXT[],
  connectivity TEXT[],
  power_backup BOOLEAN DEFAULT FALSE,
  cold_storage BOOLEAN DEFAULT FALSE,
  fire_safety BOOLEAN DEFAULT FALSE,
  cctv_surveillance BOOLEAN DEFAULT FALSE,
  loading_docks INTEGER DEFAULT 0,
  parking_spaces INTEGER DEFAULT 0,
  office_space BOOLEAN DEFAULT FALSE,
  images TEXT[],
  documents TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_date TIMESTAMP WITH TIME ZONE,
  total_blocks INTEGER DEFAULT 100,
  available_blocks INTEGER DEFAULT 50,
  grid_rows INTEGER DEFAULT 10,
  grid_cols INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create bookings table  
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  area_sqft INTEGER NOT NULL,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  monthly_rent NUMERIC(12, 2) NOT NULL,
  security_deposit NUMERIC(12, 2) NOT NULL,
  booking_status TEXT CHECK (booking_status IN ('pending', 'confirmed', 'rejected', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')) DEFAULT 'pending',
  product_details JSONB,
  blockchain_transaction_hash TEXT,
  smart_contract_address TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create other base tables
CREATE TABLE public.inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  required_area INTEGER,
  preferred_lease_duration INTEGER,
  budget_range_min NUMERIC(12, 2),
  budget_range_max NUMERIC(12, 2),
  inquiry_status TEXT CHECK (inquiry_status IN ('new', 'responded', 'closed', 'converted')) DEFAULT 'new',
  response_message TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.saved_warehouses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seeker_id, warehouse_id)
);

CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  review_type TEXT CHECK (review_type IN ('facility', 'owner', 'location', 'value')) DEFAULT 'facility',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('booking', 'inquiry', 'payment', 'verification', 'general')) NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('security_deposit', 'monthly_rent', 'booking_fee', 'refund')) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('upi', 'bank_transfer', 'card', 'wallet', 'blockchain')) NOT NULL,
  payment_gateway_id TEXT,
  blockchain_transaction_hash TEXT,
  transaction_status TEXT CHECK (transaction_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create new feature tables
CREATE TABLE public.pricing_reference (
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

CREATE TABLE public.ml_recommendations (
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

CREATE TABLE public.product_market_prices (
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

CREATE TABLE public.storage_rate_config (
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

-- Step 8: Create indexes
CREATE INDEX idx_warehouses_owner_id ON public.warehouses(owner_id);
CREATE INDEX idx_warehouses_city_state ON public.warehouses(city, state);
CREATE INDEX idx_warehouses_active_verified ON public.warehouses(is_active, is_verified);
CREATE INDEX idx_bookings_warehouse_id ON public.bookings(warehouse_id);
CREATE INDEX idx_bookings_seeker_id ON public.bookings(seeker_id);
CREATE INDEX idx_inquiries_warehouse_id ON public.inquiries(warehouse_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(inquiry_status);
CREATE INDEX idx_saved_warehouses_seeker_id ON public.saved_warehouses(seeker_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX idx_pricing_city ON public.pricing_reference(city);
CREATE INDEX idx_pricing_district ON public.pricing_reference(district);
CREATE INDEX idx_ml_recommendations_seeker ON public.ml_recommendations(seeker_id);
CREATE INDEX idx_product_prices_type ON public.product_market_prices(product_type);

-- Step 9: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_recommendations ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies  
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Everyone can view active verified warehouses" ON public.warehouses
  FOR SELECT USING (is_active = true AND is_verified = true);
CREATE POLICY "Owners can view own warehouses" ON public.warehouses
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners can insert own warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update own warehouses" ON public.warehouses
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (seeker_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Seekers can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (seeker_id = auth.uid());
CREATE POLICY "Participants can update bookings" ON public.bookings
  FOR UPDATE USING (seeker_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can view own inquiries" ON public.inquiries
  FOR SELECT USING (seeker_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Seekers can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (seeker_id = auth.uid());
CREATE POLICY "Participants can update inquiries" ON public.inquiries
  FOR UPDATE USING (seeker_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can manage own saved warehouses" ON public.saved_warehouses
  FOR ALL USING (seeker_id = auth.uid());

CREATE POLICY "Everyone can view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own ML recommendations" ON public.ml_recommendations
  FOR SELECT USING (auth.uid() = seeker_id);
CREATE POLICY "Users can insert own ML recommendations" ON public.ml_recommendations
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);

-- Step 11: Create triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_warehouses BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_bookings BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_inquiries BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_reviews BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Step 12: Insert Maharashtra pricing data (60 cities)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Mumbai', 'Andheri East', 95, 10, 45, 0.92),('Mumbai', 'Andheri West', 98, 10, 38, 0.95),('Mumbai', 'Bandra East', 110, 10, 25, 0.97),('Mumbai', 'Bandra West', 115, 10, 18, 0.98),('Mumbai', 'Kurla', 70, 9, 52, 0.85),('Mumbai', 'Vikhroli', 75, 9, 40, 0.88),('Mumbai', 'Powai', 85, 9, 32, 0.90),('Mumbai', 'Goregaon', 80, 9, 48, 0.87),('Mumbai', 'Malad', 78, 9, 55, 0.86),('Mumbai', 'Kandivali', 72, 8, 60, 0.84),('Mumbai', 'Borivali', 68, 8, 65, 0.83),('Mumbai', 'Mulund', 73, 8, 42, 0.85),('Mumbai', 'Ghatkopar', 76, 9, 50, 0.86),('Mumbai', 'Chembur', 82, 9, 38, 0.89),
('Thane', 'Thane City', 55, 8, 75, 0.82),('Thane', 'Kalyan', 40, 7, 85, 0.78),('Thane', 'Dombivli', 38, 7, 90, 0.76),('Thane', 'Bhiwandi', 35, 8, 120, 0.88),('Thane', 'Ambernath', 32, 6, 65, 0.74),('Thane', 'Ulhasnagar', 36, 6, 70, 0.75),('Thane', 'Mira Road', 45, 7, 55, 0.80),('Thane', 'Virar', 30, 6, 48, 0.72),
('Navi Mumbai', 'Vashi', 60, 8, 68, 0.85),('Navi Mumbai', 'Airoli', 52, 8, 72, 0.83),('Navi Mumbai', 'Rabale', 55, 8, 80, 0.86),('Navi Mumbai', 'Mahape', 58, 8, 62, 0.84),('Navi Mumbai', 'Taloja', 42, 7, 95, 0.81),('Navi Mumbai', 'Panvel', 40, 7, 100, 0.79),
('Pune', 'Hinjewadi', 50, 8, 110, 0.87),('Pune', 'Kharadi', 60, 9, 95, 0.90),('Pune', 'Wakad', 45, 7, 88, 0.82),('Pune', 'Pimpri', 42, 7, 105, 0.85),('Pune', 'Chinchwad', 43, 7, 98, 0.84),('Pune', 'Hadapsar', 48, 8, 92, 0.86),('Pune', 'Chakan', 38, 8, 130, 0.91),('Pune', 'Talegaon', 35, 7, 115, 0.88),('Pune', 'Ranjangaon', 32, 7, 105, 0.85),('Pune', 'Shikrapur', 30, 6, 85, 0.80),
('Nashik', 'Nashik Road', 25, 6, 78, 0.75),('Nashik', 'MIDC Ambad', 28, 7, 95, 0.82),('Nashik', 'Satpur', 27, 7, 88, 0.80),('Nashik', 'Sinnar', 22, 6, 70, 0.73),('Nashik', 'Igatpuri', 20, 5, 45, 0.68),
('Nagpur', 'MIHAN', 35, 7, 120, 0.86),('Nagpur', 'Butibori', 30, 7, 105, 0.84),('Nagpur', 'Hingna', 28, 6, 85, 0.79),('Nagpur', 'Wardha Road', 32, 7, 92, 0.82),('Nagpur', 'Kalmeshwar', 25, 6, 68, 0.74),
('Aurangabad', 'MIDC Waluj', 30, 6, 95, 0.80),('Aurangabad', 'Chikalthana', 32, 7, 88, 0.83),('Aurangabad', 'Shendra', 28, 6, 76, 0.77),('Aurangabad', 'Paithan Road', 26, 6, 65, 0.75),
('Solapur', 'MIDC', 25, 5, 58, 0.72),('Kolhapur', 'Shiroli', 20, 5, 62, 0.71),('Ahmednagar', 'MIDC', 26, 6, 72, 0.74),('Satara', 'Industrial Area', 20, 5, 48, 0.68),('Sangli', 'MIDC', 21, 5, 55, 0.69),('Jalgaon', 'MIDC Five Star', 25, 6, 62, 0.74),('Amravati', 'MIDC', 26, 6, 58, 0.73),('Akola', 'Industrial Zone', 24, 5, 52, 0.71);

-- Step 13: Insert product pricing data (20 products)
INSERT INTO public.product_market_prices (product_type, product_category, current_price_per_kg, unit, price_trend) VALUES
('Potato', 'Vegetable', 20, 'kg', 'stable'),('Onion', 'Vegetable', 25, 'kg', 'rising'),('Tomato', 'Vegetable', 30, 'kg', 'falling'),('Cabbage', 'Vegetable', 15, 'kg', 'stable'),('Cauliflower', 'Vegetable', 18, 'kg', 'stable'),('Carrot', 'Vegetable', 22, 'kg', 'stable'),
('Banana', 'Fruit', 30, 'kg', 'stable'),('Apple', 'Fruit', 150, 'kg', 'stable'),('Orange', 'Fruit', 50, 'kg', 'falling'),('Pomegranate', 'Fruit', 100, 'kg', 'stable'),('Grapes', 'Fruit', 80, 'kg', 'rising'),('Mango', 'Fruit', 120, 'kg', 'stable'),
('Wheat', 'Grain', 28, 'kg', 'stable'),('Rice (Paddy)', 'Grain', 32, 'kg', 'rising'),('Rice (Basmati)', 'Grain', 80, 'kg', 'stable'),('Maize (Corn)', 'Grain', 25, 'kg', 'falling'),
('Tur Dal', 'Pulse', 120, 'kg', 'stable'),('Moong Dal', 'Pulse', 110, 'kg', 'stable'),('Urad Dal', 'Pulse', 100, 'kg', 'rising'),('Chana', 'Pulse', 90, 'kg', 'stable');

-- Step 14: Insert storage configurations
INSERT INTO public.storage_rate_config (product_category, storage_type_required, rate_per_kg_per_day, insurance_percentage, temperature_control) VALUES
('Vegetable', 'cold_storage', 0.50, 2.0, '2-8°C'),('Fruit', 'cold_storage', 0.60, 2.5, '0-4°C'),('Grain', 'general', 0.20, 1.5, 'Ambient'),('Pulse', 'general', 0.25, 1.5, 'Ambient');

-- Done!
SELECT '✅ Database setup complete!' as status, COUNT(*) as total_cities FROM pricing_reference;
SELECT '✅ Products loaded!' as status, COUNT(*) as total_products FROM product_market_prices;
