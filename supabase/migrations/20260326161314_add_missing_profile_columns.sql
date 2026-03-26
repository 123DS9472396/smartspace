/*
  # Add Missing Profile Columns

  1. Modified Tables
    - `profiles`
      - `company_name` (text, nullable) - user's company name
      - `city` (text, nullable) - user's city
      - `state` (text, nullable) - user's state
      - `seeker_type` (text, nullable) - seeker category (farmer, wholesaler, etc.)

  2. Notes
    - These columns are referenced by the AuthContext when creating/loading user profiles
    - All columns are nullable with no defaults to avoid breaking existing rows
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'state'
  ) THEN
    ALTER TABLE profiles ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'seeker_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN seeker_type text;
  END IF;
END $$;
