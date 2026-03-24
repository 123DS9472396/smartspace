-- =====================================================
-- OWNER MODULE FIX - Database Schema Setup
-- =====================================================
-- This script fixes the owner_profiles table and related issues

-- 1. Create owner_profiles table if not exists
CREATE TABLE IF NOT EXISTS owner_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    profile_image_url TEXT,
    company_name TEXT,
    business_registration_number TEXT,
    gst_number TEXT,
    pan_number TEXT,
    business_address TEXT,
    city TEXT DEFAULT 'Mumbai',
    state TEXT DEFAULT 'Maharashtra',
    pincode TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'verified', 'rejected')),
    verification_score INTEGER DEFAULT 0,
    total_warehouses INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_owner_profiles_user_id ON owner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_email ON owner_profiles(email);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_verification ON owner_profiles(verification_status);

-- 3. Enable RLS
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON owner_profiles;

-- 5. Create RLS policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON owner_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON owner_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON owner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all profiles (for verification)
CREATE POLICY "Admins can view all profiles" ON owner_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 6. Create function to update total_warehouses count
CREATE OR REPLACE FUNCTION update_owner_warehouse_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update owner's warehouse count
    UPDATE owner_profiles
    SET total_warehouses = (
        SELECT COUNT(*) FROM warehouses WHERE owner_id = NEW.owner_id
    ),
    updated_at = NOW()
    WHERE user_id = NEW.owner_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-update warehouse count
DROP TRIGGER IF EXISTS trigger_update_owner_warehouse_count ON warehouses;
CREATE TRIGGER trigger_update_owner_warehouse_count
    AFTER INSERT OR DELETE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_owner_warehouse_count();

-- 8. Sync existing warehouse counts
UPDATE owner_profiles op
SET total_warehouses = (
    SELECT COUNT(*) FROM warehouses w WHERE w.owner_id = op.user_id
);

-- 9. Create verification_requests table for admin review
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES owner_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    profile_type TEXT DEFAULT 'owner',
    user_email TEXT,
    user_name TEXT,
    company_name TEXT,
    gst_number TEXT,
    pan_number TEXT,
    phone TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    ml_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Enable RLS on verification_requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON verification_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON verification_requests;

CREATE POLICY "Users can view own requests" ON verification_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all requests" ON verification_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 11. Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 12. Storage policies for user documents
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;

CREATE POLICY "Users can upload own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'user-documents');

-- 13. Verify setup
SELECT 'owner_profiles' as table_name, COUNT(*) as count FROM owner_profiles
UNION ALL
SELECT 'verification_requests', COUNT(*) FROM verification_requests;
