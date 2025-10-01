-- Enable Row Level Security on all tables
ALTER TABLE salesai_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesai_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
-- Companies table
DROP POLICY IF EXISTS "Super Admins can see all companies" ON salesai_companies;
DROP POLICY IF EXISTS "Admins can see their own company" ON salesai_companies;
DROP POLICY IF EXISTS "Super Admins can insert companies" ON salesai_companies;
DROP POLICY IF EXISTS "Super Admins can update companies" ON salesai_companies;
DROP POLICY IF EXISTS "Super Admins can delete companies" ON salesai_companies;

-- Profiles table
DROP POLICY IF EXISTS "Users can see own profile" ON salesai_profiles;
DROP POLICY IF EXISTS "Admins can see profiles in their company" ON salesai_profiles;
DROP POLICY IF EXISTS "Super Admins can see all profiles" ON salesai_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON salesai_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON salesai_profiles;
DROP POLICY IF EXISTS "Demo users can access own data" ON salesai_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their company" ON salesai_profiles;
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON salesai_profiles;

-- API Keys table
DROP POLICY IF EXISTS "Users can see own API keys" ON salesai_api_keys;
DROP POLICY IF EXISTS "Users can manage own API keys" ON salesai_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON salesai_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON salesai_api_keys;

-- Sessions table
DROP POLICY IF EXISTS "Users can see own sessions" ON salesai_sessions;
DROP POLICY IF EXISTS "Admins can see sessions in their company" ON salesai_sessions;
DROP POLICY IF EXISTS "Super Admins can see all sessions" ON salesai_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON salesai_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON salesai_sessions;

-- Transcripts table
DROP POLICY IF EXISTS "Users can see own transcripts" ON salesai_transcripts;
DROP POLICY IF EXISTS "Admins can see transcripts in their company" ON salesai_transcripts;
DROP POLICY IF EXISTS "Super Admins can see all transcripts" ON salesai_transcripts;

-- Analysis results table
DROP POLICY IF EXISTS "Users can see own analysis results" ON salesai_analysis_results;
DROP POLICY IF EXISTS "Admins can see analysis results in their company" ON salesai_analysis_results;
DROP POLICY IF EXISTS "Super Admins can see all analysis results" ON salesai_analysis_results;

-- Session analytics table
DROP POLICY IF EXISTS "Users can see own analytics" ON salesai_session_analytics;
DROP POLICY IF EXISTS "Admins can see analytics in their company" ON salesai_session_analytics;
DROP POLICY IF EXISTS "Super Admins can see all analytics" ON salesai_session_analytics;

-- Subscriptions table
DROP POLICY IF EXISTS "Users can see own subscriptions" ON salesai_subscriptions;
DROP POLICY IF EXISTS "Admins can see subscriptions in their company" ON salesai_subscriptions;
DROP POLICY IF EXISTS "Super Admins can see all subscriptions" ON salesai_subscriptions;
DROP POLICY IF EXISTS "Super Admins can manage subscriptions" ON salesai_subscriptions;

-- Usage table
DROP POLICY IF EXISTS "Users can see own usage" ON salesai_usage;
DROP POLICY IF EXISTS "Admins can see usage in their company" ON salesai_usage;
DROP POLICY IF EXISTS "Super Admins can see all usage" ON salesai_usage;

-- Feedback table
DROP POLICY IF EXISTS "Users can manage own feedback" ON salesai_feedback;
DROP POLICY IF EXISTS "Admins can see feedback in their company" ON salesai_feedback;
DROP POLICY IF EXISTS "Super Admins can see all feedback" ON salesai_feedback;

-- Audit logs table
DROP POLICY IF EXISTS "Super Admins can see all audit logs" ON salesai_audit_logs;
DROP POLICY IF EXISTS "Admins can see audit logs for their company" ON salesai_audit_logs;

-- Companies table policies
CREATE POLICY "Super Admins can see all companies"
  ON salesai_companies FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

CREATE POLICY "Admins can see their own company"
  ON salesai_companies FOR SELECT
  USING (id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Super Admins can insert companies"
  ON salesai_companies FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

CREATE POLICY "Super Admins can update companies"
  ON salesai_companies FOR UPDATE
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

CREATE POLICY "Super Admins can delete companies"
  ON salesai_companies FOR DELETE
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- Profiles table policies
CREATE POLICY "Users can see own profile" 
  ON salesai_profiles FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins can see profiles in their company"
  ON salesai_profiles FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Super Admins can see all profiles"
  ON salesai_profiles FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

CREATE POLICY "Users can update own profile"
  ON salesai_profiles FOR UPDATE
  USING (auth.uid() = auth_id);

-- Add policies for profile creation (for demo users and API)
-- This policy enables demo user self-registration during the auth callback flow
-- It allows users to create their own profiles when authenticated with a valid JWT
-- This supports both cookie-based authentication (direct API calls) and bearer token
-- authentication (internal calls from the auth callback route)
CREATE POLICY "Users can insert own profile"
  ON salesai_profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- Add specific policy for demo users to access basic features
CREATE POLICY "Demo users can access own data"
  ON salesai_profiles FOR SELECT
  USING (auth.uid() = auth_id AND role = 'demo_user');

CREATE POLICY "Admins can update profiles in their company"
  ON salesai_profiles FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Super Admins can update all profiles"
  ON salesai_profiles FOR UPDATE
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- API Keys table policies
CREATE POLICY "Users can see own API keys" 
  ON salesai_api_keys FOR SELECT
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can manage own API keys" 
  ON salesai_api_keys FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own API keys" 
  ON salesai_api_keys FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete own API keys" 
  ON salesai_api_keys FOR DELETE
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

-- Sessions table policies
CREATE POLICY "Users can see own sessions" 
  ON salesai_sessions FOR SELECT
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Admins can see sessions in their company"
  ON salesai_sessions FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Super Admins can see all sessions"
  ON salesai_sessions FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

CREATE POLICY "Users can create sessions" 
  ON salesai_sessions FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own sessions" 
  ON salesai_sessions FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

-- Transcripts table policies
CREATE POLICY "Users can see own transcripts" 
  ON salesai_transcripts FOR SELECT
  USING (session_id IN (
    SELECT id FROM salesai_sessions WHERE profile_id IN (
      SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
    )
  ));

CREATE POLICY "Admins can see transcripts in their company"
  ON salesai_transcripts FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM salesai_sessions WHERE company_id IN (
        SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Super Admins can see all transcripts"
  ON salesai_transcripts FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- Analysis results table policies
CREATE POLICY "Users can see own analysis results" 
  ON salesai_analysis_results FOR SELECT
  USING (session_id IN (
    SELECT id FROM salesai_sessions WHERE profile_id IN (
      SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
    )
  ));

CREATE POLICY "Admins can see analysis results in their company"
  ON salesai_analysis_results FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM salesai_sessions WHERE company_id IN (
        SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Super Admins can see all analysis results"
  ON salesai_analysis_results FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- Session analytics table policies
CREATE POLICY "Users can see own analytics" 
  ON salesai_session_analytics FOR SELECT
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Admins can see analytics in their company"
  ON salesai_session_analytics FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Super Admins can see all analytics"
  ON salesai_session_analytics FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- Subscriptions table policies
CREATE POLICY "Users can see own subscriptions" 
  ON salesai_subscriptions FOR SELECT
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Admins can see subscriptions in their company"
  ON salesai_subscriptions FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Super Admins can see all subscriptions"
  ON salesai_subscriptions FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

CREATE POLICY "Super Admins can manage subscriptions"
  ON salesai_subscriptions FOR ALL
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- Usage table policies
CREATE POLICY "Users can see own usage" 
  ON salesai_usage FOR SELECT
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Admins can see usage in their company"
  ON salesai_usage FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Super Admins can see all usage"
  ON salesai_usage FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- Feedback table policies
CREATE POLICY "Users can manage own feedback" 
  ON salesai_feedback FOR ALL
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Admins can see feedback in their company"
  ON salesai_feedback FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM salesai_profiles WHERE company_id IN (
        SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Super Admins can see all feedback"
  ON salesai_feedback FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

-- Audit logs table policies
CREATE POLICY "Super Admins can see all audit logs"
  ON salesai_audit_logs FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM salesai_profiles WHERE role = 'super_admin'));

CREATE POLICY "Admins can see audit logs for their company"
  ON salesai_audit_logs FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM salesai_profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- GDPR Data Deletion Function
CREATE OR REPLACE FUNCTION salesai_gdpr_delete_user_data(user_auth_id UUID)
RETURNS void AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Get the profile ID
  SELECT id INTO user_profile_id FROM salesai_profiles WHERE auth_id = user_auth_id;
  
  -- Delete related data
  DELETE FROM salesai_api_keys WHERE profile_id = user_profile_id;
  DELETE FROM salesai_feedback WHERE profile_id = user_profile_id;
  DELETE FROM salesai_usage WHERE profile_id = user_profile_id;
  DELETE FROM salesai_subscriptions WHERE profile_id = user_profile_id;
  
  -- Anonymize transcripts
  UPDATE salesai_transcripts
  SET 
    content = '[ANONYMIZED BY USER REQUEST]',
    structured_content = jsonb_build_object('anonymized', true, 'timestamp', now()),
    is_anonymized = true,
    anonymized_at = now()
  WHERE session_id IN (
    SELECT id FROM salesai_sessions WHERE profile_id = user_profile_id
  );
  
  -- Anonymize analysis results
  UPDATE salesai_analysis_results
  SET results = results - 'personal_context' - 'audio_samples'
  WHERE session_id IN (
    SELECT id FROM salesai_sessions WHERE profile_id = user_profile_id
  );
  
  -- Update sessions (remove audio files but keep statistics)
  UPDATE salesai_sessions
  SET 
    audio_file_url = null,
    title = '[ANONYMIZED SESSION]'
  WHERE profile_id = user_profile_id;
  
  -- Finally delete the profile
  DELETE FROM salesai_profiles WHERE id = user_profile_id;
  
  -- Log the deletion
  INSERT INTO salesai_audit_logs (
    user_id,
    event_type,
    resource,
    action,
    details
  ) VALUES (
    user_auth_id,
    'gdpr',
    'profile',
    'delete',
    jsonb_build_object('timestamp', now(), 'reason', 'GDPR request')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
