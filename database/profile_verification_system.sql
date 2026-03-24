-- ============================================================
-- COMPLETE PROFILE VERIFICATION SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. DROP EXISTING TABLES AND POLICIES (Clean Start)
-- ============================================================
DROP TABLE IF EXISTS verification_queue CASCADE;
DROP TABLE IF EXISTS user_interactions CASCADE;
DROP TABLE IF EXISTS seeker_profiles CASCADE;
DROP TABLE IF EXISTS owner_profiles CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- ============================================================
-- 2. SEEKER PROFILES TABLE
-- ============================================================
CREATE TABLE seeker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Personal Info
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  profile_image_url TEXT,
  
  -- Business Info
  company_name TEXT,
  business_type TEXT,
  gst_number TEXT,
  pan_number TEXT,
  
  -- Preferences (for ML recommendations)
  preferred_districts TEXT[] DEFAULT '{}',
  preferred_warehouse_types TEXT[] DEFAULT '{}',
  budget_min NUMERIC,
  budget_max NUMERIC,
  required_area_min INTEGER,
  required_area_max INTEGER,
  preferred_amenities TEXT[] DEFAULT '{}',
  
  -- Documents (JSON array of document objects)
  documents JSONB DEFAULT '[]',
  
  -- Verification
  verification_status TEXT DEFAULT 'pending',
  verification_score NUMERIC DEFAULT 0,
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  submitted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================
-- 3. OWNER PROFILES TABLE
-- ============================================================
CREATE TABLE owner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Personal Info
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  profile_image_url TEXT,
  
  -- Business Info
  company_name TEXT,
  business_registration_number TEXT,
  gst_number TEXT,
  pan_number TEXT,
  
  -- Address
  business_address TEXT,
  city TEXT,
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT,
  
  -- Documents (JSON array of document objects)
  documents JSONB DEFAULT '[]',
  
  -- Verification
  verification_status TEXT DEFAULT 'pending',
  verification_score NUMERIC DEFAULT 0,
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  submitted_at TIMESTAMPTZ,
  
  -- Stats
  total_warehouses INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================
-- 4. VERIFICATION QUEUE (for Admin Dashboard)
-- ============================================================
CREATE TABLE verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  profile_type TEXT NOT NULL, -- 'seeker' or 'owner'
  profile_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  
  -- Profile Summary
  company_name TEXT,
  gst_number TEXT,
  pan_number TEXT,
  phone TEXT,
  
  -- Documents
  document_count INTEGER DEFAULT 0,
  documents JSONB DEFAULT '[]',
  
  -- ML Scoring
  ml_score NUMERIC DEFAULT 0,
  ml_analysis JSONB DEFAULT '{}',
  gst_valid BOOLEAN DEFAULT FALSE,
  pan_valid BOOLEAN DEFAULT FALSE,
  phone_valid BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ADMIN NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  notification_type TEXT NOT NULL, -- 'new_profile', 'document_uploaded', etc.
  title TEXT NOT NULL,
  message TEXT,
  
  -- Reference
  related_table TEXT,
  related_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_by UUID,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. INDEXES
-- ============================================================
CREATE INDEX idx_seeker_profiles_user_id ON seeker_profiles(user_id);
CREATE INDEX idx_seeker_profiles_status ON seeker_profiles(verification_status);
CREATE INDEX idx_owner_profiles_user_id ON owner_profiles(user_id);
CREATE INDEX idx_owner_profiles_status ON owner_profiles(verification_status);
CREATE INDEX idx_verification_queue_status ON verification_queue(status);
CREATE INDEX idx_verification_queue_profile ON verification_queue(profile_type, profile_id);
CREATE INDEX idx_admin_notifications_unread ON admin_notifications(is_read) WHERE is_read = FALSE;

-- ============================================================
-- 7. DISABLE RLS FOR DEMO MODE
-- ============================================================
ALTER TABLE seeker_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON seeker_profiles TO anon, authenticated;
GRANT ALL ON owner_profiles TO anon, authenticated;
GRANT ALL ON verification_queue TO anon, authenticated;
GRANT ALL ON admin_notifications TO anon, authenticated;

-- ============================================================
-- 9. FUNCTION: Create Admin Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (
    notification_type,
    title,
    message,
    related_table,
    related_id
  ) VALUES (
    'new_profile',
    'New Profile Submitted for Verification',
    'A new ' || TG_ARGV[0] || ' profile has been submitted. Company: ' || COALESCE(NEW.company_name, 'Not provided'),
    TG_ARGV[0] || '_profiles',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. TRIGGERS FOR ADMIN NOTIFICATIONS
-- ============================================================
DROP TRIGGER IF EXISTS notify_seeker_profile_submitted ON seeker_profiles;
CREATE TRIGGER notify_seeker_profile_submitted
  AFTER INSERT OR UPDATE OF verification_status ON seeker_profiles
  FOR EACH ROW
  WHEN (NEW.verification_status = 'submitted')
  EXECUTE FUNCTION notify_admin_new_profile('seeker');

DROP TRIGGER IF EXISTS notify_owner_profile_submitted ON owner_profiles;
CREATE TRIGGER notify_owner_profile_submitted
  AFTER INSERT OR UPDATE OF verification_status ON owner_profiles
  FOR EACH ROW
  WHEN (NEW.verification_status = 'submitted')
  EXECUTE FUNCTION notify_admin_new_profile('owner');

-- ============================================================
-- 11. FUNCTION: Update Updated_At Timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_seeker_profiles_updated_at ON seeker_profiles;
CREATE TRIGGER update_seeker_profiles_updated_at
  BEFORE UPDATE ON seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_owner_profiles_updated_at ON owner_profiles;
CREATE TRIGGER update_owner_profiles_updated_at
  BEFORE UPDATE ON owner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_verification_queue_updated_at ON verification_queue;
CREATE TRIGGER update_verification_queue_updated_at
  BEFORE UPDATE ON verification_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DONE! Run this in Supabase SQL Editor
-- Then create storage bucket: user-documents (private)
-- ============================================================
