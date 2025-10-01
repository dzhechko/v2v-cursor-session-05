-- ============================================================================
-- EMERGENCY FIX: Create Profile Trigger
-- ============================================================================
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor

-- Step 1: Drop existing trigger and function (if they exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_company_id UUID;
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_company_name TEXT;
  extracted_domain TEXT;
BEGIN
  -- Log that trigger is firing
  RAISE NOTICE 'Trigger fired for user: %', NEW.email;

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

  RAISE NOTICE 'Processing: email=%, first_name=%, company=%', user_email, user_first_name, user_company_name;

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

    RAISE NOTICE 'Created company with id: %', default_company_id;
  ELSE
    RAISE NOTICE 'Using existing company with id: %', default_company_id;
  END IF;

  -- Create user profile with demo_user role by default
  RAISE NOTICE 'Creating profile for auth_id: %', NEW.id;

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
  ON CONFLICT (auth_id) DO NOTHING;

  IF FOUND THEN
    RAISE NOTICE 'Successfully created profile for: %', user_email;
  ELSE
    RAISE NOTICE 'Profile already exists or conflict occurred for: %', user_email;
  END IF;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_companies TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_profiles TO postgres, anon, authenticated, service_role;

-- Step 5: Verify installation
SELECT
  '✅ TRIGGER INSTALLED' as status,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

SELECT
  '✅ FUNCTION INSTALLED' as status,
  p.proname as function_name,
  p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user'
  AND n.nspname = 'public';

-- Step 6: Show orphaned users that need profiles
SELECT
  '⚠️ USERS WITHOUT PROFILES' as status,
  u.id as auth_id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN salesai_profiles p ON u.id = p.auth_id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;
