-- Warehouse Submissions Table (for pending approvals)
CREATE TABLE IF NOT EXISTS warehouse_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  
  -- Specifications
  total_area INTEGER NOT NULL,
  price_per_sqft INTEGER NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  
  -- Media & Documents
  images TEXT[] DEFAULT '{}',
  documents JSONB DEFAULT '{}',
  
  -- Status & Review
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_owner_id ON warehouse_submissions(owner_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_status ON warehouse_submissions(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_submissions_city ON warehouse_submissions(city);

-- Add RLS policies
ALTER TABLE warehouse_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view their own submissions
CREATE POLICY warehouse_submissions_owner_select 
  ON warehouse_submissions FOR SELECT 
  USING (owner_id = auth.uid());

-- Policy: Owners can insert their own submissions
CREATE POLICY warehouse_submissions_owner_insert 
  ON warehouse_submissions FOR INSERT 
  WITH CHECK (owner_id = auth.uid());

-- Policy: Owners can update their own pending submissions
CREATE POLICY warehouse_submissions_owner_update 
  ON warehouse_submissions FOR UPDATE 
  USING (owner_id = auth.uid() AND status = 'pending');

-- Policy: Admins can view all submissions (you'll need to add a is_admin field to users table)
-- For now, let's use a simple email check
-- Note: You should implement proper role-based access control

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  
  -- Notification Details
  type TEXT NOT NULL CHECK (type IN ('approval', 'rejection', 'submission', 'booking', 'payment', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY notifications_user_select 
  ON notifications FOR SELECT 
  USING (user_id = auth.uid());

-- Policy: Users can update (mark as read) their own notifications
CREATE POLICY notifications_user_update 
  ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_warehouse_submissions_updated_at 
  BEFORE UPDATE ON warehouse_submissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add columns to existing warehouses table if they don't exist
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES warehouse_submissions(id);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS approved_by UUID;

COMMENT ON TABLE warehouse_submissions IS 'Stores pending warehouse listings waiting for admin approval';
COMMENT ON TABLE notifications IS 'Stores user notifications for various events';
