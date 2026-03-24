-- SQL Queries to Investigate Warehouse Data Structure
-- Run these in your Supabase SQL Editor

-- 1. Check the table structure (column names and types)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'warehouses'
ORDER BY ordinal_position;

-- 2. Get DISTINCT city values to see exact naming
SELECT DISTINCT city, COUNT(*) as warehouse_count
FROM warehouses
GROUP BY city
ORDER BY city;

-- 3. Get DISTINCT district values
SELECT DISTINCT district, COUNT(*) as warehouse_count
FROM warehouses
GROUP BY district
ORDER BY district;

-- 4. Check for Mumbai-related entries specifically (MOST IMPORTANT!)
SELECT DISTINCT city, district, COUNT(*) as count
FROM warehouses
WHERE city ILIKE '%mumbai%' OR district ILIKE '%mumbai%'
GROUP BY city, district
ORDER BY city, district;

-- 5. Sample data for Mumbai locations
SELECT id, name, city, district, state, price_per_sqft, total_area
FROM warehouses
WHERE city ILIKE '%mumbai%' OR district ILIKE '%mumbai%'
LIMIT 20;

-- 6. Check warehouse_type column distribution
SELECT DISTINCT warehouse_type, COUNT(*) as count
FROM warehouses
WHERE warehouse_type IS NOT NULL
GROUP BY warehouse_type
ORDER BY warehouse_type;

-- 7. FULL WAREHOUSE DETAILS - All columns for first 10 warehouses
SELECT *
FROM warehouses
LIMIT 10;

-- 8. Detailed warehouse info with all important fields
SELECT 
    id,
    name,
    city,
    district,
    state,
    address,
    warehouse_type,
    price_per_sqft,
    total_area,
    available_area,
    features,
    amenities,
    rating,
    occupancy,
    verified,
    license_number,
    license_expiry,
    created_at,
    updated_at
FROM warehouses
ORDER BY id
LIMIT 20;

-- 9. CRITICAL: Check exact city names for Mumbai, Navi Mumbai, Thane
SELECT DISTINCT city, COUNT(*) as count
FROM warehouses
WHERE city ILIKE '%mumbai%' OR city ILIKE '%thane%'
GROUP BY city
ORDER BY city;
