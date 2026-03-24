-- =====================================================
-- SEEKER FEATURES DATABASE SCHEMA
-- Creates saved_warehouses, activity_logs, and inquiries tables
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SAVED WAREHOUSES TABLE
-- Allows seekers to save/bookmark warehouses
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_warehouses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seeker_id UUID NOT NULL,
  warehouse_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one save per seeker per warehouse
  CONSTRAINT unique_saved_warehouse UNIQUE (seeker_id, warehouse_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_seeker ON saved_warehouses(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_warehouse ON saved_warehouses(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_created ON saved_warehouses(created_at DESC);

-- =====================================================
-- ACTIVITY LOGS TABLE
-- Tracks all seeker activities (bookings, inquiries, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seeker_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'inquiry', 'payment', 'cancellation', 'view', 'search')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_seeker ON activity_logs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- =====================================================
-- INQUIRIES TABLE
-- Allows seekers to send inquiries to warehouse owners
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seeker_id UUID NOT NULL,
  owner_id UUID,
  warehouse_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'responded', 'closed')),
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_inquiries_seeker ON inquiries(seeker_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_owner ON inquiries(owner_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_warehouse ON inquiries(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE saved_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR SAVED WAREHOUSES
-- =====================================================

-- Allow authenticated users to view their own saved warehouses
DROP POLICY IF EXISTS "Users can view their own saved warehouses" ON saved_warehouses;
CREATE POLICY "Users can view their own saved warehouses"
  ON saved_warehouses FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own saved warehouses
DROP POLICY IF EXISTS "Users can insert their own saved warehouses" ON saved_warehouses;
CREATE POLICY "Users can insert their own saved warehouses"
  ON saved_warehouses FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to delete their own saved warehouses
DROP POLICY IF EXISTS "Users can delete their own saved warehouses" ON saved_warehouses;
CREATE POLICY "Users can delete their own saved warehouses"
  ON saved_warehouses FOR DELETE
  USING (true);

-- =====================================================
-- RLS POLICIES FOR ACTIVITY LOGS
-- =====================================================

-- Allow authenticated users to view their own activity logs
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own activity logs
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES FOR INQUIRIES
-- =====================================================

-- Allow users to view their own inquiries (as seeker or owner)
DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;
CREATE POLICY "Users can view their own inquiries"
  ON inquiries FOR SELECT
  USING (true);

-- Allow users to insert inquiries
DROP POLICY IF EXISTS "Users can insert inquiries" ON inquiries;
CREATE POLICY "Users can insert inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own inquiries
DROP POLICY IF EXISTS "Users can update their own inquiries" ON inquiries;
CREATE POLICY "Users can update their own inquiries"
  ON inquiries FOR UPDATE
  USING (true);

-- =====================================================
-- HELPER FUNCTION: Log Activity
-- Drop existing function first to avoid conflicts
-- =====================================================
DROP FUNCTION IF EXISTS log_activity(UUID, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_activity(UUID, VARCHAR(50), TEXT, JSONB);

CREATE OR REPLACE FUNCTION seeker_log_activity(
  p_seeker_id UUID,
  p_type VARCHAR(50),
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO activity_logs (seeker_id, type, description, metadata)
  VALUES (p_seeker_id, p_type, p_description, p_metadata)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON saved_warehouses TO authenticated;
GRANT ALL ON saved_warehouses TO anon;
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON activity_logs TO anon;
GRANT ALL ON inquiries TO authenticated;
GRANT ALL ON inquiries TO anon;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION seeker_log_activity(UUID, VARCHAR(50), TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION seeker_log_activity(UUID, VARCHAR(50), TEXT, JSONB) TO anon;

-- =====================================================
-- REFRESH SCHEMA CACHE
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Seeker features schema created successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('saved_warehouses', 'activity_logs', 'inquiries');
