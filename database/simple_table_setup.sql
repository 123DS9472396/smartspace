-- SIMPLE TABLE CREATION - Create just the warehouse_submissions table
-- Run this in Supabase SQL Editor if complete_supabase_setup.sql has issues

-- 1. Create warehouse_submissions table
CREATE TABLE IF NOT EXISTS public.warehouse_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    total_area INTEGER NOT NULL,
    price_per_sqft INTEGER NOT NULL,
    amenities JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    image_urls JSONB DEFAULT '[]',
    document_urls JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on warehouse_submissions
ALTER TABLE public.warehouse_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create basic RLS policies
CREATE POLICY "Users can view own submissions" ON public.warehouse_submissions
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own submissions" ON public.warehouse_submissions
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 4. Create admin policies (allow all operations for now)
CREATE POLICY "Public read access for admins" ON public.warehouse_submissions
    FOR SELECT USING (true);

CREATE POLICY "Public update access for admins" ON public.warehouse_submissions
    FOR UPDATE USING (true);

-- 5. Success message
SELECT 'warehouse_submissions table created successfully! ✅' as status,
       'Table is ready for submissions and admin workflow' as message;