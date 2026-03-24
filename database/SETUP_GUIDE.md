# SmartSpace Database Setup Guide

## ⚠️ Important: Run SQL Files in This Order!

### Step 1: Run Main Schema First
**File:** `database/schema.sql`  
**Location:** Already exists in your project  
**What it creates:** Base tables (profiles, warehouses, bookings, inquiries, etc.)

Go to Supabase SQL Editor and run the ENTIRE `database/schema.sql` file first.

### Step 2: Run Enhancement Schema
**File:** `database/schema_enhancements.sql`  
**What it creates:** New tables for pricing, ML tracking, OCR verification, product pricing

Run this AFTER step 1 completes successfully.

### Step 3: Populate Maharashtra Pricing Data
**File:** `database/maharashtra_pricing_data.sql`  
**What it does:** Inserts 80+ Maharashtra cities with pricing data

Run this AFTER step 2 completes successfully.

### Step 4: Populate Product Pricing Data
**File:** `database/product_pricing_data.sql`  
**What it does:** Inserts 50+ products with market prices and storage rates

Run this AFTER step 3 completes successfully.

---

## Quick Start (All-in-One)

If you want to run everything at once, I've created a combined file below:
`database/complete_setup.sql`

This file includes everything in the correct order.

---

## Verification After Setup

Run these queries in Supabase SQL Editor to verify everything worked:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check pricing data loaded
SELECT COUNT(*) as total_cities FROM pricing_reference;

-- Check product data loaded
SELECT COUNT(*) as total_products FROM product_market_prices;

-- Sample pricing data
SELECT city, district, avg_price_per_sqft, demand_score 
FROM pricing_reference 
ORDER BY avg_price_per_sqft DESC 
LIMIT 10;
```

Expected results:
- Total cities: 80+
- Total products: 50+
- Tables: Should see profiles, warehouses, bookings, pricing_reference, ml_recommendations, etc.

