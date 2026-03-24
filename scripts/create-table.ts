import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTable() {
  console.log('🚀 Creating warehouses table with policies...\n');

  const sql = `
-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wh_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  state text NOT NULL DEFAULT 'Maharashtra',
  pincode text,
  latitude numeric,
  longitude numeric,
  total_area integer NOT NULL,
  capacity integer NOT NULL,
  price_per_sqft numeric NOT NULL,
  micro_rental_spaces integer DEFAULT 0,
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  status text DEFAULT 'active',
  occupancy numeric DEFAULT 0.5,
  rating numeric DEFAULT 4.0,
  reviews_count integer DEFAULT 0,
  warehouse_type text,
  ownership_certificate text,
  owner_name text,
  owner_email text,
  owner_phone text,
  registration_date date,
  license_valid_upto date,
  total_blocks integer DEFAULT 100,
  available_blocks integer DEFAULT 50,
  grid_rows integer DEFAULT 10,
  grid_cols integer DEFAULT 10,
  owner_id uuid,
  contact_person text,
  contact_phone text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses(district);
CREATE INDEX IF NOT EXISTS idx_warehouses_state ON warehouses(state);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_price ON warehouses(price_per_sqft);
CREATE INDEX IF NOT EXISTS idx_warehouses_rating ON warehouses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(warehouse_type);

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON warehouses;
DROP POLICY IF EXISTS "Service role full access" ON warehouses;
DROP POLICY IF EXISTS "Anyone can view active warehouses" ON warehouses;

-- Public read policy
CREATE POLICY "Public read access"
ON warehouses FOR SELECT
USING (true);

-- Service role full access policy
CREATE POLICY "Service role full access"
ON warehouses
TO service_role
USING (true)
WITH CHECK (true);
`;

  try {
    // Execute the SQL using Supabase RPC or direct query
    // Since Supabase doesn't have a direct SQL execution endpoint via the client,
    // we need to use the REST API or create an RPC function

    console.log('📝 SQL to execute (copy and paste to Supabase SQL Editor):\n');
    console.log('   https://supabase.com/dashboard/project/bsrzqffxgvdebyofmhzg/sql\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n✅ After running the SQL above, you can import warehouses.\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTable();
