-- Fix: Assign demo owner to existing warehouses that have no owner_id
-- This is needed so owner notifications work when admin approves bookings

-- Add owner_id column if it doesn't exist
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Assign the demo owner to all warehouses that have no owner
-- Demo owner ID: 550e8400-e29b-41d4-a716-446655440002
UPDATE public.warehouses 
SET owner_id = '550e8400-e29b-41d4-a716-446655440002'::uuid
WHERE owner_id IS NULL;

-- Verify the update
SELECT COUNT(*) as warehouses_with_owner 
FROM public.warehouses 
WHERE owner_id IS NOT NULL;

-- Show a sample
SELECT id, name, city, owner_id 
FROM public.warehouses 
LIMIT 5;
