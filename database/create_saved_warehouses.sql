-- =====================================================
-- CREATE SAVED WAREHOUSES TABLE
-- Run this in Supabase SQL Editor to fix the saved warehouses issue
-- =====================================================

-- Create saved_warehouses table
CREATE TABLE IF NOT EXISTS saved_warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one save per seeker per warehouse
  CONSTRAINT unique_saved_warehouse UNIQUE (seeker_id, warehouse_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_seeker ON saved_warehouses(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_warehouse ON saved_warehouses(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_created ON saved_warehouses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_warehouses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all access to saved_warehouses" ON saved_warehouses;
DROP POLICY IF EXISTS "Users can view saved warehouses" ON saved_warehouses;
DROP POLICY IF EXISTS "Users can insert saved warehouses" ON saved_warehouses;
DROP POLICY IF EXISTS "Users can delete saved warehouses" ON saved_warehouses;

-- Create permissive policies (allow all operations for authenticated and anon users)
CREATE POLICY "Allow all access to saved_warehouses"
  ON saved_warehouses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON saved_warehouses TO anon;
GRANT ALL ON saved_warehouses TO authenticated;
GRANT ALL ON saved_warehouses TO service_role;

-- Also create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_seeker ON activity_logs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Enable RLS for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to activity_logs" ON activity_logs;

-- Create permissive policy
CREATE POLICY "Allow all access to activity_logs"
  ON activity_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON activity_logs TO anon;
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON activity_logs TO service_role;

-- Verify tables were created
SELECT 'saved_warehouses' as table_name, COUNT(*) as row_count FROM saved_warehouses
UNION ALL
SELECT 'activity_logs' as table_name, COUNT(*) as row_count FROM activity_logs;
