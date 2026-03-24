-- Quick test import: 10 warehouses for testing
-- Run this in Supabase SQL Editor to verify the application works

-- First ensure table exists
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  contact_person text,
  contact_phone text,
  contact_email text
);

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'warehouses'
    AND policyname = 'Anyone can view active warehouses'
  ) THEN
    CREATE POLICY "Anyone can view active warehouses"
      ON warehouses
      FOR SELECT
      USING (status = 'active' OR status = 'Active');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'warehouses'
    AND policyname = 'Authenticated users can view all warehouses'
  ) THEN
    CREATE POLICY "Authenticated users can view all warehouses"
      ON warehouses
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Insert 10 test warehouses
INSERT INTO warehouses (
  wh_id, name, description, address, city, district, state, pincode,
  total_area, capacity, price_per_sqft, micro_rental_spaces,
  images, amenities, features, status, occupancy, rating, reviews_count,
  warehouse_type, ownership_certificate, owner_name, owner_email, owner_phone,
  registration_date, license_valid_upto, total_blocks, available_blocks,
  grid_rows, grid_cols
) VALUES
('TEST001', 'Prime Storage Mumbai', 'Large industrial warehouse in Mumbai with modern facilities', 'Plot 123, Industrial Area, Andheri East, Mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', '400069', 50000, 10000, 95, 50, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['24/7 Security', 'Loading Dock', 'CCTV', 'Fire Safety'], ARRAY['Industrial Logistics Park'], 'active', 0.75, 4.5, 28, 'Industrial Logistics Park', 'Verified', 'Rajesh Kumar', 'rajesh@example.com', '+919876543210', '2020-01-15', '2030-01-15', 100, 25, 10, 10),

('TEST002', 'Pune Logistics Hub', 'Temperature-controlled warehouse in Pune', '45, Logistics Park, Hinjewadi, Pune', 'Pune', 'Pune', 'Maharashtra', '411057', 75000, 15000, 85, 75, ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80'], ARRAY['Temperature Control', '24/7 Security', 'Loading Dock'], ARRAY['Cold Storage'], 'active', 0.60, 4.2, 35, 'Cold Storage', 'Verified', 'Priya Sharma', 'priya@example.com', '+919876543211', '2019-03-20', '2029-03-20', 150, 60, 12, 13),

('TEST003', 'Nashik Storage Center', 'General storage facility in Nashik', '789, MIDC Area, Nashik', 'Nashik', 'Nashik', 'Maharashtra', '422010', 40000, 8000, 70, 40, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['24/7 Security', 'Easy Access'], ARRAY['General Storage'], 'active', 0.80, 4.8, 52, 'General Storage', 'Verified', 'Amit Patel', 'amit@example.com', '+919876543212', '2021-06-10', '2031-06-10', 80, 16, 9, 9),

('TEST004', 'Thane Wholesale Storage', 'Wholesale distribution center in Thane', '23, Industrial Estate, Thane', 'Thane', 'Thane', 'Maharashtra', '400601', 60000, 12000, 80, 60, ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80'], ARRAY['Loading Dock', 'Forklift', 'Security'], ARRAY['Wholesale Distribution'], 'active', 0.70, 4.3, 41, 'General Storage', 'Verified', 'Sunita Desai', 'sunita@example.com', '+919876543213', '2018-09-05', '2028-09-05', 120, 36, 11, 11),

('TEST005', 'Aurangabad Industrial Park', 'Large industrial storage facility', '567, MIDC, Aurangabad', 'Aurangabad', 'Aurangabad', 'Maharashtra', '431136', 90000, 18000, 75, 90, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['Heavy Machinery Access', 'Rail Connectivity', 'Security'], ARRAY['Industrial Logistics Park'], 'active', 0.55, 4.1, 22, 'Industrial Logistics Park', 'Verified', 'Vikram Singh', 'vikram@example.com', '+919876543214', '2017-11-30', '2027-11-30', 180, 81, 13, 14),

('TEST006', 'Solapur Textile Warehouse', 'Specialized textile storage', '12, Textile Park, Solapur', 'Solapur', 'Solapur', 'Maharashtra', '413001', 35000, 7000, 65, 35, ARRAY['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80'], ARRAY['Dust Control', 'Climate Control', 'Security'], ARRAY['Textile Warehouse'], 'active', 0.85, 4.6, 38, 'Textile Warehouse', 'Verified', 'Geeta Iyer', 'geeta@example.com', '+919876543215', '2020-02-14', '2030-02-14', 70, 11, 8, 9),

('TEST007', 'Kolhapur Auto Parts Hub', 'Automobile spare parts storage', '89, Auto Cluster, Kolhapur', 'Kolhapur', 'Kolhapur', 'Maharashtra', '416001', 45000, 9000, 78, 45, ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80'], ARRAY['Parts Cataloging', 'Anti-Theft System', 'Security'], ARRAY['Automobile Spare Storage'], 'active', 0.68, 4.4, 31, 'Automobile Spare Storage', 'Verified', 'Ramesh Patil', 'ramesh@example.com', '+919876543216', '2019-07-22', '2029-07-22', 90, 29, 9, 10),

('TEST008', 'Navi Mumbai Pharma Cold Chain', 'Pharmaceutical grade cold storage', '156, Pharma SEZ, Navi Mumbai', 'Navi Mumbai', 'Mumbai', 'Maharashtra', '400706', 55000, 11000, 120, 55, ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80'], ARRAY['FDA Certified', 'Temperature Control', 'Humidity Control', 'Security'], ARRAY['Pharma Cold Chain'], 'active', 0.90, 4.9, 67, 'Pharma Cold Chain', 'Verified', 'Dr. Anjali Mehta', 'anjali@example.com', '+919876543217', '2021-04-18', '2031-04-18', 110, 11, 11, 10),

('TEST009', 'Raigad Logistics Park', 'Multi-purpose logistics facility', '234, Highway Plaza, Raigad', 'Raigad', 'Raigad', 'Maharashtra', '402201', 80000, 16000, 82, 80, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['Container Storage', 'Rail Connectivity', 'Loading Dock', 'Security'], ARRAY['Industrial Logistics Park'], 'active', 0.72, 4.0, 19, 'Industrial Logistics Park', 'Verified', 'Karan Deshmukh', 'karan@example.com', '+919876543218', '2018-12-08', '2028-12-08', 160, 45, 13, 13),

('TEST010', 'Bhiwandi E-commerce Warehouse', 'Zepto dark store for quick commerce', '78, E-commerce Zone, Bhiwandi', 'Bhiwandi', 'Thane', 'Maharashtra', '421302', 30000, 6000, 110, 30, ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'], ARRAY['Rapid Dispatch System', 'E-commerce Integration', 'Climate Control', 'Security'], ARRAY['Zepto Dark Store'], 'active', 0.95, 4.7, 89, 'Zepto Dark Store', 'Verified', 'Neha Joshi', 'neha@example.com', '+919876543219', '2022-01-10', '2032-01-10', 60, 3, 8, 8);

-- Verify insertion
SELECT
  COUNT(*) as total_warehouses,
  COUNT(DISTINCT city) as cities,
  SUM(total_area) as total_area,
  AVG(price_per_sqft)::numeric(10,2) as avg_price,
  AVG(rating)::numeric(3,2) as avg_rating
FROM warehouses;
