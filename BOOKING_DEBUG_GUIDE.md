# 🔍 Booking System Debug Guide

This guide helps you verify that bookings are being created and stored correctly in the system.

## Quick Start

### 1. **Run the Comprehensive Test** (Recommended)

This test creates sample bookings and verifies they appear in the admin view:

```bash
cd warehouse_2026
node debug-test-comprehensive.mjs
```

This will:
- ✅ Create 15 test bookings across active warehouses
- ✅ Check all bookings stored in the database
- ✅ Verify that admin view sees them correctly
- ✅ Show booking details by warehouse

### 2. **Check All Bookings in Database**

To see ALL bookings (regardless of warehouse):

```bash
curl http://localhost:5000/api/debug/all-bookings
```

**Response includes:**
- Total booking count
- Total amount
- Bookings grouped by warehouse
- Summary by warehouse

### 3. **Check Admin View**

To see how the admin panel sees bookings:

```bash
curl http://localhost:5000/api/admin/warehouses
```

**Look for:**
- `summary.total_bookings` - Total across all warehouses
- `warehouses[].bookings` - Bookings for each warehouse
- `warehouses[].pending_bookings` - Count of pending bookings

### 4. **Check Booking Stats**

```bash
curl http://localhost:5000/api/admin/booking-stats
```

**Shows:**
- Pending bookings
- Approved bookings
- Total revenue

## Understanding the System

### How Bookings Are Created

1. **User submits booking** on `/warehouse/:id` page
2. **Request sent to** `/api/bookings/blocks` with:
   - `seeker_id` - User ID
   - `warehouse_id` - Warehouse UUID or wh_id
   - `start_date`, `end_date`
   - `area_sqft`, `goods_type`
   - `customer_details` (name, email, phone)

3. **Server creates** an entry in `activity_logs` table with:
   - `type: 'booking'`
   - `seeker_id`
   - `metadata` containing booking details
   - `metadata.booking_status: 'pending'` (for admin review)

4. **Response** includes booking ID and confirmation

### Debug Endpoints (Development Only)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/debug/all-bookings` | GET | See ALL bookings in database |
| `/api/debug/create-test-bookings` | POST | Create 15 sample bookings |
| `/api/admin/warehouses` | GET | Admin view with bookings |
| `/api/admin/booking-stats` | GET | Stats across all bookings |

## Troubleshooting

### Problem: Bookings Created But Not Showing

**Check:**
1. Endpoint returns success response
2. Booking ID is returned
3. Database actually has the records

**Solution:**
```bash
# See raw database records
node debug-test-comprehensive.mjs

# This will show:
# 1. Step 1: How many test bookings were created
# 2. Step 2: How many are actually in the database
# 3. Step 3: How many admin view sees
# 4. Step 4: Comparison to find discrepancy
```

### Problem: Admin View Not Updated

**Common Causes:**
1. **Page not refreshed** - Admin needs to refresh to see new bookings
2. **RLS Policy issues** - Check if anon key is being used (may need service role)
3. **Warehouse ID mismatch** - Client sends UUID but database has wh_id (LIC format)

**Check Warehouse IDs:**
```bash
# See how warehouses are indexed
curl http://localhost:5000/api/admin/warehouses | jq '.warehouses[0] | {id, wh_id, name}'
```

### Problem: Test Bookings Were Created But Disappeared

**Likely Causes:**
1. Page was hard-refreshed while creating (race condition)
2. Browser cache issue
3. Supabase RLS policies blocking read

**Solution:**
- Try creating bookings individually
- Verify in database directly: `SELECT * FROM activity_logs WHERE type = 'booking'`

## Manual Booking Creation

To **manually test a single booking** without the UI:

```bash
curl -X POST http://localhost:5000/api/bookings/blocks \
  -H "Content-Type: application/json" \
  -d '{
    "seeker_id": "your-user-id",
    "warehouse_id": "warehouse-id-from-admin-view",
    "blocks": [{"id": "block-1", "area": 1000}],
    "start_date": "2026-01-15",
    "end_date": "2026-02-15",
    "total_amount": 50000,
    "payment_method": "online",
    "goods_type": "Electronics",
    "customer_details": {
      "name": "Test Seeker",
      "email": "seeker@test.com",
      "phone": "9800000000"
    }
  }'
```

## Database Schema

### activity_logs table

```sql
-- New bookings are stored here
CREATE TABLE activity_logs (
  id                UUID PRIMARY KEY,
  seeker_id         UUID NOT NULL,
  type              TEXT NOT NULL, -- 'booking', 'inquiry', etc.
  description       TEXT,
  metadata          JSONB,         -- Contains all booking details
  created_at        TIMESTAMP
);

-- metadata structure for bookings:
{
  "warehouse_id": "uuid-or-lic-id",
  "warehouse_name": "Warehouse Name",
  "warehouse_city": "City",
  "warehouse_state": "State",
  "blocks_booked": [...],
  "area_sqft": 1000,
  "start_date": "2026-01-15",
  "end_date": "2026-02-15",
  "total_amount": 50000,
  "payment_method": "online",
  "goods_type": "Electronics",
  "booking_status": "pending|approved|rejected",
  "customer_details": {
    "name": "Seeker Name",
    "email": "seeker@test.com",
    "phone": "9800000000"
  }
}
```

## What to Check If Bookings Still Don't Show

### 1. Verify Bookings Exist
```bash
# Run the test - will show if bookings are created and stored
node debug-test-comprehensive.mjs
```

### 2. Check Admin Page Logic
- Does it call `/api/admin/warehouses`?
- Does it include `bookings` array?
- Is the UI actually rendering the bookings?

### 3. Verify Warehouse IDs Match
```bash
# When creating: client sends warehouse.id (UUID)
# When fetching: admin looks for bookings by warehouse.id AND warehouse.wh_id

# Check if warehouses have both fields:
curl http://localhost:5000/api/admin/warehouses | jq '.warehouses[0] | {id, wh_id, total_bookings}'
```

### 4. Check Permission Issues
- Is the server using anon key or service role key?
- Run: `node debug-test-comprehensive.mjs` to see if permissions are blocking data

## Next Steps

1. **Run the debug test:**
   ```bash
   node debug-test-comprehensive.mjs
   ```

2. **Share the output** - It will show:
   - How many bookings were created
   - How many the database has
   - How many the admin view sees
   - Any discrepancies

3. **Common next actions:**
   - If all match → Bookings system is working! Check UI rendering
   - If all-bookings > admin-bookings → RLS/permission issue
   - If create-bookings failed → Booking submission endpoint issue

## Additional Resources

- **Booking Submission:** `/client/pages/WarehouseDetail.tsx` (search for `handleBooking`)
- **Booking Creation:** `/server/routes/simple-booking.ts` (search for `bookWarehouseBlocks`)
- **Admin View:** `/client/pages/AdminWarehousesPage.tsx`
- **Admin Backend:** `/server/routes/admin-warehouses.ts`
