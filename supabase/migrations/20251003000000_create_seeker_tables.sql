/*
  # Create Seeker Module Tables

  ## Overview
  Creates comprehensive database schema for Storage Seeker functionality including:
  - Seeker profiles with preferences
  - Booking system with payment tracking
  - Saved warehouses (favorites)
  - Search history for ML recommendations
  - Reviews and ratings

  ## New Tables

  ### 1. seeker_profiles
  Extended profile information for storage seekers
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `preferred_locations` (text array)
  - `budget_min` (integer)
  - `budget_max` (integer)
  - `preferred_size_min` (integer)
  - `preferred_size_max` (integer)
  - `preferred_amenities` (text array)
  - `business_type` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. bookings
  Track all warehouse bookings
  - `id` (uuid, primary key)
  - `seeker_id` (uuid, references seeker_profiles)
  - `warehouse_id` (uuid, references warehouses)
  - `selected_blocks` (integer array)
  - `total_sqft` (integer)
  - `price_per_sqft` (decimal)
  - `total_amount` (decimal)
  - `security_deposit` (decimal)
  - `gst_amount` (decimal)
  - `start_date` (date)
  - `end_date` (date)
  - `duration_months` (integer)
  - `status` (text: pending, confirmed, active, completed, cancelled)
  - `payment_id` (text)
  - `payment_status` (text: pending, paid, failed, refunded)
  - `booking_reference` (text, unique)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. saved_warehouses
  User's favorited warehouses
  - `id` (uuid, primary key)
  - `seeker_id` (uuid, references seeker_profiles)
  - `warehouse_id` (uuid, references warehouses)
  - `saved_at` (timestamptz)

  ### 4. search_history
  Track searches for ML recommendations
  - `id` (uuid, primary key)
  - `seeker_id` (uuid, references seeker_profiles)
  - `query` (text)
  - `filters` (jsonb)
  - `results_count` (integer)
  - `searched_at` (timestamptz)

  ### 5. warehouse_reviews
  User reviews for warehouses
  - `id` (uuid, primary key)
  - `warehouse_id` (uuid, references warehouses)
  - `seeker_id` (uuid, references seeker_profiles)
  - `booking_id` (uuid, references bookings, nullable)
  - `rating` (integer, 1-5)
  - `review_text` (text)
  - `helpful_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Seekers can only access their own data
  - Reviews visible to all authenticated users
  - Bookings visible to seeker and warehouse owner
*/

-- Create seeker_profiles table
CREATE TABLE IF NOT EXISTS seeker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferred_locations text[] DEFAULT '{}',
  budget_min integer DEFAULT 0,
  budget_max integer DEFAULT 200,
  preferred_size_min integer DEFAULT 1000,
  preferred_size_max integer DEFAULT 100000,
  preferred_amenities text[] DEFAULT '{}',
  business_type text DEFAULT 'General Storage',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid REFERENCES seeker_profiles(id) ON DELETE CASCADE NOT NULL,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  selected_blocks integer[] DEFAULT '{}',
  total_sqft integer NOT NULL,
  price_per_sqft decimal(10,2) NOT NULL,
  total_amount decimal(12,2) NOT NULL,
  security_deposit decimal(12,2) DEFAULT 0,
  gst_amount decimal(12,2) DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_months integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_id text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  booking_reference text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_warehouses table
CREATE TABLE IF NOT EXISTS saved_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid REFERENCES seeker_profiles(id) ON DELETE CASCADE NOT NULL,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(seeker_id, warehouse_id)
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid REFERENCES seeker_profiles(id) ON DELETE CASCADE NOT NULL,
  query text,
  filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  searched_at timestamptz DEFAULT now()
);

-- Create warehouse_reviews table
CREATE TABLE IF NOT EXISTS warehouse_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  seeker_id uuid REFERENCES seeker_profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(warehouse_id, seeker_id, booking_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_user_id ON seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seeker_id ON bookings(seeker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_warehouse_id ON bookings(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_seeker_id ON saved_warehouses(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_warehouse_id ON saved_warehouses(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_search_history_seeker_id ON search_history(seeker_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_reviews_warehouse_id ON warehouse_reviews(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_reviews_seeker_id ON warehouse_reviews(seeker_id);

-- Generate unique booking reference on insert
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_reference();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seeker_profiles_updated_at
  BEFORE UPDATE ON seeker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_reviews_updated_at
  BEFORE UPDATE ON warehouse_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seeker_profiles
CREATE POLICY "Seekers can view own profile"
  ON seeker_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Seekers can insert own profile"
  ON seeker_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Seekers can update own profile"
  ON seeker_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for bookings
CREATE POLICY "Seekers can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = bookings.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = bookings.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = bookings.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for saved_warehouses
CREATE POLICY "Seekers can view own saved warehouses"
  ON saved_warehouses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = saved_warehouses.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can save warehouses"
  ON saved_warehouses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can remove saved warehouses"
  ON saved_warehouses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = saved_warehouses.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for search_history
CREATE POLICY "Seekers can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = search_history.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can add to search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can delete own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = search_history.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for warehouse_reviews
CREATE POLICY "Anyone can view reviews"
  ON warehouse_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Seekers can create reviews"
  ON warehouse_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can update own reviews"
  ON warehouse_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = warehouse_reviews.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = warehouse_reviews.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can delete own reviews"
  ON warehouse_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seeker_profiles
      WHERE seeker_profiles.id = warehouse_reviews.seeker_id
      AND seeker_profiles.user_id = auth.uid()
    )
  );
