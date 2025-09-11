-- Sales AI Trainer - Complete Database Setup
-- Execute this file in Supabase SQL Editor to set up all tables and policies

-- ============================================================================
-- SCHEMA SETUP
-- ============================================================================

-- Create custom types
CREATE TYPE salesai_user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE salesai_session_status AS ENUM ('active', 'completed', 'analyzed', 'archived');
CREATE TYPE salesai_subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

-- Companies table (tenant root)
CREATE TABLE IF NOT EXISTS salesai_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (user data)
CREATE TABLE IF NOT EXISTS salesai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  company_id UUID REFERENCES salesai_companies(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  position VARCHAR(255),
  phone VARCHAR(100),
  team_size INTEGER,
  role salesai_user_role DEFAULT 'user',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table (secure storage)
CREATE TABLE IF NOT EXISTS salesai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES salesai_profiles(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Sessions table (core metadata)
CREATE TABLE IF NOT EXISTS salesai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES salesai_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES salesai_companies(id),
  
  -- Session metadata
  title VARCHAR(255) NOT NULL,
  status salesai_session_status DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Audio metadata  
  audio_quality JSONB,
  audio_file_url TEXT,
  audio_file_size BIGINT,
  
  -- Performance tracking
  minute_cost DECIMAL(10,4),
  processing_status TEXT DEFAULT 'pending',
  
  -- Analytics summary
  analytics_summary JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS salesai_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES salesai_sessions(id) ON DELETE CASCADE,
  
  -- Content data
  content TEXT,
  structured_content JSONB,
  
  -- Processing metadata
  language VARCHAR(10) DEFAULT 'en-US',
  confidence_score DECIMAL(5,4),
  word_count INTEGER,
  
  -- GDPR compliance
  is_anonymized BOOLEAN DEFAULT FALSE,
  anonymized_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS salesai_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES salesai_sessions(id) ON DELETE CASCADE,
  
  -- Analysis metadata
  analysis_type VARCHAR(50),
  provider VARCHAR(50),
  version VARCHAR(20),
  
  -- Results data
  results JSONB NOT NULL,
  
  -- Quality metrics
  confidence_score DECIMAL(5,4),
  processing_time_ms INTEGER,
  
  -- Cost tracking
  api_cost_usd DECIMAL(10,6),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session analytics table (for faster queries)
CREATE TABLE IF NOT EXISTS salesai_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES salesai_sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES salesai_profiles(id),
  company_id UUID REFERENCES salesai_companies(id),
  
  -- Core metrics
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  talk_time_ratio DECIMAL(5,4),
  filler_words_count INTEGER,
  speaking_pace_wpm INTEGER,
  sentiment_score DECIMAL(5,4),
  
  -- Skill scores
  opening_score INTEGER CHECK (opening_score >= 0 AND opening_score <= 100),
  questioning_score INTEGER CHECK (questioning_score >= 0 AND questioning_score <= 100),
  objection_handling_score INTEGER CHECK (objection_handling_score >= 0 AND objection_handling_score <= 100),
  closing_score INTEGER CHECK (closing_score >= 0 AND closing_score <= 100),
  
  -- Time-based analytics
  session_date DATE,
  session_hour INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS salesai_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES salesai_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES salesai_companies(id),
  
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  plan_id VARCHAR(50) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  status salesai_subscription_status NOT NULL,
  
  minutes_limit INTEGER NOT NULL,
  minutes_used INTEGER DEFAULT 0,
  
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  canceled_at TIMESTAMP WITH TIME ZONE
);

-- Usage table (tracks consumption)
CREATE TABLE IF NOT EXISTS salesai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES salesai_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES salesai_companies(id),
  
  minutes_used DECIMAL(10,2) NOT NULL,
  session_id UUID REFERENCES salesai_sessions(id),
  
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS salesai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES salesai_sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES salesai_profiles(id),
  
  metrics JSONB NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS salesai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  company_id UUID,
  event_type VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_salesai_profiles_company ON salesai_profiles (company_id);
CREATE INDEX IF NOT EXISTS idx_salesai_sessions_profile ON salesai_sessions (profile_id);
CREATE INDEX IF NOT EXISTS idx_salesai_sessions_company ON salesai_sessions (company_id);
CREATE INDEX IF NOT EXISTS idx_salesai_sessions_status ON salesai_sessions (status);
CREATE INDEX IF NOT EXISTS idx_salesai_sessions_created ON salesai_sessions (created_at);
CREATE INDEX IF NOT EXISTS idx_salesai_transcripts_session ON salesai_transcripts (session_id);
CREATE INDEX IF NOT EXISTS idx_salesai_analysis_session ON salesai_analysis_results (session_id);
CREATE INDEX IF NOT EXISTS idx_salesai_analytics_profile ON salesai_session_analytics (profile_id);
CREATE INDEX IF NOT EXISTS idx_salesai_analytics_company ON salesai_session_analytics (company_id);
CREATE INDEX IF NOT EXISTS idx_salesai_analytics_date ON salesai_session_analytics (session_date);
CREATE INDEX IF NOT EXISTS idx_salesai_subscriptions_profile ON salesai_subscriptions (profile_id);
CREATE INDEX IF NOT EXISTS idx_salesai_subscriptions_company ON salesai_subscriptions (company_id);
CREATE INDEX IF NOT EXISTS idx_salesai_subscriptions_status ON salesai_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_salesai_usage_profile ON salesai_usage (profile_id);
CREATE INDEX IF NOT EXISTS idx_salesai_usage_company ON salesai_usage (company_id);
CREATE INDEX IF NOT EXISTS idx_salesai_usage_period ON salesai_usage (period_start, period_end);

-- Full text search on transcripts
CREATE INDEX IF NOT EXISTS idx_salesai_transcript_search ON salesai_transcripts USING GIN (to_tsvector('english', content));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION salesai_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_salesai_companies_timestamp ON salesai_companies;
CREATE TRIGGER update_salesai_companies_timestamp
BEFORE UPDATE ON salesai_companies
FOR EACH ROW EXECUTE PROCEDURE salesai_update_timestamp();

DROP TRIGGER IF EXISTS update_salesai_profiles_timestamp ON salesai_profiles;
CREATE TRIGGER update_salesai_profiles_timestamp
BEFORE UPDATE ON salesai_profiles
FOR EACH ROW EXECUTE PROCEDURE salesai_update_timestamp();

DROP TRIGGER IF EXISTS update_salesai_sessions_timestamp ON salesai_sessions;
CREATE TRIGGER update_salesai_sessions_timestamp
BEFORE UPDATE ON salesai_sessions
FOR EACH ROW EXECUTE PROCEDURE salesai_update_timestamp();

DROP TRIGGER IF EXISTS update_salesai_transcripts_timestamp ON salesai_transcripts;
CREATE TRIGGER update_salesai_transcripts_timestamp
BEFORE UPDATE ON salesai_transcripts
FOR EACH ROW EXECUTE PROCEDURE salesai_update_timestamp();

DROP TRIGGER IF EXISTS update_salesai_subscriptions_timestamp ON salesai_subscriptions;
CREATE TRIGGER update_salesai_subscriptions_timestamp
BEFORE UPDATE ON salesai_subscriptions
FOR EACH ROW EXECUTE PROCEDURE salesai_update_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super Admins can see all companies" ON salesai_companies;
DROP POLICY IF EXISTS "Admins can see their own company" ON salesai_companies;
DROP POLICY IF EXISTS "Super Admins can insert companies" ON salesai_companies;
DROP POLICY IF EXISTS "Super Admins can update companies" ON salesai_companies;
DROP POLICY IF EXISTS "Super Admins can delete companies" ON salesai_companies;

-- Companies table policies
CREATE POLICY "Super Admins can see all companies" 
  ON salesai_companies FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Admins can see their own company" 
  ON salesai_companies FOR SELECT
  USING (id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Super Admins can insert companies" 
  ON salesai_companies FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Super Admins can update companies" 
  ON salesai_companies FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Super Admins can delete companies" 
  ON salesai_companies FOR DELETE
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Profiles table policies
DROP POLICY IF EXISTS "Users can see own profile" ON salesai_profiles;
DROP POLICY IF EXISTS "Admins can see profiles in their company" ON salesai_profiles;
DROP POLICY IF EXISTS "Super Admins can see all profiles" ON salesai_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON salesai_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their company" ON salesai_profiles;
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON salesai_profiles;

CREATE POLICY "Users can see own profile" 
  ON salesai_profiles FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" 
  ON salesai_profiles FOR UPDATE
  USING (auth.uid() = auth_id);

-- Sessions table policies
DROP POLICY IF EXISTS "Users can see own sessions" ON salesai_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON salesai_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON salesai_sessions;

CREATE POLICY "Users can see own sessions" 
  ON salesai_sessions FOR SELECT
  USING (profile_id IN (
    SELECT id FROM salesai_profiles WHERE auth_id = auth.uid()
  ));

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

-- API Keys table policies  
DROP POLICY IF EXISTS "Users can see own API keys" ON salesai_api_keys;
DROP POLICY IF EXISTS "Users can manage own API keys" ON salesai_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON salesai_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON salesai_api_keys;

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

-- ============================================================================
-- GDPR COMPLIANCE
-- ============================================================================

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

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Show created tables
SELECT 'Setup completed! Created tables:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'salesai_%'
ORDER BY table_name;
