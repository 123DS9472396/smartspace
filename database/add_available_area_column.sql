-- Add available_area column to warehouses table if it does not exist
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS available_area integer;

-- Optionally, initialize available_area to total_area for all existing warehouses
UPDATE warehouses SET available_area = total_area WHERE available_area IS NULL;
