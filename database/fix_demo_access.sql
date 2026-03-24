-- ============================================================
-- FIX FOR DEMO USERS - Disable RLS for testing
-- Run this in Supabase SQL Editor
-- ============================================================

-- DISABLE RLS temporarily for demo mode testing
ALTER TABLE seeker_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions DISABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and updates
-- This is for demo purposes only - enable RLS in production!

-- Grant permissions (this enables the service role to bypass RLS)
GRANT ALL ON seeker_profiles TO anon;
GRANT ALL ON seeker_profiles TO authenticated;
GRANT ALL ON owner_profiles TO anon;
GRANT ALL ON owner_profiles TO authenticated;
GRANT ALL ON verification_queue TO anon;
GRANT ALL ON verification_queue TO authenticated;
GRANT ALL ON user_interactions TO anon;
GRANT ALL ON user_interactions TO authenticated;

-- ============================================================
-- DONE! RLS disabled for demo testing
-- Remember to enable RLS for production!
-- ============================================================
