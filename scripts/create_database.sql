-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id VARCHAR(50) UNIQUE,
    warehouse_name VARCHAR(255) NOT NULL,
    location TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    total_size_sqft INTEGER DEFAULT 0,
    available_size_sqft INTEGER DEFAULT 0,
    available_area INTEGER GENERATED ALWAYS AS (available_size_sqft) STORED,
    pricing_inr_sqft_month DECIMAL(10,2) DEFAULT 0,
    warehouse_type VARCHAR(100),
    cold_storage BOOLEAN DEFAULT FALSE,
    temperature_controlled BOOLEAN DEFAULT FALSE,
    security_level VARCHAR(50),
    accessibility_road VARCHAR(100),
    parking_availability BOOLEAN DEFAULT FALSE,
    loading_dock BOOLEAN DEFAULT FALSE,
    crane_availability BOOLEAN DEFAULT FALSE,
    fire_safety BOOLEAN DEFAULT FALSE,
    surveillance_system BOOLEAN DEFAULT FALSE,
    power_backup BOOLEAN DEFAULT FALSE,
    distance_to_highway_km DECIMAL(8,2) DEFAULT 0,
    distance_to_port_km DECIMAL(8,2) DEFAULT 0,
    distance_to_airport_km DECIMAL(8,2) DEFAULT 0,
    distance_to_railway_km DECIMAL(8,2) DEFAULT 0,
    internet_connectivity BOOLEAN DEFAULT FALSE,
    compliance_certifications TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_state ON warehouses(state);
CREATE INDEX IF NOT EXISTS idx_warehouses_warehouse_type ON warehouses(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_warehouses_pricing ON warehouses(pricing_inr_sqft_month);
CREATE INDEX IF NOT EXISTS idx_warehouses_available_area ON warehouses(available_size_sqft);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_verified ON warehouses(is_verified);
CREATE INDEX IF NOT EXISTS idx_warehouses_owner_id ON warehouses(owner_id);

-- Enable Row Level Security
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Warehouses are viewable by everyone" ON warehouses
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own warehouses" ON warehouses
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own warehouses" ON warehouses
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own warehouses" ON warehouses
    FOR DELETE USING (auth.uid() = owner_id);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('owner', 'seeker')) DEFAULT 'seeker',
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    area_required INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    area_required INTEGER,
    budget_range VARCHAR(100),
    contact_phone VARCHAR(20),
    status VARCHAR(20) CHECK (status IN ('new', 'responded', 'closed')) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for bookings and inquiries
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for inquiries
CREATE POLICY "Users can view their own inquiries" ON inquiries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Warehouse owners can view inquiries for their warehouses" ON inquiries
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM warehouses WHERE id = inquiries.warehouse_id
        )
    );

CREATE POLICY "Users can create inquiries" ON inquiries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
