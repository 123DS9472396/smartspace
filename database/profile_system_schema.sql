-- ============================================================
-- SmartSpace Profile System - CLEAN INSTALL
-- Drops existing policies first, then recreates everything
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- DROP EXISTING POLICIES (ignore errors if not exist)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own seeker profile" ON seeker_profiles;
DROP POLICY IF EXISTS "Users can insert own seeker profile" ON seeker_profiles;
DROP POLICY IF EXISTS "Users can update own seeker profile" ON seeker_profiles;
DROP POLICY IF EXISTS "Admins can view all seeker profiles" ON seeker_profiles;

DROP POLICY IF EXISTS "Users can view own owner profile" ON owner_profiles;
DROP POLICY IF EXISTS "Users can insert own owner profile" ON owner_profiles;
DROP POLICY IF EXISTS "Users can update own owner profile" ON owner_profiles;
DROP POLICY IF EXISTS "Admins can view all owner profiles" ON owner_profiles;

DROP POLICY IF EXISTS "Users can view own verification items" ON verification_queue;
DROP POLICY IF EXISTS "Admins can manage verification queue" ON verification_queue;

DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can insert own interactions" ON user_interactions;

-- Drop triggers if exist
DROP TRIGGER IF EXISTS update_seeker_profiles_updated_at ON seeker_profiles;
DROP TRIGGER IF EXISTS update_owner_profiles_updated_at ON owner_profiles;
DROP TRIGGER IF EXISTS update_verification_queue_updated_at ON verification_queue;

-- ============================================================
-- 1. SEEKER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS seeker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  profile_image_url TEXT,
  company_name TEXT,
  business_type TEXT,
  gst_number TEXT,
  preferred_districts TEXT[] DEFAULT '{}',
  preferred_warehouse_types TEXT[] DEFAULT '{}',
  budget_min NUMERIC,
  budget_max NUMERIC,
  required_area_min INTEGER,
  required_area_max INTEGER,
  preferred_amenities TEXT[] DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  verification_status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================
-- 2. OWNER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS owner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  profile_image_url TEXT,
  company_name TEXT,
  business_registration_number TEXT,
  gst_number TEXT,
  pan_number TEXT,
  business_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  documents JSONB DEFAULT '[]',
  verification_status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  total_warehouses INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================
-- 3. VERIFICATION QUEUE
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL,
  profile_id UUID NOT NULL,
  user_id UUID,
  document_url TEXT NOT NULL,
  document_type TEXT,
  document_name TEXT,
  ocr_status TEXT DEFAULT 'pending',
  ocr_extracted_data JSONB DEFAULT '{}',
  ocr_confidence NUMERIC,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. USER INTERACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  warehouse_id UUID,
  interaction_type TEXT NOT NULL,
  rating INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_user_id ON seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_user_id ON owner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);

-- ============================================================
-- 6. ENABLE RLS
-- ============================================================
ALTER TABLE seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. CREATE RLS POLICIES
-- ============================================================

-- Seeker Profiles
CREATE POLICY "Users can view own seeker profile" ON seeker_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seeker profile" ON seeker_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seeker profile" ON seeker_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read for demo (temporary)
CREATE POLICY "Allow public read seeker profiles" ON seeker_profiles
  FOR SELECT USING (true);

-- Owner Profiles
CREATE POLICY "Users can view own owner profile" ON owner_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own owner profile" ON owner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own owner profile" ON owner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read for demo (temporary)
CREATE POLICY "Allow public read owner profiles" ON owner_profiles
  FOR SELECT USING (true);

-- Verification Queue
CREATE POLICY "Users can view own verification items" ON verification_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow public verification queue" ON verification_queue
  FOR ALL USING (true);

-- User Interactions
CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow public interactions" ON user_interactions
  FOR ALL USING (true);

-- ============================================================
-- 8. TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seeker_profiles_updated_at
  BEFORE UPDATE ON seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owner_profiles_updated_at
  BEFORE UPDATE ON owner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_queue_updated_at
  BEFORE UPDATE ON verification_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DONE! Tables and policies created successfully
-- ============================================================
