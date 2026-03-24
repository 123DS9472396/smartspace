# Warehouse Data Quality Improvement Guide for ML/LLM Integration

## Current Data Analysis Summary

| Metric | Current Status | Target |
|--------|---------------|--------|
| Total Records | 10,002 | Keep all |
| Columns | 46 (too many) | 25-30 (optimized) |
| Missing Lat/Long | 100% | 0% |
| Fake Emails | 99.5% | 0% |
| Invalid Pincodes | ~99% | 0% |
| Unique Cities | 13 | 13+ |
| Unique Districts | 10 | 10+ |

---

## 🔧 How to Fix the Data

### Option 1: Run the Node.js Script (Recommended)

```bash
cd "c:\Users\admin\Downloads\project-bolt-github-lqwkke5x (1)\project"

# Dry run first (no changes made)
node scripts/fix-warehouse-data-quality.js --dry-run

# Apply fixes
node scripts/fix-warehouse-data-quality.js

# Verify changes
node scripts/fix-warehouse-data-quality.js --verify
```

### Option 2: Run SQL in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Open and run: `database/fix_data_quality.sql`

---

## 📊 Recommended Schema Optimization for ML/LLM

### Essential Columns (Keep - 25 columns)

| Column | Type | Purpose for ML |
|--------|------|----------------|
| `id` | UUID | Primary key |
| `wh_id` | TEXT | License number |
| `name` | TEXT | NLP - name matching |
| `description` | TEXT | NLP - semantic search |
| `address` | TEXT | NLP - location parsing |
| `city` | TEXT | Categorical - filtering |
| `district` | TEXT | Categorical - grouping |
| `state` | TEXT | Categorical - filtering |
| `pincode` | TEXT | Geographic clustering |
| `latitude` | DECIMAL | Geospatial ML |
| `longitude` | DECIMAL | Geospatial ML |
| `total_area` | INTEGER | Numerical feature |
| `capacity` | INTEGER | Numerical feature |
| `price_per_sqft` | INTEGER | Numerical - pricing ML |
| `warehouse_type` | TEXT | Categorical - classification |
| `amenities` | JSONB | NLP - feature extraction |
| `features` | JSONB | NLP - feature extraction |
| `status` | TEXT | Categorical - filtering |
| `occupancy` | DECIMAL | Numerical feature |
| `rating` | DECIMAL | Numerical feature |
| `reviews_count` | INTEGER | Numerical feature |
| `images` | JSONB | Image ML (future) |
| `owner_id` | UUID | Relational |
| `created_at` | TIMESTAMP | Time series |
| `updated_at` | TIMESTAMP | Time series |

### Columns to Remove (21 redundant columns)

| Column | Reason |
|--------|--------|
| `total_size_sqft` | Duplicate of `total_area` |
| `pricing_inr_sqft_month` | Duplicate of `price_per_sqft` |
| `contact_person` | Duplicate of owner info |
| `contact_phone` | Duplicate of `owner_phone` |
| `contact_email` | Duplicate of `owner_email` |
| `owner_name` | Move to profiles table |
| `owner_email` | Move to profiles table |
| `owner_phone` | Move to profiles table |
| `ownership_certificate` | Admin metadata |
| `registration_date` | Admin metadata |
| `license_valid_upto` | Admin metadata |
| `total_blocks` | Grid system only |
| `available_blocks` | Grid system only |
| `grid_rows` | Grid system only |
| `grid_cols` | Grid system only |
| `micro_rental_spaces` | Derived from blocks |
| `submission_id` | Admin metadata |
| `approved_at` | Admin metadata |
| `approved_by` | Admin metadata |
| `documents` | Admin metadata |
| `source_submission_id` | Admin metadata |

---

## 🤖 ML Feature Engineering Recommendations

### 1. Text Features (for NLP/LLM)

```sql
-- Create searchable text vector
ALTER TABLE warehouses ADD COLUMN search_vector tsvector;

UPDATE warehouses SET search_vector = 
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(warehouse_type, '') || ' ' ||
    COALESCE(array_to_string(amenities::text[], ' '), '')
  );

CREATE INDEX idx_search_vector ON warehouses USING GIN(search_vector);
```

### 2. Geospatial Features

```sql
-- Enable PostGIS (if not already)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column
ALTER TABLE warehouses ADD COLUMN location geography(POINT, 4326);

UPDATE warehouses 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX idx_location ON warehouses USING GIST(location);
```

### 3. Price Categories for Classification

```sql
ALTER TABLE warehouses ADD COLUMN price_category TEXT;

UPDATE warehouses SET price_category = 
  CASE 
    WHEN price_per_sqft <= 40 THEN 'budget'
    WHEN price_per_sqft <= 70 THEN 'standard'
    WHEN price_per_sqft <= 100 THEN 'premium'
    ELSE 'luxury'
  END;
```

### 4. Size Categories

```sql
ALTER TABLE warehouses ADD COLUMN size_category TEXT;

UPDATE warehouses SET size_category = 
  CASE 
    WHEN total_area <= 25000 THEN 'small'
    WHEN total_area <= 75000 THEN 'medium'
    WHEN total_area <= 150000 THEN 'large'
    ELSE 'enterprise'
  END;
```

---

## 🔄 Data Quality Monitoring

### Add these views for ongoing monitoring:

```sql
CREATE VIEW data_quality_metrics AS
SELECT
  COUNT(*) as total_warehouses,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as has_coordinates,
  COUNT(*) FILTER (WHERE owner_email NOT LIKE '%@example.com') as valid_emails,
  COUNT(*) FILTER (WHERE LENGTH(pincode::TEXT) = 6) as valid_pincodes,
  COUNT(DISTINCT city) as unique_cities,
  COUNT(DISTINCT warehouse_type) as unique_types,
  AVG(rating) as avg_rating,
  AVG(price_per_sqft) as avg_price
FROM warehouses;
```

---

## 🌐 Real Dataset Sources (If You Want Real Data)

If you want to replace with real warehouse data:

1. **IndiaMART** - Warehouse listings API
2. **99acres Commercial** - Real estate data
3. **Magicbricks Commercial** - Warehouse listings  
4. **WDRA (Warehousing Development Regulatory Authority)** - Official registered warehouses
5. **CII Logistics** - Industry data

### Data Fields from Real Sources:

| Source | Available Fields |
|--------|-----------------|
| WDRA | License, Capacity, Location, Owner, Type |
| IndiaMART | Name, Address, Features, Contact, Images |
| 99acres | Price, Area, Amenities, Location, Photos |

---

## ✅ Post-Fix Verification Checklist

Run this query after fixing:

```sql
SELECT 
  '1. Coordinates' as check,
  ROUND(100.0 * COUNT(*) FILTER (WHERE latitude IS NOT NULL) / COUNT(*), 1) || '%' as coverage
FROM warehouses
UNION ALL
SELECT 
  '2. Valid Pincodes',
  ROUND(100.0 * COUNT(*) FILTER (WHERE pincode NOT LIKE '400001%') / COUNT(*), 1) || '%'
FROM warehouses
UNION ALL
SELECT 
  '3. Real Emails',
  ROUND(100.0 * COUNT(*) FILTER (WHERE owner_email NOT LIKE '%@example.com') / COUNT(*), 1) || '%'
FROM warehouses
UNION ALL
SELECT 
  '4. Valid Phones',
  ROUND(100.0 * COUNT(*) FILTER (WHERE owner_phone NOT LIKE '%E+%') / COUNT(*), 1) || '%'
FROM warehouses;
```

Expected output after fix:
```
| check            | coverage |
|------------------|----------|
| 1. Coordinates   | 100.0%   |
| 2. Valid Pincodes| 100.0%   |
| 3. Real Emails   | 100.0%   |
| 4. Valid Phones  | 100.0%   |
```

---

## Summary

Your current database has **synthetic demo data** that was generated for testing. The main issues are:

1. **No geolocation** - All lat/long are NULL
2. **Fake contact info** - All emails end in @example.com
3. **Same pincodes** - Almost all are 400001
4. **Too many columns** - 46 columns with many redundant

The scripts I created will fix issues 1-4 without deleting your data. For ML/LLM integration, consider reducing to 25-30 essential columns and adding the feature engineering columns suggested above.
