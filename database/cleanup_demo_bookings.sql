-- CLEANUP: Remove demo/test booking data from activity_logs
-- Run this in Supabase SQL Editor to clean up fake booking data

-- ================================================
-- STEP 1: View all fake/test bookings
-- ================================================
SELECT id, seeker_id, type, description, created_at, 
       metadata->>'warehouse_name' as warehouse,
       metadata->>'booking_status' as status
FROM activity_logs 
WHERE type = 'booking' 
ORDER BY created_at DESC;

-- ================================================
-- STEP 2: DELETE ALL FAKE TEST DATA
-- These are test seeker IDs that were used for development
-- ================================================
DELETE FROM activity_logs 
WHERE type = 'booking' 
AND seeker_id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'seeker_123',
    'demo-seeker'
);

-- ================================================
-- STEP 3: Verify cleanup - should return empty
-- ================================================
SELECT id, seeker_id, 
       metadata->>'warehouse_name' as warehouse,
       metadata->>'booking_status' as status
FROM activity_logs 
WHERE type = 'booking' 
ORDER BY created_at DESC;

-- ================================================
-- IMPORTANT: Admin Approval Flow
-- ================================================
-- When admin approves a booking, update the metadata like this:

-- UPDATE activity_logs 
-- SET metadata = jsonb_set(
--     metadata, 
--     '{booking_status}', 
--     '"approved"'
-- )
-- WHERE id = 'BOOKING_ID_HERE';

-- When booking is approved, also update warehouse availability
-- This should be done through the admin dashboard or API

-- ================================================
-- Verify booking flow integrity
-- ================================================

-- Check pending bookings needing admin review
SELECT id, seeker_id, 
       metadata->>'warehouse_name' as warehouse,
       metadata->>'start_date' as start_date,
       metadata->>'end_date' as end_date,
       metadata->>'total_amount' as amount,
       metadata->>'booking_status' as status,
       created_at
FROM activity_logs 
WHERE type = 'booking' 
AND metadata->>'booking_status' = 'pending'
ORDER BY created_at DESC;

-- Check approved bookings
SELECT id, seeker_id, 
       metadata->>'warehouse_name' as warehouse,
       metadata->>'booking_status' as status,
       created_at
FROM activity_logs 
WHERE type = 'booking' 
AND metadata->>'booking_status' = 'approved'
ORDER BY created_at DESC;
