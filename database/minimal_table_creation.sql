-- MINIMAL TABLE CREATION - Just create the table with basic structure
-- Copy and paste this EXACTLY into Supabase SQL Editor

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
    amenities jsonb DEFAULT '[]'::jsonb,
    features jsonb DEFAULT '[]'::jsonb,
    image_urls jsonb DEFAULT '[]'::jsonb,
    document_urls jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending',
    submitted_at timestamptz DEFAULT now(),
    reviewed_at timestamptz,
    reviewed_by uuid,
    admin_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);