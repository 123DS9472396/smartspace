-- ============================================
-- SIMPLE SUPABASE SETUP FOR WAREHOUSE PLATFORM
-- Copy this entire file and paste in Supabase SQL Editor
-- ============================================

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wh_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  state text NOT NULL DEFAULT 'Maharashtra',
  pincode text,
  latitude numeric,
  longitude numeric,
  total_area integer NOT NULL,
  capacity integer NOT NULL,
  price_per_sqft numeric NOT NULL,
  micro_rental_spaces integer DEFAULT 0,
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  status text DEFAULT 'active',
  occupancy numeric DEFAULT 0.5,
  rating numeric DEFAULT 4.0,
  reviews_count integer DEFAULT 0,
  warehouse_type text,
  ownership_certificate text,
  owner_name text,
  owner_email text,
  owner_phone text,
  registration_date date,
  license_valid_upto date,
  total_blocks integer DEFAULT 100,
  available_blocks integer DEFAULT 50,
  grid_rows integer DEFAULT 10,
  grid_cols integer DEFAULT 10,
  owner_id uuid,
  contact_person text,
  contact_phone text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses(district);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_price ON warehouses(price_per_sqft);
CREATE INDEX IF NOT EXISTS idx_warehouses_rating ON warehouses(rating DESC);

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid errors)
DROP POLICY IF EXISTS "Anyone can view active warehouses" ON warehouses;
DROP POLICY IF EXISTS "Authenticated users can view all warehouses" ON warehouses;

-- Create policies
CREATE POLICY "Anyone can view active warehouses"
ON warehouses FOR SELECT
USING (status = 'active' OR status = 'Active');

CREATE POLICY "Authenticated users can view all warehouses"
ON warehouses FOR SELECT
TO authenticated
USING (true);

-- Insert 10 test warehouses
INSERT INTO warehouses (wh_id, name, description, address, city, district, state, pincode, total_area, capacity, price_per_sqft, micro_rental_spaces, images, amenities, status, occupancy, rating, reviews_count, warehouse_type, ownership_certificate, owner_name, owner_email, owner_phone, registration_date, license_valid_upto, total_blocks, available_blocks, grid_rows, grid_cols) VALUES
('MH001', 'Prime Storage Mumbai', 'Large industrial warehouse with 24/7 security', 'Plot 123, Industrial Area, Andheri East, Mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', '400069', 50000, 10000, 95, 50, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['24/7 Security', 'Loading Dock', 'CCTV', 'Fire Safety'], 'active', 0.75, 4.5, 28, 'Industrial Logistics Park', 'Verified', 'Rajesh Kumar', 'rajesh@example.com', '+919876543210', '2020-01-15', '2030-01-15', 100, 25, 10, 10),

('MH002', 'Pune Logistics Hub', 'Temperature-controlled warehouse', '45, Logistics Park, Hinjewadi, Pune', 'Pune', 'Pune', 'Maharashtra', '411057', 75000, 15000, 85, 75, ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80'], ARRAY['Temperature Control', '24/7 Security', 'Loading Dock'], 'active', 0.60, 4.8, 45, 'Cold Storage', 'Verified', 'Priya Sharma', 'priya@example.com', '+919876543211', '2019-03-20', '2029-03-20', 150, 60, 12, 13),

('MH003', 'Nashik Storage Center', 'General storage facility', '789, MIDC Area, Nashik', 'Nashik', 'Nashik', 'Maharashtra', '422010', 40000, 8000, 70, 40, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['24/7 Security', 'Easy Access'], 'active', 0.80, 4.2, 52, 'General Storage', 'Verified', 'Amit Patel', 'amit@example.com', '+919876543212', '2021-06-10', '2031-06-10', 80, 16, 9, 9),

('MH004', 'Thane Wholesale Hub', 'Wholesale distribution center', '23, Industrial Estate, Thane', 'Thane', 'Thane', 'Maharashtra', '400601', 60000, 12000, 80, 60, ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80'], ARRAY['Loading Dock', 'Forklift', 'Security'], 'active', 0.70, 4.6, 41, 'General Storage', 'Verified', 'Sunita Desai', 'sunita@example.com', '+919876543213', '2018-09-05', '2028-09-05', 120, 36, 11, 11),

('MH005', 'Aurangabad Industrial', 'Large industrial storage', '567, MIDC, Aurangabad', 'Aurangabad', 'Aurangabad', 'Maharashtra', '431136', 90000, 18000, 75, 90, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['Heavy Machinery', 'Rail Connectivity', 'Security'], 'active', 0.55, 4.3, 22, 'Industrial Logistics Park', 'Verified', 'Vikram Singh', 'vikram@example.com', '+919876543214', '2017-11-30', '2027-11-30', 180, 81, 13, 14),

('MH006', 'Solapur Textile Storage', 'Specialized textile storage', '12, Textile Park, Solapur', 'Solapur', 'Solapur', 'Maharashtra', '413001', 35000, 7000, 65, 35, ARRAY['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80'], ARRAY['Dust Control', 'Climate Control', 'Security'], 'active', 0.85, 4.7, 38, 'Textile Warehouse', 'Verified', 'Geeta Iyer', 'geeta@example.com', '+919876543215', '2020-02-14', '2030-02-14', 70, 11, 8, 9),

('MH007', 'Kolhapur Auto Parts', 'Auto parts storage', '89, Auto Cluster, Kolhapur', 'Kolhapur', 'Kolhapur', 'Maharashtra', '416001', 45000, 9000, 78, 45, ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80'], ARRAY['Parts Cataloging', 'Anti-Theft', 'Security'], 'active', 0.68, 4.4, 31, 'Automobile Storage', 'Verified', 'Ramesh Patil', 'ramesh@example.com', '+919876543216', '2019-07-22', '2029-07-22', 90, 29, 9, 10),

('MH008', 'Navi Mumbai Pharma', 'Pharmaceutical storage', '156, Pharma SEZ, Navi Mumbai', 'Navi Mumbai', 'Mumbai', 'Maharashtra', '400706', 55000, 11000, 120, 55, ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80'], ARRAY['FDA Certified', 'Temperature Control', 'Security'], 'active', 0.90, 4.9, 67, 'Pharma Cold Chain', 'Verified', 'Dr. Anjali Mehta', 'anjali@example.com', '+919876543217', '2021-04-18', '2031-04-18', 110, 11, 11, 10),

('MH009', 'Raigad Logistics Park', 'Multi-purpose logistics', '234, Highway Plaza, Raigad', 'Raigad', 'Raigad', 'Maharashtra', '402201', 80000, 16000, 82, 80, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['Container Storage', 'Rail Connectivity', 'Security'], 'active', 0.72, 4.1, 19, 'Industrial Logistics Park', 'Verified', 'Karan Deshmukh', 'karan@example.com', '+919876543218', '2018-12-08', '2028-12-08', 160, 45, 13, 13),

('MH010', 'Bhiwandi E-commerce', 'Quick commerce dark store', '78, E-commerce Zone, Bhiwandi', 'Bhiwandi', 'Thane', 'Maharashtra', '421302', 30000, 6000, 110, 30, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['Rapid Dispatch', 'E-commerce Integration', 'Security'], 'active', 0.95, 4.7, 89, 'Zepto Dark Store', 'Verified', 'Neha Joshi', 'neha@example.com', '+919876543219', '2022-01-10', '2032-01-10', 60, 3, 8, 8);

-- Verify success
SELECT
  '✅ SETUP COMPLETE!' as status,
  COUNT(*) as total_warehouses,
  COUNT(DISTINCT city) as cities,
  SUM(total_area) as total_area_sqft,
  AVG(rating)::numeric(3,2) as avg_rating
FROM warehouses;
