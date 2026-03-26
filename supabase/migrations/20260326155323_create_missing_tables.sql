/*
  # Create Missing Tables for Warehouse Platform

  1. New Tables
    - `profiles` - User profiles with user_type (admin/owner/seeker)
    - `owner_profiles` - Extended profiles for warehouse owners
    - `warehouse_submissions` - Warehouse listing submissions for review
    - `verification_queue` - User verification requests
    - `activity_logs` - User activity tracking including bookings
    - `admin_notifications` - Admin notification system
    - `inquiries` - Customer inquiries
    - `reviews` - Warehouse reviews
    - `payment_transactions` - Payment records

  2. Security
    - RLS enabled on all tables
    - Appropriate policies for each table
*/

-- 1. Profiles table (main user profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  avatar_url text,
  user_type text NOT NULL DEFAULT 'seeker' CHECK (user_type IN ('admin', 'owner', 'seeker')),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
    )
  );

CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Owner profiles table
CREATE TABLE IF NOT EXISTS owner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  business_type text,
  gst_number text,
  pan_number text,
  address text,
  is_active boolean DEFAULT true,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'verified')),
  total_warehouses integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own profile"
  ON owner_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can update own profile"
  ON owner_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can insert own profile"
  ON owner_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access owner_profiles"
  ON owner_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Warehouse submissions table
CREATE TABLE IF NOT EXISTS warehouse_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  address text,
  city text,
  district text,
  state text DEFAULT 'Maharashtra',
  pincode text,
  total_area integer,
  capacity integer,
  price_per_sqft numeric,
  warehouse_type text DEFAULT 'General',
  amenities text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE warehouse_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own submissions"
  ON warehouse_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert submissions"
  ON warehouse_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own submissions"
  ON warehouse_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Service role full access submissions"
  ON warehouse_submissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Verification queue table
CREATE TABLE IF NOT EXISTS verification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  company_name text,
  profile_type text DEFAULT 'owner' CHECK (profile_type IN ('owner', 'seeker', 'admin')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents jsonb DEFAULT '{}',
  ml_score numeric,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own verification"
  ON verification_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert verification"
  ON verification_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access verification"
  ON verification_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid,
  user_id uuid,
  type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = seeker_id);

CREATE POLICY "Users can insert own activity"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = seeker_id);

CREATE POLICY "Service role full access activity"
  ON activity_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access notifications"
  ON admin_notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  warehouse_id uuid,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'responded', 'closed')),
  response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access inquiries"
  ON inquiries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  booking_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access reviews"
  ON reviews FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid,
  user_id uuid,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  payment_method text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_gateway text,
  gateway_transaction_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access payments"
  ON payment_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add is_active column to seeker_profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seeker_profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE seeker_profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add verification_status column to seeker_profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seeker_profiles' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE seeker_profiles ADD COLUMN verification_status text DEFAULT 'pending';
  END IF;
END $$;

-- Add is_verified column to warehouses if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouses' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE warehouses ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_user_id ON owner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_owner_id ON warehouse_submissions(owner_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_status ON warehouse_submissions(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_seeker_id ON activity_logs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_reviews_warehouse_id ON reviews(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
