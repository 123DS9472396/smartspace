/*
  🚀 COMPLETE SUPABASE DATABASE SETUP

  Run this entire script in your Supabase SQL Editor to:
  1. Create the warehouses table
  2. Set up proper indexes for performance
  3. Enable Row Level Security (RLS)
  4. Create public read access policies
  5. Import 10 test warehouses

  Project: https://bsrzqffxgvdebyofmhzg.supabase.co

  ⏱️ Estimated time: 10 seconds
*/

-- ============================================
-- STEP 1: Create Warehouses Table
-- ============================================

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
  owner_id uuid REFERENCES auth.users(id),
  contact_person text,
  contact_phone text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 2: Create Performance Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses(district);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_price ON warehouses(price_per_sqft);
CREATE INDEX IF NOT EXISTS idx_warehouses_rating ON warehouses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_warehouses_wh_id ON warehouses(wh_id);

-- Full-text search index on name and description
CREATE INDEX IF NOT EXISTS idx_warehouses_search
ON warehouses USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS Policies
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active warehouses" ON warehouses;
DROP POLICY IF EXISTS "Authenticated users can view all warehouses" ON warehouses;
DROP POLICY IF EXISTS "Authenticated users can create warehouses" ON warehouses;
DROP POLICY IF EXISTS "Owners can update their warehouses" ON warehouses;

-- Allow public to view active warehouses (even without login)
CREATE POLICY "Anyone can view active warehouses"
  ON warehouses
  FOR SELECT
  USING (status = 'active' OR status = 'Active');

-- Allow authenticated users to view all warehouses
CREATE POLICY "Authenticated users can view all warehouses"
  ON warehouses
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create warehouses
CREATE POLICY "Authenticated users can create warehouses"
  ON warehouses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow owners to update their own warehouses
CREATE POLICY "Owners can update their warehouses"
  ON warehouses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- STEP 5: Import 10 Test Warehouses
-- ============================================

INSERT INTO warehouses (
  wh_id, name, description, address, city, district, state, pincode,
  total_area, capacity, price_per_sqft, micro_rental_spaces,
  images, amenities, features, status, occupancy, rating, reviews_count,
  warehouse_type, ownership_certificate, owner_name, owner_email, owner_phone,
  registration_date, license_valid_upto, total_blocks, available_blocks,
  grid_rows, grid_cols
) VALUES
(
  'MH001',
  'Prime Storage Mumbai',
  'Large industrial warehouse in Mumbai with modern facilities and 24/7 security. Perfect for e-commerce and logistics companies.',
  'Plot 123, Industrial Area, Andheri East, Mumbai, Maharashtra, 400069',
  'Mumbai',
  'Mumbai',
  'Maharashtra',
  '400069',
  50000,
  10000,
  95,
  50,
  ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'],
  ARRAY['24/7 Security', 'Loading Dock', 'CCTV', 'Fire Safety', 'Climate Control'],
  ARRAY['Industrial Logistics Park'],
  'active',
  0.75,
  4.5,
  28,
  'Industrial Logistics Park',
  'Verified',
  'Rajesh Kumar',
  'rajesh@primestorage.com',
  '+919876543210',
  '2020-01-15',
  '2030-01-15',
  100,
  25,
  10,
  10
),
(
  'MH002',
  'Pune Logistics Hub',
  'Temperature-controlled warehouse in Pune with advanced cold storage facilities. FDA approved for pharmaceutical storage.',
  '45, Logistics Park, Hinjewadi, Pune, Maharashtra, 411057',
  'Pune',
  'Pune',
  'Maharashtra',
  '411057',
  75000,
  15000,
  85,
  75,
  ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80'],
  ARRAY['Temperature Control', '24/7 Security', 'Loading Dock', 'FDA Certified', 'Backup Power'],
  ARRAY['Cold Storage'],
  'active',
  0.60,
  4.8,
  45,
  'Pharma Cold Chain',
  'Verified',
  'Priya Sharma',
  'priya@punelogistics.com',
  '+919876543211',
  '2019-03-20',
  '2029-03-20',
  150,
  60,
  12,
  13
),
(
  'MH003',
  'Nashik Storage Center',
  'General storage facility in Nashik with flexible spacing and easy highway access.',
  '789, MIDC Area, Nashik, Maharashtra, 422010',
  'Nashik',
  'Nashik',
  'Maharashtra',
  '422010',
  40000,
  8000,
  70,
  40,
  ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'],
  ARRAY['24/7 Security', 'Easy Access', 'Loading Dock', 'Parking'],
  ARRAY['General Storage'],
  'active',
  0.80,
  4.2,
  52,
  'General Storage',
  'Verified',
  'Amit Patel',
  'amit@nashikstorage.com',
  '+919876543212',
  '2021-06-10',
  '2031-06-10',
  80,
  16,
  9,
  9
),
(
  'MH004',
  'Thane Wholesale Distribution',
  'Wholesale distribution center in Thane with excellent connectivity to Mumbai.',
  '23, Industrial Estate, Thane, Maharashtra, 400601',
  'Thane',
  'Thane',
  'Maharashtra',
  '400601',
  60000,
  12000,
  80,
  60,
  ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80'],
  ARRAY['Loading Dock', 'Forklift', 'Security', 'CCTV', 'Office Space'],
  ARRAY['Wholesale Distribution'],
  'active',
  0.70,
  4.6,
  41,
  'General Storage',
  'Verified',
  'Sunita Desai',
  'sunita@thanewholesale.com',
  '+919876543213',
  '2018-09-05',
  '2028-09-05',
  120,
  36,
  11,
  11
),
(
  'MH005',
  'Aurangabad Industrial Park',
  'Large industrial storage facility with rail connectivity and heavy machinery access.',
  '567, MIDC, Aurangabad, Maharashtra, 431136',
  'Aurangabad',
  'Aurangabad',
  'Maharashtra',
  '431136',
  90000,
  18000,
  75,
  90,
  ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'],
  ARRAY['Heavy Machinery Access', 'Rail Connectivity', 'Security', 'Loading Bay', 'Container Storage'],
  ARRAY['Industrial Logistics Park'],
  'active',
  0.55,
  4.3,
  22,
  'Industrial Logistics Park',
  'Verified',
  'Vikram Singh',
  'vikram@aurangabadindustrial.com',
  '+919876543214',
  '2017-11-30',
  '2027-11-30',
  180,
  81,
  13,
  14
),
(
  'MH006',
  'Solapur Textile Warehouse',
  'Specialized textile storage with dust control and climate management systems.',
  '12, Textile Park, Solapur, Maharashtra, 413001',
  'Solapur',
  'Solapur',
  'Maharashtra',
  '413001',
  35000,
  7000,
  65,
  35,
  ARRAY['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80'],
  ARRAY['Dust Control', 'Climate Control', 'Security', 'Fabric Protection', 'Quality Inspection Area'],
  ARRAY['Textile Warehouse'],
  'active',
  0.85,
  4.7,
  38,
  'Textile Warehouse',
  'Verified',
  'Geeta Iyer',
  'geeta@solapurtextile.com',
  '+919876543215',
  '2020-02-14',
  '2030-02-14',
  70,
  11,
  8,
  9
),
(
  'MH007',
  'Kolhapur Auto Parts Hub',
  'Automobile spare parts storage with anti-theft systems and parts cataloging.',
  '89, Auto Cluster, Kolhapur, Maharashtra, 416001',
  'Kolhapur',
  'Kolhapur',
  'Maharashtra',
  '416001',
  45000,
  9000,
  78,
  45,
  ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80'],
  ARRAY['Parts Cataloging', 'Anti-Theft System', 'Security', 'Inventory Management', 'Quality Control'],
  ARRAY['Automobile Spare Storage'],
  'active',
  0.68,
  4.4,
  31,
  'Automobile Spare Storage',
  'Verified',
  'Ramesh Patil',
  'ramesh@kolhapurauto.com',
  '+919876543216',
  '2019-07-22',
  '2029-07-22',
  90,
  29,
  9,
  10
),
(
  'MH008',
  'Navi Mumbai Pharma Storage',
  'Pharmaceutical grade cold chain facility with FDA certification and humidity control.',
  '156, Pharma SEZ, Navi Mumbai, Maharashtra, 400706',
  'Navi Mumbai',
  'Mumbai',
  'Maharashtra',
  '400706',
  55000,
  11000,
  120,
  55,
  ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80'],
  ARRAY['FDA Certified', 'Temperature Control', 'Humidity Control', 'Security', 'Pharmaceutical Grade', 'Backup Systems'],
  ARRAY['Pharma Cold Chain'],
  'active',
  0.90,
  4.9,
  67,
  'Pharma Cold Chain',
  'Verified',
  'Dr. Anjali Mehta',
  'anjali@navimumbhipharma.com',
  '+919876543217',
  '2021-04-18',
  '2031-04-18',
  110,
  11,
  11,
  10
),
(
  'MH009',
  'Raigad Logistics Park',
  'Multi-purpose logistics facility with container storage and rail connectivity.',
  '234, Highway Plaza, Raigad, Maharashtra, 402201',
  'Raigad',
  'Raigad',
  'Maharashtra',
  '402201',
  80000,
  16000,
  82,
  80,
  ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'],
  ARRAY['Container Storage', 'Rail Connectivity', 'Loading Dock', 'Security', 'Weighbridge', 'Parking'],
  ARRAY['Industrial Logistics Park'],
  'active',
  0.72,
  4.1,
  19,
  'Industrial Logistics Park',
  'Verified',
  'Karan Deshmukh',
  'karan@raigadlogistics.com',
  '+919876543218',
  '2018-12-08',
  '2028-12-08',
  160,
  45,
  13,
  13
),
(
  'MH010',
  'Bhiwandi E-commerce Hub',
  'Zepto dark store for quick commerce with rapid dispatch systems and e-commerce integration.',
  '78, E-commerce Zone, Bhiwandi, Maharashtra, 421302',
  'Bhiwandi',
  'Thane',
  'Maharashtra',
  '421302',
  30000,
  6000,
  110,
  30,
  ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'],
  ARRAY['Rapid Dispatch System', 'E-commerce Integration', 'Climate Control', 'Security', 'Automated Systems', 'Last Mile Delivery'],
  ARRAY['Zepto Dark Store'],
  'active',
  0.95,
  4.7,
  89,
  'Zepto Dark Store',
  'Verified',
  'Neha Joshi',
  'neha@bhiwandiecommerce.com',
  '+919876543219',
  '2022-01-10',
  '2032-01-10',
  60,
  3,
  8,
  8
);

-- ============================================
-- STEP 6: Verification Queries
-- ============================================

-- Show summary statistics
SELECT
  '✅ Setup Complete!' as status,
  COUNT(*) as total_warehouses,
  COUNT(DISTINCT city) as unique_cities,
  COUNT(DISTINCT district) as unique_districts,
  SUM(total_area) as total_area_sqft,
  SUM(capacity) as total_capacity_mt,
  AVG(price_per_sqft)::numeric(10,2) as avg_price_per_sqft,
  AVG(rating)::numeric(3,2) as avg_rating,
  COUNT(*) FILTER (WHERE ownership_certificate = 'Verified') as verified_count
FROM warehouses;

-- Show sample warehouses
SELECT
  wh_id,
  name,
  city,
  total_area,
  price_per_sqft,
  rating,
  status
FROM warehouses
ORDER BY rating DESC
LIMIT 5;

-- Verify RLS policies are active
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'warehouses';

-- ============================================
-- SUCCESS! 🎉
-- ============================================
-- Your database is now ready to use!
--
-- Next steps:
-- 1. Hard refresh your browser (Ctrl+Shift+R)
-- 2. Check browser console for connection logs
-- 3. Homepage should show "10 warehouses"
-- 4. Browse page should display warehouse cards
-- ============================================
