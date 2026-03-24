-- Booking Reservation Consistency Migration
-- Purpose:
-- 1) Speed up booking conflict checks
-- 2) Keep booking metadata fields consistent
-- 3) Make owner visibility reliable for all bookings

BEGIN;

-- Helpful indexes for booking queries on activity_logs metadata
CREATE INDEX IF NOT EXISTS idx_activity_logs_booking_wh_id
ON public.activity_logs ((metadata->>'warehouse_id'))
WHERE type = 'booking';

CREATE INDEX IF NOT EXISTS idx_activity_logs_booking_status
ON public.activity_logs ((metadata->>'booking_status'))
WHERE type = 'booking';

CREATE INDEX IF NOT EXISTS idx_activity_logs_booking_owner
ON public.activity_logs ((metadata->>'warehouse_owner_id'))
WHERE type = 'booking';

CREATE INDEX IF NOT EXISTS idx_activity_logs_booking_dates
ON public.activity_logs ((metadata->>'start_date'), (metadata->>'end_date'))
WHERE type = 'booking';

-- Backfill owner_id into booking metadata from warehouse records where missing
UPDATE public.activity_logs al
SET metadata = jsonb_set(
  al.metadata,
  '{warehouse_owner_id}',
  to_jsonb(w.owner_id::text),
  true
)
FROM public.warehouses w
WHERE al.type = 'booking'
  AND (al.metadata->>'warehouse_owner_id' IS NULL OR al.metadata->>'warehouse_owner_id' = '')
  AND (
    w.wh_id = al.metadata->>'warehouse_id'
    OR w.id::text = al.metadata->>'warehouse_id'
  )
  AND w.owner_id IS NOT NULL;

-- Ensure pending is default if booking_status is absent
UPDATE public.activity_logs
SET metadata = jsonb_set(metadata, '{booking_status}', '"pending"', true)
WHERE type = 'booking'
  AND (metadata->>'booking_status' IS NULL OR metadata->>'booking_status' = '');

COMMIT;

-- Verification checks
SELECT
  COUNT(*) AS total_bookings,
  COUNT(*) FILTER (WHERE metadata->>'booking_status' = 'pending') AS pending_bookings,
  COUNT(*) FILTER (WHERE metadata->>'booking_status' = 'approved') AS approved_bookings,
  COUNT(*) FILTER (WHERE metadata->>'warehouse_owner_id' IS NOT NULL AND metadata->>'warehouse_owner_id' <> '') AS bookings_with_owner
FROM public.activity_logs
WHERE type = 'booking';
