/*
  # Add Admin RLS Policies

  1. Changes
    - Add SELECT policies for admin users on `warehouse_submissions`, `owner_profiles`, `seeker_profiles`, and `activity_logs`
    - Admin is identified as an authenticated user whose `profiles.user_type = 'admin'`
    - These policies allow admin users to read all rows for management purposes

  2. Security
    - All policies are restricted to authenticated users with admin role
    - Admin check uses a subquery on the `profiles` table
    - No changes to existing policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'warehouse_submissions' AND policyname = 'Admins can read all submissions'
  ) THEN
    CREATE POLICY "Admins can read all submissions"
      ON warehouse_submissions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'warehouse_submissions' AND policyname = 'Admins can update all submissions'
  ) THEN
    CREATE POLICY "Admins can update all submissions"
      ON warehouse_submissions
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'owner_profiles' AND policyname = 'Admins can read all owner profiles'
  ) THEN
    CREATE POLICY "Admins can read all owner profiles"
      ON owner_profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'seeker_profiles' AND policyname = 'Admins can read all seeker profiles'
  ) THEN
    CREATE POLICY "Admins can read all seeker profiles"
      ON seeker_profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_logs' AND policyname = 'Admins can read all activity logs'
  ) THEN
    CREATE POLICY "Admins can read all activity logs"
      ON activity_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_logs' AND policyname = 'Admins can update all activity logs'
  ) THEN
    CREATE POLICY "Admins can update all activity logs"
      ON activity_logs
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_logs' AND policyname = 'Admins can insert activity logs'
  ) THEN
    CREATE POLICY "Admins can insert activity logs"
      ON activity_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
        )
      );
  END IF;
END $$;
