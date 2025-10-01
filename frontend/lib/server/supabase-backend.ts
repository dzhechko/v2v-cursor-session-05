/* server-only */
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin client with full access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Table names with salesai_ prefix
export const TABLES = {
  COMPANIES: 'salesai_companies',
  PROFILES: 'salesai_profiles',
  API_KEYS: 'salesai_api_keys',
  SESSIONS: 'salesai_sessions',
  TRANSCRIPTS: 'salesai_transcripts',
  ANALYSIS_RESULTS: 'salesai_analysis_results',
  SESSION_ANALYTICS: 'salesai_session_analytics',
  SUBSCRIPTIONS: 'salesai_subscriptions',
  USAGE: 'salesai_usage',
  FEEDBACK: 'salesai_feedback',
  AUDIT_LOGS: 'salesai_audit_logs'
};

export type Profile = {
  id: string;
  auth_id: string;
  company_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  phone?: string;
  team_size?: number;
  role: 'user' | 'admin' | 'super_admin' | 'demo_user';
  demo_sessions_used?: number;
  demo_minutes_used?: number;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  profile_id: string;
  company_id?: string;
  title: string;
  status: 'active' | 'completed' | 'analyzed' | 'archived';
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  audio_quality?: Record<string, any>;
  audio_file_url?: string;
  audio_file_size?: number;
  minute_cost?: number;
  processing_status: string;
  analytics_summary?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type ApiKey = {
  id: string;
  profile_id: string;
  service: string;
  encrypted_key: string;
  key_hash: string;
  created_at: string;
  last_used?: string;
  is_active: boolean;
};

export type Subscription = {
  id: string;
  profile_id: string;
  company_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  minutes_limit: number;
  minutes_used: number;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  canceled_at?: string;
};

// Demo user helper functions
export function getDemoLimits() {
  return {
    maxSessions: 1,
    maxMinutes: 2.0
  };
}

export function canStartDemoSession(profile: Profile): boolean {
  if (profile.role !== 'demo_user') {
    return true; // Non-demo users can always start sessions (subject to subscription limits)
  }

  const { maxSessions, maxMinutes } = getDemoLimits();
  const sessionsUsed = profile.demo_sessions_used || 0;
  const minutesUsed = profile.demo_minutes_used || 0;

  return sessionsUsed < maxSessions && minutesUsed < maxMinutes;
}

export async function updateDemoUsage(profileId: string, minutesUsed: number): Promise<void> {
  const { error } = await supabase.rpc('increment_demo_usage', {
    p_profile_id: profileId,
    p_minutes: minutesUsed
  });

  if (error) {
    throw new Error(`Failed to update demo usage: ${error.message}`);
  }
}

export async function incrementDemoSessions(profileId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_demo_sessions', {
    p_profile_id: profileId
  });

  if (error) {
    throw new Error(`Failed to increment demo sessions: ${error.message}`);
  }
}

export async function incrementDemoMinutes(profileId: string, minutesUsed: number): Promise<void> {
  const { error } = await supabase.rpc('increment_demo_minutes', {
    p_profile_id: profileId,
    p_minutes: minutesUsed
  });

  if (error) {
    throw new Error(`Failed to increment demo minutes: ${error.message}`);
  }
}