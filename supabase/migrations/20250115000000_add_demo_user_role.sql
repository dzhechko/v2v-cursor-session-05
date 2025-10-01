-- Migration: Add demo_user role and demo tracking fields
-- Created: 2025-01-15
-- Description: Safely adds 'demo_user' to the salesai_user_role enum and adds demo tracking columns

-- Add 'demo_user' to the enum (safe operation, doesn't affect existing data)
ALTER TYPE salesai_user_role ADD VALUE 'demo_user';

-- Add demo tracking columns to profiles table
ALTER TABLE salesai_profiles
  ADD COLUMN demo_sessions_used INTEGER DEFAULT 0,
  ADD COLUMN demo_minutes_used DECIMAL(5,2) DEFAULT 0;

-- Update the default role for new profiles to 'demo_user'
ALTER TABLE salesai_profiles
  ALTER COLUMN role SET DEFAULT 'demo_user';

-- Create index on demo tracking columns for performance
CREATE INDEX IF NOT EXISTS idx_salesai_profiles_demo_usage ON salesai_profiles (role, demo_sessions_used, demo_minutes_used);

-- Add comment for documentation
COMMENT ON COLUMN salesai_profiles.demo_sessions_used IS 'Number of demo sessions used by demo users (max: 1)';
COMMENT ON COLUMN salesai_profiles.demo_minutes_used IS 'Total demo minutes used by demo users (max: 2.0)';

-- Add atomic demo usage update function
CREATE OR REPLACE FUNCTION increment_demo_usage(p_profile_id uuid, p_minutes numeric)
RETURNS void AS $$
BEGIN
  UPDATE salesai_profiles
  SET
    demo_sessions_used = COALESCE(demo_sessions_used, 0) + 1,
    demo_minutes_used = COALESCE(demo_minutes_used, 0) + p_minutes
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add atomic demo session increment function
CREATE OR REPLACE FUNCTION increment_demo_sessions(p_profile_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE salesai_profiles
  SET demo_sessions_used = COALESCE(demo_sessions_used, 0) + 1
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add atomic demo minutes increment function (without sessions)
CREATE OR REPLACE FUNCTION increment_demo_minutes(p_profile_id uuid, p_minutes numeric)
RETURNS void AS $$
BEGIN
  UPDATE salesai_profiles
  SET demo_minutes_used = COALESCE(demo_minutes_used, 0) + p_minutes
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration completed successfully
--
-- ROLLBACK INSTRUCTIONS:
-- To rollback this migration (requires manual intervention):
-- 1. Update all 'demo_user' profiles to 'user' role: UPDATE salesai_profiles SET role = 'user' WHERE role = 'demo_user';
-- 2. Drop columns: ALTER TABLE salesai_profiles DROP COLUMN demo_sessions_used, DROP COLUMN demo_minutes_used;
-- 3. Drop index: DROP INDEX IF EXISTS idx_salesai_profiles_demo_usage;
-- 4. Reset default: ALTER TABLE salesai_profiles ALTER COLUMN role SET DEFAULT 'user';
-- Note: Cannot remove enum value once added - this is a PostgreSQL limitation