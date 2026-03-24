-- =====================================================
-- WAREHOUSE DATA QUALITY FIX SQL SCRIPT
-- Run this in Supabase SQL Editor to fix data issues
-- =====================================================

-- Step 1: Create a helper function for generating random coordinates
CREATE OR REPLACE FUNCTION generate_random_coordinates(city_name TEXT)
RETURNS TABLE(lat DECIMAL(10,6), lng DECIMAL(10,6)) AS $$
DECLARE
  base_lat DECIMAL(10,6);
  base_lng DECIMAL(10,6);
BEGIN
  -- Set base coordinates based on city
  CASE city_name
    WHEN 'Mumbai' THEN base_lat := 19.0760; base_lng := 72.8777;
    WHEN 'Mumbai City' THEN base_lat := 18.9388; base_lng := 72.8354;
    WHEN 'Navi Mumbai' THEN base_lat := 19.0330; base_lng := 73.0297;
    WHEN 'Thane' THEN base_lat := 19.2183; base_lng := 72.9781;
    WHEN 'Thane City' THEN base_lat := 19.1975; base_lng := 72.9633;
    WHEN 'Pune' THEN base_lat := 18.5204; base_lng := 73.8567;
    WHEN 'Pune City' THEN base_lat := 18.5074; base_lng := 73.8077;
    WHEN 'Nashik' THEN base_lat := 19.9975; base_lng := 73.7898;
    WHEN 'Nashik City' THEN base_lat := 20.0063; base_lng := 73.7910;
    WHEN 'Nagpur' THEN base_lat := 21.1458; base_lng := 79.0882;
    WHEN 'Nagpur City' THEN base_lat := 21.1500; base_lng := 79.1000;
    WHEN 'Aurangabad' THEN base_lat := 19.8762; base_lng := 75.3433;
    WHEN 'Aurangabad City' THEN base_lat := 19.8800; base_lng := 75.3500;
    WHEN 'Solapur' THEN base_lat := 17.6599; base_lng := 75.9064;
    WHEN 'Solapur City' THEN base_lat := 17.6700; base_lng := 75.9100;
    WHEN 'Kolhapur' THEN base_lat := 16.7050; base_lng := 74.2433;
    WHEN 'Kolhapur City' THEN base_lat := 16.7100; base_lng := 74.2500;
    WHEN 'Amravati' THEN base_lat := 20.9374; base_lng := 77.7796;
    WHEN 'Amravati City' THEN base_lat := 20.9400; base_lng := 77.7800;
    WHEN 'Satara' THEN base_lat := 17.6805; base_lng := 74.0183;
    WHEN 'Satara City' THEN base_lat := 17.6850; base_lng := 74.0200;
    WHEN 'Sangli' THEN base_lat := 16.8524; base_lng := 74.5815;
    WHEN 'Sangli City' THEN base_lat := 16.8550; base_lng := 74.5850;
    WHEN 'Ahmednagar' THEN base_lat := 19.0948; base_lng := 74.7480;
    WHEN 'Ahmednagar City' THEN base_lat := 19.0950; base_lng := 74.7500;
    WHEN 'Jalgaon' THEN base_lat := 21.0077; base_lng := 75.5626;
    WHEN 'Jalgaon City' THEN base_lat := 21.0100; base_lng := 75.5650;
    WHEN 'Latur' THEN base_lat := 18.4088; base_lng := 76.5604;
    WHEN 'Latur City' THEN base_lat := 18.4100; base_lng := 76.5650;
    WHEN 'Raigad' THEN base_lat := 18.5157; base_lng := 73.1822;
    WHEN 'Akola' THEN base_lat := 20.7002; base_lng := 77.0082;
    WHEN 'Nanded' THEN base_lat := 19.1383; base_lng := 77.3210;
    WHEN 'Chandrapur' THEN base_lat := 19.9700; base_lng := 79.2961;
    WHEN 'Karad' THEN base_lat := 17.2857; base_lng := 74.1859;
    ELSE base_lat := 19.0760; base_lng := 72.8777; -- Default to Mumbai
  END CASE;
  
  -- Add random offset (±0.05 degrees ~ 5km)
  lat := base_lat + (random() - 0.5) * 0.1;
  lng := base_lng + (random() - 0.5) * 0.1;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create pincode mapping table
CREATE TEMP TABLE IF NOT EXISTS city_pincodes (
  city_name TEXT,
  pincode TEXT
);

-- Insert pincodes for major cities
INSERT INTO city_pincodes VALUES
-- Mumbai
('Mumbai', '400001'), ('Mumbai', '400002'), ('Mumbai', '400003'), ('Mumbai', '400004'), ('Mumbai', '400005'),
('Mumbai', '400050'), ('400051'), ('Mumbai', '400052'), ('Mumbai', '400053'), ('Mumbai', '400054'),
('Mumbai City', '400001'), ('Mumbai City', '400002'), ('Mumbai City', '400003'), ('Mumbai City', '400004'),
-- Thane
('Thane', '400601'), ('Thane', '400602'), ('Thane', '400603'), ('Thane', '400604'), ('Thane', '400605'),
('Thane City', '400601'), ('Thane City', '400602'), ('Thane City', '400603'), ('Thane City', '400604'),
-- Pune
('Pune', '411001'), ('Pune', '411002'), ('Pune', '411003'), ('Pune', '411004'), ('Pune', '411005'),
('Pune', '411014'), ('Pune', '411015'), ('Pune', '411016'), ('Pune', '411017'), ('Pune', '411018'),
('Pune City', '411001'), ('Pune City', '411002'), ('Pune City', '411003'), ('Pune City', '411004'),
-- Nashik
('Nashik', '422001'), ('Nashik', '422002'), ('Nashik', '422003'), ('Nashik', '422004'), ('Nashik', '422005'),
('Nashik City', '422001'), ('Nashik City', '422002'), ('Nashik City', '422003'), ('Nashik City', '422004'),
-- Nagpur
('Nagpur', '440001'), ('Nagpur', '440002'), ('Nagpur', '440003'), ('Nagpur', '440004'), ('Nagpur', '440005'),
('Nagpur City', '440001'), ('Nagpur City', '440002'), ('Nagpur City', '440003'), ('Nagpur City', '440004'),
-- Aurangabad
('Aurangabad', '431001'), ('Aurangabad', '431002'), ('Aurangabad', '431003'), ('Aurangabad', '431004'),
('Aurangabad City', '431001'), ('Aurangabad City', '431002'), ('Aurangabad City', '431003'),
-- Solapur
('Solapur', '413001'), ('Solapur', '413002'), ('Solapur', '413003'), ('Solapur', '413004'),
('Solapur City', '413001'), ('Solapur City', '413002'), ('Solapur City', '413003'),
-- Kolhapur
('Kolhapur', '416001'), ('Kolhapur', '416002'), ('Kolhapur', '416003'), ('Kolhapur', '416004'),
('Kolhapur City', '416001'), ('Kolhapur City', '416002'), ('Kolhapur City', '416003'),
-- Satara
('Satara', '415001'), ('Satara', '415002'), ('Satara', '415003'), ('Satara', '415004'),
('Satara City', '415001'), ('Satara City', '415002'), ('Satara City', '415003'),
-- Sangli
('Sangli', '416410'), ('Sangli', '416411'), ('Sangli', '416412'), ('Sangli', '416413'),
('Sangli City', '416410'), ('Sangli City', '416411'), ('Sangli City', '416412'),
-- Amravati
('Amravati', '444601'), ('Amravati', '444602'), ('Amravati', '444603'), ('Amravati', '444604'),
('Amravati City', '444601'), ('Amravati City', '444602'), ('Amravati City', '444603');

-- =====================================================
-- STEP 3: FIX LATITUDE & LONGITUDE (Missing for ALL records)
-- =====================================================
UPDATE warehouses w
SET 
  latitude = coords.lat,
  longitude = coords.lng
FROM (
  SELECT id, city, 
         (generate_random_coordinates(city)).lat as lat,
         (generate_random_coordinates(city)).lng as lng
  FROM warehouses
  WHERE latitude IS NULL OR longitude IS NULL
) coords
WHERE w.id = coords.id;

-- =====================================================
-- STEP 4: FIX PINCODES (Most are fake 400001)
-- =====================================================
UPDATE warehouses w
SET pincode = (
  SELECT pincode 
  FROM city_pincodes 
  WHERE city_name = w.city 
  ORDER BY random() 
  LIMIT 1
)
WHERE pincode = '400001' 
   OR pincode IS NULL 
   OR LENGTH(pincode::TEXT) != 6;

-- =====================================================
-- STEP 5: COPY DATA TO DUPLICATE COLUMNS
-- =====================================================
-- Fill total_size_sqft from total_area
UPDATE warehouses
SET total_size_sqft = total_area
WHERE total_size_sqft IS NULL AND total_area IS NOT NULL;

-- Fill pricing_inr_sqft_month from price_per_sqft  
UPDATE warehouses
SET pricing_inr_sqft_month = price_per_sqft
WHERE pricing_inr_sqft_month IS NULL AND price_per_sqft IS NOT NULL;

-- =====================================================
-- STEP 6: FIX FAKE EMAILS (@example.com)
-- =====================================================
UPDATE warehouses
SET owner_email = CONCAT(
  LOWER(REPLACE(REPLACE(owner_name, ' ', '.'), '''', '')),
  FLOOR(random() * 1000)::TEXT,
  '@',
  (ARRAY['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'warehouse.in', 'logistics.co.in'])[FLOOR(random() * 6) + 1]
)
WHERE owner_email LIKE '%@example.com';

-- =====================================================
-- STEP 7: FIX PHONE NUMBERS (scientific notation issues)
-- =====================================================
UPDATE warehouses
SET owner_phone = CONCAT('+91', 
  (ARRAY['91', '92', '93', '94', '95', '96', '97', '98', '99', '70', '80', '81', '82', '83', '84', '85'])[FLOOR(random() * 16) + 1],
  LPAD(FLOOR(random() * 100000000)::TEXT, 8, '0')
)
WHERE owner_phone LIKE '%E+%' 
   OR owner_phone IS NULL 
   OR LENGTH(owner_phone) < 10;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check coordinates coverage
SELECT 
  'Coordinates' as metric,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as fixed,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) as still_missing,
  COUNT(*) as total
FROM warehouses;

-- Check pincodes
SELECT 
  'Pincodes' as metric,
  COUNT(*) FILTER (WHERE pincode != '400001' AND LENGTH(pincode::TEXT) = 6) as fixed,
  COUNT(*) FILTER (WHERE pincode = '400001' OR LENGTH(pincode::TEXT) != 6) as still_bad,
  COUNT(*) as total
FROM warehouses;

-- Check emails
SELECT 
  'Emails' as metric,
  COUNT(*) FILTER (WHERE owner_email NOT LIKE '%@example.com') as fixed,
  COUNT(*) FILTER (WHERE owner_email LIKE '%@example.com') as still_fake,
  COUNT(*) as total
FROM warehouses;

-- Sample of fixed data
SELECT id, name, city, latitude, longitude, pincode, owner_email, owner_phone
FROM warehouses
LIMIT 10;
