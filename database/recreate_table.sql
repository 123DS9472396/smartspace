-- Create table with different name to bypass cache issues
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS warehouse_submissions CASCADE;

CREATE TABLE warehouse_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    total_area integer NOT NULL,
    price_per_sqft integer NOT NULL,
    amenities jsonb DEFAULT '[]',
    features jsonb DEFAULT '[]',
    image_urls jsonb DEFAULT '[]',
    document_urls jsonb DEFAULT '{}',
    status text DEFAULT 'pending',
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Don't enable RLS for now to avoid permission issues
-- ALTER TABLE warehouse_submissions ENABLE ROW LEVEL SECURITY;

SELECT 'Table created successfully without RLS!' as status;