-- Add missing columns to the warehouses table
-- Run this in your Supabase SQL Editor

-- Add warehouse_type column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='warehouse_type') THEN
        ALTER TABLE warehouses ADD COLUMN warehouse_type VARCHAR(100) DEFAULT 'General Storage';
    END IF;
END $$;

-- Add pincode column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='pincode') THEN
        ALTER TABLE warehouses ADD COLUMN pincode VARCHAR(10) DEFAULT '400001';
    END IF;
END $$;

-- Add facility columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='cold_storage') THEN
        ALTER TABLE warehouses ADD COLUMN cold_storage BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='temperature_controlled') THEN
        ALTER TABLE warehouses ADD COLUMN temperature_controlled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='security_level') THEN
        ALTER TABLE warehouses ADD COLUMN security_level VARCHAR(50) DEFAULT 'Basic';
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='accessibility_road') THEN
        ALTER TABLE warehouses ADD COLUMN accessibility_road VARCHAR(100) DEFAULT 'Good';
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='parking_availability') THEN
        ALTER TABLE warehouses ADD COLUMN parking_availability BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='loading_dock') THEN
        ALTER TABLE warehouses ADD COLUMN loading_dock BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='crane_availability') THEN
        ALTER TABLE warehouses ADD COLUMN crane_availability BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='fire_safety') THEN
        ALTER TABLE warehouses ADD COLUMN fire_safety BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='surveillance_system') THEN
        ALTER TABLE warehouses ADD COLUMN surveillance_system BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='power_backup') THEN
        ALTER TABLE warehouses ADD COLUMN power_backup BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='distance_to_highway_km') THEN
        ALTER TABLE warehouses ADD COLUMN distance_to_highway_km DECIMAL(8,2) DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='distance_to_port_km') THEN
        ALTER TABLE warehouses ADD COLUMN distance_to_port_km DECIMAL(8,2) DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='distance_to_airport_km') THEN
        ALTER TABLE warehouses ADD COLUMN distance_to_airport_km DECIMAL(8,2) DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='distance_to_railway_km') THEN
        ALTER TABLE warehouses ADD COLUMN distance_to_railway_km DECIMAL(8,2) DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='internet_connectivity') THEN
        ALTER TABLE warehouses ADD COLUMN internet_connectivity BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='warehouses' AND column_name='compliance_certifications') THEN
        ALTER TABLE warehouses ADD COLUMN compliance_certifications TEXT;
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_warehouses_warehouse_type ON warehouses(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_warehouses_cold_storage ON warehouses(cold_storage);
CREATE INDEX IF NOT EXISTS idx_warehouses_security_level ON warehouses(security_level);

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'warehouses' 
ORDER BY ordinal_position;
