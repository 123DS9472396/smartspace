-- =============================================
-- SQL Queries to View All Warehouse Columns & Data
-- Run these in Supabase SQL Editor
-- =============================================

-- 1. View ALL columns with first 10 entries
SELECT * 
FROM warehouses 
ORDER BY id 
LIMIT 10;

-- 2. Complete warehouse details with ALL columns listed explicitly
SELECT 
    id,
    wh_id,
    name,
    description,
    address,
    city,
    district,
    state,
    pincode,
    latitude,
    longitude,
    total_area,
    capacity,
    price_per_sqft,
    micro_rental_spaces,
    images,
    amenities,
    features,
    status,
    occupancy,
    rating,
    reviews_count,
    warehouse_type,
    ownership_certificate,
    owner_name,
    owner_email,
    owner_phone,
    registration_date,
    license_valid_upto,
    total_blocks,
    available_blocks,
    grid_rows,
    grid_cols,
    owner_id,
    contact_person,
    contact_phone,
    contact_email,
    created_at,
    updated_at,
    submission_id,
    approved_at,
    approved_by,
    documents,
    source_submission_id,
    total_size_sqft,
    pricing_inr_sqft_month
FROM warehouses
ORDER BY id
LIMIT 10;

-- 3. IMPORTANT: Show Mumbai warehouses only (to verify strict filtering)
SELECT 
    id,
    name,
    city,
    district,
    price_per_sqft,
    total_area,
    warehouse_type,
    rating,
    license_valid_upto
FROM warehouses
WHERE district = 'Mumbai'
ORDER BY price_per_sqft
LIMIT 20;

-- 4. Count warehouses by district (to see data distribution)
SELECT district, COUNT(*) as count
FROM warehouses
GROUP BY district
ORDER BY count DESC;

-- 5. View warehouse types and their counts
SELECT warehouse_type, COUNT(*) as count
FROM warehouses
GROUP BY warehouse_type
ORDER BY count DESC;
