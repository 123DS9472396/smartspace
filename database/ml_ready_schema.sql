-- =====================================================
-- ML/LLM READY DATABASE ENHANCEMENT
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: ADD ML-READY COLUMNS
-- =====================================================

-- 1.1 Full-text search vector
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 1.2 ML categorical columns
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS price_category TEXT;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS size_category TEXT;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city_tier INTEGER;

-- 1.3 Create index for search
CREATE INDEX IF NOT EXISTS idx_warehouses_search ON warehouses USING GIN(search_vector);

-- =====================================================
-- PART 2: POPULATE SEARCH VECTOR
-- =====================================================

UPDATE warehouses SET search_vector = 
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '') || ' ' ||
    COALESCE(city, '') || ' ' || 
    COALESCE(district, '') || ' ' ||
    COALESCE(warehouse_type, '') || ' ' ||
    COALESCE(state, '') || ' ' ||
    COALESCE(address, '')
  );

-- =====================================================
-- PART 3: POPULATE PRICE CATEGORY
-- Based on Maharashtra market rates
-- =====================================================

UPDATE warehouses SET price_category = 
  CASE 
    WHEN price_per_sqft <= 35 THEN 'budget'      -- Rural/Tier-4 cities
    WHEN price_per_sqft <= 55 THEN 'standard'    -- Tier-3 cities
    WHEN price_per_sqft <= 80 THEN 'premium'     -- Tier-2 cities  
    ELSE 'luxury'                                 -- Mumbai/Thane
  END
WHERE price_category IS NULL;

-- =====================================================
-- PART 4: POPULATE SIZE CATEGORY
-- =====================================================

UPDATE warehouses SET size_category = 
  CASE 
    WHEN total_area <= 25000 THEN 'small'
    WHEN total_area <= 75000 THEN 'medium'
    WHEN total_area <= 150000 THEN 'large'
    ELSE 'enterprise'
  END
WHERE size_category IS NULL;

-- =====================================================
-- PART 5: POPULATE CITY TIER
-- Based on Maharashtra economic zones
-- =====================================================

UPDATE warehouses SET city_tier = 
  CASE 
    WHEN city IN ('Mumbai', 'Mumbai City', 'Navi Mumbai') THEN 1
    WHEN city IN ('Thane', 'Thane City', 'Pune', 'Pune City') THEN 2
    WHEN city IN ('Nagpur', 'Nagpur City', 'Nashik', 'Nashik City', 'Raigad', 'Raigad City') THEN 2
    WHEN city IN ('Aurangabad', 'Aurangabad City', 'Kolhapur', 'Kolhapur City') THEN 3
    WHEN city IN ('Solapur', 'Solapur City', 'Ahmednagar', 'Ahmednagar City') THEN 3
    ELSE 4
  END
WHERE city_tier IS NULL;

-- =====================================================
-- PART 6: CREATE SEARCH FUNCTION
-- =====================================================

-- Drop ALL existing function signatures to avoid conflicts
DROP FUNCTION IF EXISTS search_warehouses(TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, INTEGER);
DROP FUNCTION IF EXISTS search_warehouses(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION search_warehouses(
  search_query TEXT,
  p_city TEXT DEFAULT NULL,
  p_district TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_warehouse_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  district TEXT,
  price_per_sqft NUMERIC,
  warehouse_type TEXT,
  total_area INTEGER,
  rating NUMERIC,
  images TEXT[],
  latitude NUMERIC,
  longitude NUMERIC,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.city,
    w.district,
    w.price_per_sqft,
    w.warehouse_type,
    w.total_area,
    w.rating,
    w.images,
    w.latitude,
    w.longitude,
    ts_rank(w.search_vector, plainto_tsquery('english', search_query)) as search_rank
  FROM warehouses w
  WHERE 
    w.status = 'active'
    AND (search_query IS NULL OR search_query = '' OR w.search_vector @@ plainto_tsquery('english', search_query))
    AND (p_city IS NULL OR w.city ILIKE '%' || p_city || '%')
    AND (p_district IS NULL OR w.district ILIKE '%' || p_district || '%')
    AND (p_min_price IS NULL OR w.price_per_sqft >= p_min_price)
    AND (p_max_price IS NULL OR w.price_per_sqft <= p_max_price)
    AND (p_warehouse_type IS NULL OR w.warehouse_type ILIKE '%' || p_warehouse_type || '%')
  ORDER BY 
    CASE WHEN search_query IS NOT NULL AND search_query != '' 
         THEN ts_rank(w.search_vector, plainto_tsquery('english', search_query)) 
         ELSE 0 END DESC,
    w.rating DESC,
    w.price_per_sqft ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 7: CREATE RECOMMENDATION FUNCTION
-- ML-based scoring algorithm
-- =====================================================

-- Drop ALL existing function signatures to avoid conflicts
DROP FUNCTION IF EXISTS get_ml_recommendations(TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_ml_recommendations(TEXT, TEXT, NUMERIC, TEXT, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS get_ml_recommendations(TEXT, TEXT, NUMERIC, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_ml_recommendations(
  p_user_city TEXT DEFAULT NULL,
  p_user_district TEXT DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_warehouse_type TEXT DEFAULT NULL,
  p_min_area INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  district TEXT,
  price_per_sqft NUMERIC,
  warehouse_type TEXT,
  total_area INTEGER,
  rating NUMERIC,
  occupancy NUMERIC,
  images TEXT[],
  latitude NUMERIC,
  longitude NUMERIC,
  match_score INTEGER,
  reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.city,
    w.district,
    w.price_per_sqft,
    w.warehouse_type,
    w.total_area,
    w.rating,
    w.occupancy,
    w.images,
    w.latitude,
    w.longitude,
    -- ML Score Calculation
    (
      -- Location match (30 points)
      CASE 
        WHEN p_user_district IS NOT NULL AND w.district ILIKE '%' || p_user_district || '%' THEN 30
        WHEN p_user_city IS NOT NULL AND w.city ILIKE '%' || p_user_city || '%' THEN 20
        ELSE 10
      END +
      -- Price match (25 points)
      CASE 
        WHEN p_max_price IS NULL THEN 15
        WHEN w.price_per_sqft <= p_max_price * 0.8 THEN 25  -- 20% under budget
        WHEN w.price_per_sqft <= p_max_price THEN 20
        WHEN w.price_per_sqft <= p_max_price * 1.1 THEN 10  -- 10% over budget
        ELSE 0
      END +
      -- Type match (20 points)
      CASE 
        WHEN p_warehouse_type IS NOT NULL AND w.warehouse_type ILIKE '%' || p_warehouse_type || '%' THEN 20
        ELSE 5
      END +
      -- Rating quality (15 points)
      CASE 
        WHEN w.rating >= 4.5 THEN 15
        WHEN w.rating >= 4.0 THEN 12
        WHEN w.rating >= 3.5 THEN 8
        ELSE 5
      END +
      -- Availability (10 points)
      CASE 
        WHEN w.occupancy < 0.5 THEN 10
        WHEN w.occupancy < 0.7 THEN 7
        WHEN w.occupancy < 0.9 THEN 4
        ELSE 0
      END
    )::INTEGER as match_score,
    -- Generate reasons array using array_remove to filter NULLs
    array_remove(ARRAY[
      CASE WHEN p_user_district IS NOT NULL AND w.district ILIKE '%' || p_user_district || '%' 
           THEN 'Located in your preferred district' ELSE NULL END,
      CASE WHEN p_max_price IS NOT NULL AND w.price_per_sqft <= p_max_price * 0.8 
           THEN 'Under your budget' ELSE NULL END,
      CASE WHEN w.rating >= 4.5 THEN 'Highly rated (' || w.rating::TEXT || '/5)' ELSE NULL END,
      CASE WHEN w.occupancy < 0.5 THEN 'High availability' ELSE NULL END,
      CASE WHEN p_warehouse_type IS NOT NULL AND w.warehouse_type ILIKE '%' || p_warehouse_type || '%' 
           THEN 'Matches your preferred type' ELSE NULL END
    ], NULL) as reasons
  FROM warehouses w
  WHERE 
    w.status = 'active'
    AND (p_min_area IS NULL OR w.total_area >= p_min_area)
  ORDER BY match_score DESC, w.rating DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 8: CREATE TRIGGER FOR AUTO-UPDATE SEARCH VECTOR
-- =====================================================

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' || 
    COALESCE(NEW.district, '') || ' ' ||
    COALESCE(NEW.warehouse_type, '') || ' ' ||
    COALESCE(NEW.state, '') || ' ' ||
    COALESCE(NEW.address, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_search_vector ON warehouses;
CREATE TRIGGER trigger_update_search_vector
  BEFORE INSERT OR UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check ML columns coverage
SELECT 
  'search_vector' as column_name,
  COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as populated,
  COUNT(*) as total
FROM warehouses
UNION ALL
SELECT 'price_category', COUNT(*) FILTER (WHERE price_category IS NOT NULL), COUNT(*) FROM warehouses
UNION ALL
SELECT 'size_category', COUNT(*) FILTER (WHERE size_category IS NOT NULL), COUNT(*) FROM warehouses
UNION ALL
SELECT 'city_tier', COUNT(*) FILTER (WHERE city_tier IS NOT NULL), COUNT(*) FROM warehouses;

-- Test search function
SELECT * FROM search_warehouses('cold storage pharmaceutical', 'Pune', NULL, NULL, 100, NULL, 5);

-- Test recommendations function
SELECT * FROM get_ml_recommendations('Pune', 'Pune City', 60, 'General Storage', 10000, 5);
