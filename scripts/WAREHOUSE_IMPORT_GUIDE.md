# Warehouse Data Import Guide

This guide explains how to import all 10,000 warehouses into your Supabase database.

## Overview

- **Total Warehouses**: 10,000
- **Data Source**: `client/data/enhanced-warehouses.ts`
- **Database**: Supabase (PostgreSQL)
- **Import Method**: SQL Script

## Quick Start

### Option 1: Using Generated SQL File (Recommended)

1. **Generate the SQL file**:
   ```bash
   npm run generate-warehouse-sql
   ```

2. **Open Supabase Dashboard**:
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **SQL Editor** from the left sidebar

3. **Execute the Import**:
   - Click "New Query"
   - Open the file: `scripts/insert-warehouses.sql` (6.76 MB)
   - Copy all contents
   - Paste into the SQL Editor
   - Click **"Run"** or press `Ctrl/Cmd + Enter`

4. **Wait for Completion**:
   - The import will take 2-5 minutes
   - You'll see a success message when complete
   - Verification queries will run automatically

### Option 2: Direct Script Import (If Node.js environment supports it)

```bash
npm run import-all-warehouses
```

**Note**: This requires network access to Supabase from your environment.

## Database Schema

The warehouses table includes these fields:

### Core Information
- `id` (uuid) - Primary key
- `wh_id` (text) - Warehouse license ID (e.g., LIC000001)
- `name` (text) - Warehouse/company name
- `description` (text) - Detailed description

### Location
- `address` (text) - Full address
- `city` (text) - City name
- `district` (text) - District name
- `state` (text) - State (Maharashtra)
- `pincode` (text) - Postal code
- `latitude` (numeric) - GPS coordinates
- `longitude` (numeric) - GPS coordinates

### Capacity & Pricing
- `total_area` (integer) - Total area in sq ft
- `capacity` (integer) - Storage capacity in MT
- `price_per_sqft` (numeric) - Monthly price per sq ft
- `micro_rental_spaces` (integer) - Number of micro units
- `occupancy` (numeric) - Occupancy rate (0-1)

### Features & Status
- `images` (text[]) - Warehouse images
- `amenities` (text[]) - List of amenities
- `features` (text[]) - Warehouse features
- `warehouse_type` (text) - Type of warehouse
- `status` (text) - Status (active, pending)
- `ownership_certificate` (text) - Verification status

### Ratings & Reviews
- `rating` (numeric) - Average rating (1-5)
- `reviews_count` (integer) - Number of reviews

### Owner Information
- `owner_name` (text) - Owner name
- `owner_email` (text) - Owner email
- `owner_phone` (text) - Owner contact
- `owner_id` (uuid) - Foreign key to auth.users

### Storage Layout
- `total_blocks` (integer) - Total storage blocks
- `available_blocks` (integer) - Available blocks
- `grid_rows` (integer) - Grid layout rows
- `grid_cols` (integer) - Grid layout columns

### Timestamps
- `registration_date` (date) - Registration date
- `license_valid_upto` (date) - License expiry
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

## Verification

After import, run these queries to verify:

### 1. Check Total Count
```sql
SELECT COUNT(*) as total_warehouses FROM warehouses;
-- Expected: 10,000
```

### 2. Check by District
```sql
SELECT
  district,
  COUNT(*) as count,
  ROUND(AVG(rating)::numeric, 2) as avg_rating,
  ROUND(AVG(price_per_sqft)::numeric, 2) as avg_price
FROM warehouses
GROUP BY district
ORDER BY count DESC;
```

### 3. Check by Warehouse Type
```sql
SELECT
  warehouse_type,
  COUNT(*) as count,
  ROUND(AVG(price_per_sqft)::numeric, 2) as avg_price
FROM warehouses
GROUP BY warehouse_type
ORDER BY count DESC;
```

### 4. Check Active Warehouses
```sql
SELECT
  status,
  COUNT(*) as count
FROM warehouses
GROUP BY status;
```

## Warehouse Distribution

The 10,000 warehouses are distributed across:

- **Districts**: Mumbai, Pune, Nashik, Aurangabad, Solapur, Kolhapur, Sangli, Satara, Thane, Raigad
- **Types**:
  - Zepto Dark Store
  - Pharma Cold Chain
  - Industrial Logistics Park
  - Automobile Spare Storage
  - Textile Warehouse
  - Food Storage
  - General Storage

## Data Characteristics

- **Capacity Range**: 1,000 - 40,000 MT
- **Size Range**: 10,000 - 200,000 sq ft
- **Pricing Range**: ₹25 - ₹125 per sq ft/month
- **Occupancy Range**: 50% - 90%
- **Rating Range**: 3.0 - 5.0 stars
- **Active Warehouses**: ~90% (9,000+)
- **Verified Warehouses**: ~80% (8,000+)

## Row Level Security (RLS)

The table has RLS enabled with these policies:

1. **Public Access**: Anyone can view active warehouses
2. **Authenticated Access**: Authenticated users can view all warehouses
3. **Owner Management**: Owners can create, update, and delete their warehouses

## Troubleshooting

### Import Fails with "duplicate key value"
- The script uses `ON CONFLICT` to handle duplicates
- Existing warehouses will be updated, not duplicated

### Import Timeout
- Break the SQL file into smaller chunks (e.g., 2,000 warehouses per batch)
- Import each chunk separately

### Memory Issues
- Use the batch import script instead of SQL file
- Reduce batch size in `import-all-warehouses.ts`

## Next Steps

After importing:

1. ✅ Verify import using the queries above
2. ✅ Test warehouse search functionality
3. ✅ Test warehouse details page
4. ✅ Test filtering and sorting
5. ✅ Test ML recommendations

## Support

For issues or questions:
- Check Supabase dashboard logs
- Review SQL error messages
- Verify environment variables in `.env` file
