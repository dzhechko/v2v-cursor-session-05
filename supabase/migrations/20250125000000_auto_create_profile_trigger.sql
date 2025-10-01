-- ============================================================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================================================
-- This migration adds a database trigger that automatically creates a profile
-- in salesai_profiles when a new user is created in auth.users
-- This ensures EVERY registered user gets a profile, even if the API callback fails

-- Function to handle new user creation
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
    INSERT INTO public.salesai_companies (name, domain, settings)
    VALUES (
      user_company_name,
      extracted_domain,
      '{}'::jsonb
    )
    RETURNING id INTO default_company_id;
  END IF;

  -- Create user profile with demo_user role by default
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

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_companies TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_profiles TO postgres, anon, authenticated, service_role;

-- Verify trigger is created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
