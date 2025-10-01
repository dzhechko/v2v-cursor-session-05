-- ============================================================================
-- DIAGNOSTIC SCRIPT FOR PROFILE TRIGGER
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor to diagnose the issue

-- 1. Check if trigger exists
SELECT
  '=== TRIGGER CHECK ===' as check_type,
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if function exists
SELECT
  '=== FUNCTION CHECK ===' as check_type,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as is_security_definer,
  n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- 3. Check recent users in auth.users
SELECT
  '=== RECENT AUTH USERS ===' as check_type,
  id as auth_id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- 4. Check recent profiles in salesai_profiles
SELECT
  '=== RECENT PROFILES ===' as check_type,
  id,
  auth_id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM salesai_profiles
ORDER BY created_at DESC
LIMIT 3;

-- 5. Check for orphaned users (users without profiles)
SELECT
  '=== ORPHANED USERS ===' as check_type,
  u.id as auth_id,
  u.email,
  u.created_at as user_created_at
FROM auth.users u
LEFT JOIN salesai_profiles p ON u.id = p.auth_id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 5;

-- 6. Check salesai_companies table exists and is accessible
SELECT
  '=== COMPANIES TABLE CHECK ===' as check_type,
  COUNT(*) as total_companies
FROM salesai_companies;

-- 7. Check grants on tables
SELECT
  '=== TABLE GRANTS ===' as check_type,
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('salesai_profiles', 'salesai_companies')
  AND grantee IN ('postgres', 'anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee;
