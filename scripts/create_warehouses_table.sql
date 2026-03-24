-- Create the correct warehouses table structure based on our TypeScript interface
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_name TEXT NOT NULL,
  warehouse_licence_number TEXT NOT NULL,
  warehouse_address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  capacity_mt INTEGER NOT NULL,
  registration_date DATE NOT NULL,
  licence_valid_upto DATE NOT NULL,
  owner_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  micro_rental_spaces INTEGER NOT NULL,
  owner_email TEXT NOT NULL,
  pricing_inr_sqft_month INTEGER NOT NULL,
  warehouse_type TEXT NOT NULL,
  total_size_sqft INTEGER NOT NULL,
  latitude REAL,
  longitude REAL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_state ON warehouses(state);
CREATE INDEX IF NOT EXISTS idx_warehouses_warehouse_type ON warehouses(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_warehouses_pricing ON warehouses(pricing_inr_sqft_month);
CREATE INDEX IF NOT EXISTS idx_warehouses_capacity ON warehouses(capacity_mt);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_verified ON warehouses(is_verified);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_owner_id ON warehouses(owner_id);

-- Enable Row Level Security
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Warehouses are viewable by everyone" ON warehouses
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own warehouses" ON warehouses
    FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can update their own warehouses" ON warehouses
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own warehouses" ON warehouses
    FOR DELETE USING (auth.uid() = owner_id);
