# Database Setup Instructions - SmartSpace

## ⚠️ IMPORTANT: Your database is currently empty!

You need to run TWO SQL files in the correct order:

---

## Step 1: Create Base Tables First

**File to run:** `database/schema.sql` (already exists in your project)

**What it does:** Creates all the basic tables (profiles, warehouses, bookings, etc.)

**Instructions:**
1. Open Supabase Dashboard → SQL Editor
2. Open the file `database/schema.sql` in your code editor
3. Copy the **ENTIRE contents** (all ~296 lines)
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Wait for "Success" message

---

## Step 2: Add New Features & Data

**File to run:** `database/schema_enhancements.sql`

**What it does:** 
- Adds new columns (seeker_type, product_details, is_active, district)
- Creates new tables (pricing_reference, ml_recommendations, product_market_prices)
- Inserts 60+ Maharashtra cities with pricing
- Inserts 20 products with pricing

**Instructions:**
1. **AFTER Step 1 succeeds**, go back to Supabase SQL Editor
2. Open file `database/schema_enhancements.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Wait for success

---

## Step 3: Add Pricing & Product Data

**File to run:** `database/maharashtra_pricing_data.sql`

**What it does:** Inserts 60+ Maharashtra cities

**File to run:** `database/product_pricing_data.sql`

**What it does:** Inserts 20+ products

---

## ✅ Verification

After running all files, run this query to verify:

```sql
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM warehouses) as warehouses_count,
  (SELECT COUNT(*) FROM pricing_reference) as cities_count,
  (SELECT COUNT(*) FROM product_market_prices) as products_count;
```

Expected result:
- profiles_count: 0 or more (depends if you've created users)
- warehouses_count: 0 or more (your existing warehouses)
- cities_count: 60
- products_count: 20

---

## 🚨 Common Errors

**Error: "relation does not exist"**
→ You skipped Step 1! Run `schema.sql` first

**Error: "column already exists"**
→ Good! It means the column was added. Ignore this error and continue

**Error: "policy already exists"**
→ Good! It means policies were created. Ignore this error and continue

---

## Need Help?

If you get stuck, let me know which step failed and I'll help you fix it!
