-- ============================================================================
-- IMMEDIATE TRIGGER FIX FOR PROFILE AUTO-CREATION
-- ============================================================================
-- This script diagnoses and fixes the profile auto-creation trigger
-- Run this in Supabase SQL Editor to restore automatic profile creation

-- STEP 1: Check if trigger exists
SELECT
  'CURRENT TRIGGER STATUS' AS check_type,
  COALESCE(
    (SELECT trigger_name FROM information_schema.triggers
     WHERE trigger_name = 'on_auth_user_created'),
    'TRIGGER NOT FOUND!'
  ) AS status;

-- STEP 2: Check if function exists
SELECT
  'FUNCTION STATUS' AS check_type,
  COALESCE(
    (SELECT proname FROM pg_proc WHERE proname = 'handle_new_user'),
    'FUNCTION NOT FOUND!'
  ) AS status;

-- STEP 3: Drop existing trigger and function (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- STEP 4: Recreate the function with improved error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_company_id UUID;
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_company_name TEXT;
  extracted_domain TEXT;
BEGIN
  -- CRITICAL: Log that trigger was called
  RAISE NOTICE 'Trigger fired for user: %', NEW.id;

  -- Extract user data from auth metadata
  user_email := NEW.email;
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1)
  );
  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    ''
  );
  user_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'company_name',
    'Personal Account'
  );

  -- Extract domain from email
  extracted_domain := split_part(user_email, '@', 2);

  -- Try to find existing company by name
  SELECT id INTO default_company_id
  FROM public.salesai_companies
  WHERE name = user_company_name
  LIMIT 1;

  -- If company doesn't exist, create it
  IF default_company_id IS NULL THEN
    RAISE NOTICE 'Creating new company: %', user_company_name;
    INSERT INTO public.salesai_companies (name, domain, settings)
    VALUES (
      user_company_name,
      extracted_domain,
      '{}'::jsonb
    )
    RETURNING id INTO default_company_id;
    RAISE NOTICE 'Company created with ID: %', default_company_id;
  END IF;

  -- Create user profile with demo_user role by default
  RAISE NOTICE 'Creating profile for user: % with company: %', NEW.id, default_company_id;
  INSERT INTO public.salesai_profiles (
    auth_id,
    company_id,
    email,
    first_name,
    last_name,
    position,
    phone,
    team_size,
    role,
    demo_sessions_used,
    demo_minutes_used,
    settings
  )
  VALUES (
    NEW.id,
    default_company_id,
    LOWER(TRIM(user_email)),
    TRIM(user_first_name),
    TRIM(user_last_name),
    COALESCE(NEW.raw_user_meta_data->>'position', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    CASE
      WHEN NEW.raw_user_meta_data->>'team_size' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'team_size')::INTEGER
      ELSE NULL
    END,
    'demo_user', -- Always create as demo_user by default
    0, -- demo_sessions_used
    0, -- demo_minutes_used
    jsonb_build_object(
      'notifications', true,
      'email_summaries', true,
      'onboarding_completed', false
    )
  )
  ON CONFLICT (auth_id) DO NOTHING; -- Prevent duplicate profile creation

  RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- CRITICAL: Log error details
    RAISE WARNING 'Failed to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW; -- Don't block user creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_companies TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_profiles TO postgres, anon, authenticated, service_role;

-- STEP 7: Verify the fix
SELECT
  'VERIFICATION' AS step,
  'Trigger created: ' || trigger_name AS result
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- STEP 8: Create profiles for existing users who don't have them
INSERT INTO public.salesai_profiles (
  auth_id,
  company_id,
  email,
  first_name,
  last_name,
  role,
  demo_sessions_used,
  demo_minutes_used,
  settings
)
SELECT
  au.id,
  (SELECT id FROM public.salesai_companies LIMIT 1), -- Use first company or create default
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  'demo_user',
  0,
  0,
  jsonb_build_object(
    'notifications', true,
    'email_summaries', true,
    'onboarding_completed', false
  )
FROM auth.users au
LEFT JOIN public.salesai_profiles sp ON au.id = sp.auth_id
WHERE sp.id IS NULL
ON CONFLICT (auth_id) DO NOTHING;

-- STEP 9: Show final status
SELECT
  'FINAL STATUS' AS step,
  COUNT(*) AS users_in_auth,
  (SELECT COUNT(*) FROM public.salesai_profiles) AS users_in_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM public.salesai_profiles) AS missing_profiles
FROM auth.users;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Copy this entire SQL script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run this script
-- 4. Check the output to verify trigger was created
-- 5. Test by creating a new user through the registration form
-- 6. Verify the user appears in salesai_profiles table
-- ============================================================================
