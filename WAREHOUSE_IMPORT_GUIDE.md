# 🚀 IMPORT ALL 10,000 WAREHOUSES TO SUPABASE

## 📊 WHAT YOU HAVE

Your project contains **10,000 warehouses** ready to import:
- File: `scripts/direct-import.sql`
- Size: 6.7 MB
- Warehouses: 10,000 (LIC000001 to LIC010000)
- Split into 20 chunks of 500 warehouses each

---

## ⚠️ IMPORTANT: SUPABASE LIMITS

Supabase SQL Editor has limits:
- **Query timeout:** ~60 seconds
- **Max query size:** ~2 MB per query
- **Total file size:** 6.7 MB is TOO LARGE for one query

**Solution:** Import in smaller batches using Supabase's API or split the file.

---

## 🎯 METHOD 1: IMPORT VIA SUPABASE DASHBOARD (RECOMMENDED)

### **OPTION A: Use Table Import Feature**

1. **Prepare Data as CSV** (I'll create this for you)
2. **Go to Supabase Table Editor:**
   - https://supabase.com/dashboard/project/bsrzqffxgvdebyofmhzg/editor
3. **Click on `warehouses` table**
4. **Click "Import Data via spreadsheet"**
5. **Upload CSV file**
6. **Map columns and import**

Unfortunately, Supabase doesn't support direct CSV import for existing tables easily.

---

## 🎯 METHOD 2: SPLIT SQL FILE & RUN IN BATCHES

Since the file is split into 20 chunks, you can run them one at a time.

### **Step-by-Step:**

#### **1. First, Create the Table (Run Once)**

Go to: https://supabase.com/dashboard/project/bsrzqffxgvdebyofmhzg/sql

Copy and paste this to create the table:

```sql
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wh_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  state text NOT NULL DEFAULT 'Maharashtra',
  pincode text,
  latitude numeric,
  longitude numeric,
  total_area integer NOT NULL,
  capacity integer NOT NULL,
  price_per_sqft numeric NOT NULL,
  micro_rental_spaces integer DEFAULT 0,
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  status text DEFAULT 'active',
  occupancy numeric DEFAULT 0.5,
  rating numeric DEFAULT 4.0,
  reviews_count integer DEFAULT 0,
  warehouse_type text,
  ownership_certificate text,
  owner_name text,
  owner_email text,
  owner_phone text,
  registration_date date,
  license_valid_upto date,
  total_blocks integer DEFAULT 100,
  available_blocks integer DEFAULT 50,
  grid_rows integer DEFAULT 10,
  grid_cols integer DEFAULT 10,
  owner_id uuid,
  contact_person text,
  contact_phone text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses(district);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_price ON warehouses(price_per_sqft);
CREATE INDEX IF NOT EXISTS idx_warehouses_rating ON warehouses(rating DESC);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active warehouses" ON warehouses;

CREATE POLICY "Anyone can view active warehouses"
ON warehouses FOR SELECT
USING (status = 'active' OR status = 'Active');
```

Click **"Run"** and wait for completion.

---

#### **2. Import in Smaller Batches**

The `direct-import.sql` file is organized into 20 chunks of 500 warehouses each.

**Problem:** Even 500 warehouses at once might be too large. Let's try a smaller approach.

I'll create split files for you:

---

## 🎯 METHOD 3: USE SUPABASE API (FASTEST & MOST RELIABLE)

Let me create a Node.js script that will import all 10,000 warehouses using the Supabase JavaScript client in batches of 100.

**Advantages:**
- ✅ Handles large datasets
- ✅ Automatic retry on errors
- ✅ Progress tracking
- ✅ Much faster than manual SQL
- ✅ No timeout issues

---

## 📋 STEP-BY-STEP IMPORT (EASIEST METHOD)

### **Step 1: Create Table First**

Run this in Supabase SQL Editor (copy from `scripts/SIMPLE_SETUP.sql` but skip the INSERT part):

```sql
-- Just the table creation and policies
CREATE TABLE IF NOT EXISTS warehouses (...);
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active warehouses" ON warehouses FOR SELECT USING (status = 'active');
```

### **Step 2: Use the Import Script I'm Creating**

I'll create a script that reads `direct-import.sql` and imports it via Supabase API in small batches.

---

## 🚀 RECOMMENDED APPROACH

Given the size (10,000 warehouses), here's what I recommend:

### **OPTION A: Import First 100 Warehouses (Quick Test)**

1. Extract first 100 warehouses from `direct-import.sql`
2. Run in Supabase SQL Editor
3. Verify data loads correctly
4. Then import the rest

### **OPTION B: Import All 10,000 via Script**

I'll create a Node.js script that:
1. Parses the SQL file
2. Extracts warehouse data
3. Imports via Supabase API in batches of 100
4. Shows progress
5. Takes ~5-10 minutes total

---

## ⚡ QUICK START: IMPORT FIRST 1,000 WAREHOUSES

Let me create a file with just the first 1,000 warehouses that you can easily paste:

**File:** `scripts/warehouse-import-1000.sql`

This will be small enough (~670 KB) to paste in Supabase SQL Editor.

---

## 🤔 WHICH METHOD SHOULD YOU USE?

### **If you want ALL 10,000 warehouses:**
- ✅ Use METHOD 3 (API script) - I'll create this for you
- Takes 5-10 minutes, fully automated

### **If you want to test first:**
- ✅ Import 100 or 1,000 first using SQL Editor
- Then decide if you want all 10,000

### **If you're okay with manual work:**
- ✅ Split the file into 20 parts
- Run each part manually (20 times)
- Takes ~30-60 minutes

---

## 🎯 MY RECOMMENDATION

**Let me create an automated import script for you!**

It will:
1. Read `scripts/direct-import.sql`
2. Parse all 10,000 warehouses
3. Import to Supabase in batches of 100
4. Show progress (Imported 100/10000... 200/10000...)
5. Complete in ~5-10 minutes
6. Handle errors automatically

**Would you like me to:**
- A) Create the automated import script ⭐ RECOMMENDED
- B) Create a file with first 1,000 warehouses for quick SQL import
- C) Split the file into 10 smaller SQL files you can run manually

---

## 📊 FILE SIZE BREAKDOWN

```
scripts/direct-import.sql          6.7 MB (10,000 warehouses)
scripts/insert-warehouses.sql      6.8 MB (10,000 warehouses)

Each warehouse entry:              ~670 bytes
500 warehouses:                    ~335 KB  ✅ Might work
1,000 warehouses:                  ~670 KB  ✅ Should work
2,000 warehouses:                  ~1.3 MB  ⚠️ Risky
5,000 warehouses:                  ~3.3 MB  ❌ Too large
10,000 warehouses:                 ~6.7 MB  ❌ Too large
```

---

## ✅ NEXT STEPS

**Tell me which approach you prefer:**

1. **"Create automated script"** - I'll make a Node.js script that imports all 10,000 automatically
2. **"Give me 1,000 warehouses SQL file"** - I'll extract first 1,000 into a smaller file you can paste
3. **"Split into 10 files"** - I'll split into 10 files of 1,000 each for manual import
4. **"Just give me 100 for testing"** - I'll create a tiny test file with 100 warehouses

**What would you like me to do?** 🚀
