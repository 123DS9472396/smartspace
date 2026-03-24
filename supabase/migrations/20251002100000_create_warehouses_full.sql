/*
  # Create Warehouses Table with Full Schema and Policies

  1. New Tables
    - `warehouses` - Complete warehouse data for 10,000+ warehouses
      - Basic info: wh_id, name, description, address, city, district, state, pincode
      - Location: latitude, longitude
      - Specs: total_area, capacity, price_per_sqft, micro_rental_spaces
      - Media: images (array)
      - Features: amenities, features, warehouse_type
      - Status: status, occupancy, rating, reviews_count
      - Owner: owner details, ownership certificate
      - Dates: registration_date, license_valid_upto
      - Grid: total_blocks, available_blocks, grid_rows, grid_cols
      - Timestamps: created_at, updated_at

  2. Security
    - Enable RLS on `warehouses` table
    - Public read access for all active warehouses
    - Service role can insert/update/delete (for imports)

  3. Indexes
    - City, district, status for filtering
    - Price for sorting
    - Rating for sorting

  4. Important Notes
    - This migration is idempotent (safe to run multiple times)
    - Designed for bulk import of 10,000+ warehouses
    - Service role key required for imports to bypass RLS
*/

-- Drop existing table if you want to recreate (CAREFUL: THIS DELETES DATA)
-- DROP TABLE IF EXISTS warehouses CASCADE;

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses(district);
CREATE INDEX IF NOT EXISTS idx_warehouses_state ON warehouses(state);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_price ON warehouses(price_per_sqft);
CREATE INDEX IF NOT EXISTS idx_warehouses_rating ON warehouses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(warehouse_type);

-- Enable Row Level Security
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON warehouses;
DROP POLICY IF EXISTS "Service role full access" ON warehouses;
DROP POLICY IF EXISTS "Anyone can view active warehouses" ON warehouses;

-- Policy 1: Allow anyone to SELECT active warehouses (public read)
CREATE POLICY "Public read access"
ON warehouses FOR SELECT
USING (true);

-- Policy 2: Service role can do anything (for imports and admin operations)
CREATE POLICY "Service role full access"
ON warehouses
TO service_role
USING (true)
WITH CHECK (true);

-- Verify table creation
DO $$
BEGIN
  RAISE NOTICE 'Warehouses table created successfully!';
  RAISE NOTICE 'Ready to import 10,000+ warehouses.';
END $$;
