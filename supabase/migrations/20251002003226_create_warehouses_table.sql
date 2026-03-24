/*
  # Create Warehouses Table for Maharashtra Warehouse Platform

  1. New Tables
    - `warehouses`
      - `id` (uuid, primary key) - Unique identifier
      - `wh_id` (text, unique) - License/warehouse ID (e.g., LIC000001)
      - `name` (text) - Warehouse/company name
      - `description` (text, nullable) - Detailed description
      - `address` (text) - Full address
      - `city` (text) - City name
      - `district` (text) - District name
      - `state` (text) - State (default: Maharashtra)
      - `pincode` (text) - Postal code
      - `latitude` (numeric, nullable) - GPS latitude
      - `longitude` (numeric, nullable) - GPS longitude
      - `total_area` (integer) - Total area in square feet
      - `capacity` (integer) - Storage capacity in MT
      - `price_per_sqft` (numeric) - Monthly price per square foot
      - `micro_rental_spaces` (integer) - Number of micro rental units
      - `images` (text array) - Warehouse images
      - `amenities` (text array) - List of amenities
      - `features` (text array) - Warehouse features/type
      - `status` (text) - Status (active, pending, maintenance)
      - `occupancy` (numeric) - Occupancy rate (0-1)
      - `rating` (numeric) - Average rating (1-5)
      - `reviews_count` (integer) - Number of reviews
      - `warehouse_type` (text) - Type of warehouse
      - `ownership_certificate` (text) - Verification status
      - `owner_name` (text) - Owner name
      - `owner_email` (text) - Owner email
      - `owner_phone` (text) - Owner contact number
      - `registration_date` (date) - Registration date
      - `license_valid_upto` (date) - License expiry date
      - `total_blocks` (integer) - Total storage blocks
      - `available_blocks` (integer) - Available blocks
      - `grid_rows` (integer) - Grid layout rows
      - `grid_cols` (integer) - Grid layout columns
      - `owner_id` (uuid, nullable, foreign key) - User who owns warehouse
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      
  2. Indexes
    - Index on city for fast location queries
    - Index on district for regional searches
    - Index on price_per_sqft for price filtering
    - Index on total_area for size filtering
    - Index on status for active warehouse queries
    - Index on wh_id for unique lookups
    - Full-text search index on name and description
    
  3. Security
    - Enable RLS on warehouses table
    - Policy: Anyone can view approved/active warehouses
    - Policy: Authenticated owners can manage their warehouses
    - Policy: Authenticated users can view all warehouses
*/

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wh_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  state text DEFAULT 'Maharashtra',
  pincode text,
  latitude numeric,
  longitude numeric,
  total_area integer NOT NULL,
  capacity integer NOT NULL,
  price_per_sqft numeric NOT NULL,
  micro_rental_spaces integer DEFAULT 0,
  images text[] DEFAULT ARRAY[]::text[],
  amenities text[] DEFAULT ARRAY[]::text[],
  features text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'active',
  occupancy numeric DEFAULT 0.5 CHECK (occupancy >= 0 AND occupancy <= 1),
  rating numeric DEFAULT 4.0 CHECK (rating >= 1 AND rating <= 5),
  reviews_count integer DEFAULT 0,
  warehouse_type text NOT NULL,
  ownership_certificate text DEFAULT 'Pending',
  owner_name text,
  owner_email text,
  owner_phone text,
  registration_date date,
  license_valid_upto date,
  total_blocks integer DEFAULT 10,
  available_blocks integer DEFAULT 5,
  grid_rows integer DEFAULT 10,
  grid_cols integer DEFAULT 10,
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses(district);
CREATE INDEX IF NOT EXISTS idx_warehouses_price ON warehouses(price_per_sqft);
CREATE INDEX IF NOT EXISTS idx_warehouses_area ON warehouses(total_area);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_wh_id ON warehouses(wh_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_rating ON warehouses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_warehouses_created_at ON warehouses(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_warehouses_search ON warehouses USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, '') || ' ' || coalesce(district, ''))
);

-- Enable Row Level Security
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active warehouses (public access)
CREATE POLICY "Anyone can view active warehouses"
  ON warehouses
  FOR SELECT
  USING (status = 'active' OR status = 'Active');

-- Policy: Authenticated users can view all warehouses
CREATE POLICY "Authenticated users can view all warehouses"
  ON warehouses
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert warehouses
CREATE POLICY "Authenticated users can create warehouses"
  ON warehouses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own warehouses
CREATE POLICY "Users can update own warehouses"
  ON warehouses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete their own warehouses
CREATE POLICY "Users can delete own warehouses"
  ON warehouses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
