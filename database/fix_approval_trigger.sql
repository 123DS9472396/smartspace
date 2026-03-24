-- ═══════════════════════════════════════════════════════════════
-- FIX: Approval trigger type mismatch
-- The old trigger inserts document_urls (JSONB) into documents (TEXT[]),
-- causing: column "documents" is of type text[] but expression is of type jsonb
--
-- This script fixes the trigger function to properly cast JSONB → TEXT[].
-- Run once in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.move_submission_to_warehouses()
RETURNS TRIGGER AS $$
DECLARE
  warehouse_uuid UUID;
  warehouse_wh_id TEXT;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

    warehouse_uuid := uuid_generate_v4();
    warehouse_wh_id := 'WH-' || UPPER(SUBSTRING(warehouse_uuid::TEXT, 1, 8));

    INSERT INTO public.warehouses (
      id,
      wh_id,
      name,
      description,
      address,
      city,
      district,
      state,
      pincode,
      total_area,
      capacity,
      price_per_sqft,
      warehouse_type,
      images,
      amenities,
      features,
      documents,
      status,
      owner_id,
      submission_id,
      approved_at,
      created_at,
      updated_at
    ) VALUES (
      warehouse_uuid,
      warehouse_wh_id,
      NEW.name,
      NEW.description,
      NEW.address,
      NEW.city,
      NEW.city,
      COALESCE(NEW.state, 'Maharashtra'),
      NEW.pincode,
      NEW.total_area,
      NEW.total_area,
      NEW.price_per_sqft,
      'General Warehouse',
      -- Properly cast JSONB arrays to TEXT[] --
      CASE
        WHEN NEW.image_urls IS NOT NULL AND jsonb_typeof(NEW.image_urls) = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.image_urls))
        ELSE '{}'::text[]
      END,
      CASE
        WHEN NEW.amenities IS NOT NULL AND jsonb_typeof(NEW.amenities) = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.amenities))
        ELSE '{}'::text[]
      END,
      CASE
        WHEN NEW.features IS NOT NULL AND jsonb_typeof(NEW.features) = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.features))
        ELSE '{}'::text[]
      END,
      CASE
        WHEN NEW.document_urls IS NOT NULL AND jsonb_typeof(NEW.document_urls) = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.document_urls))
        WHEN NEW.document_urls IS NOT NULL AND jsonb_typeof(NEW.document_urls) = 'object'
        THEN ARRAY(SELECT value FROM jsonb_each_text(NEW.document_urls))
        ELSE '{}'::text[]
      END,
      'active',
      NEW.owner_id,
      NEW.id,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created warehouse % from approved submission %', warehouse_uuid, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS move_approved_submission_to_warehouses ON public.warehouse_submissions;
CREATE TRIGGER move_approved_submission_to_warehouses
    AFTER UPDATE ON public.warehouse_submissions
    FOR EACH ROW EXECUTE FUNCTION public.move_submission_to_warehouses();

SELECT '✅ Approval trigger fixed — JSONB → TEXT[] conversion now handled properly' AS status;
