-- ════════════════════════════════════════════════════════════════════════════
-- SmartSpace: Dynamic Occupancy Trigger
-- Run this in Supabase SQL Editor AFTER ml_feedback_and_occupancy_fix.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Function to recalculate warehouse occupancy dynamically based on activity_logs
CREATE OR REPLACE FUNCTION update_warehouse_occupancy()
RETURNS TRIGGER AS $$
DECLARE
  wh_id UUID;
  total_area_val NUMERIC;
  booked_area_val NUMERIC;
BEGIN
  -- Determine which warehouse needs updating and ensure it's a booking event
  IF TG_OP = 'DELETE' THEN
    IF OLD.type != 'booking' THEN RETURN NULL; END IF;
    wh_id := (OLD.metadata->>'warehouse_id')::UUID;
  ELSE
    IF NEW.type != 'booking' THEN RETURN NULL; END IF;
    wh_id := (NEW.metadata->>'warehouse_id')::UUID;
  END IF;

  IF wh_id IS NOT NULL THEN
    -- Get total area of the warehouse
    SELECT total_area INTO total_area_val FROM warehouses WHERE id = wh_id;
    
    IF total_area_val > 0 THEN
      -- Calculate sum of area_sqft for all currently active approved bookings
      SELECT COALESCE(SUM((metadata->>'area_sqft')::NUMERIC), 0)
      INTO booked_area_val
      FROM activity_logs
      WHERE type = 'booking' 
        AND metadata->>'booking_status' = 'approved'
        AND metadata->>'warehouse_id' = wh_id::text
        AND (metadata->>'start_date')::DATE <= CURRENT_DATE
        AND (metadata->>'end_date')::DATE >= CURRENT_DATE;
        
      -- Update warehouse occupancy (bounded between 0.0 and 1.0)
      UPDATE warehouses 
      SET occupancy = LEAST(1.0, GREATEST(0.0, booked_area_val / total_area_val))
      WHERE id = wh_id;
    END IF;
  END IF;

  RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_update_occupancy ON activity_logs;

-- Create the trigger on the activity_logs table
CREATE TRIGGER trigger_update_occupancy
AFTER INSERT OR UPDATE OR DELETE ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_occupancy();
