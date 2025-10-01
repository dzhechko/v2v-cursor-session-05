import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES, canStartDemoSession, getDemoLimits, incrementDemoSessions } from '../../../../lib/server/supabase-backend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const createSessionSchema = {
  title: (value: any) => typeof value === 'string' && value.length >= 1 && value.length <= 255,
  company_id: (value: any) => !value || (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
};

function validateSchema(data: any, schema: any) {
  for (const [key, validator] of Object.entries(schema)) {
    if (data[key] !== undefined && !validator(data[key])) {
      throw new Error(`Invalid ${key}`);
    }
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body first
    const body = await req.json();
    console.log('🔍 Session create request:', {
      userId: body.userId,
      hasAuthHeader: !!req.headers.get('authorization'),
      bodyKeys: Object.keys(body)
    });
    
    // Handle demo sessions (when userId is 'demo-user' or no auth header)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || body.userId === 'demo-user') {
      console.log('🎭 Creating demo session for user:', body.userId, 'Reason:', !authHeader ? 'No auth header' : 'Demo user');
      
      const demoSessionId = `demo-session-${Date.now()}`;
      
      return NextResponse.json({
        session: {
          id: demoSessionId,
          title: body.title || 'Demo Voice Training Session',
          status: 'active',
          started_at: new Date().toISOString(),
          processing_status: 'ready',
          isDemo: true
        }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Verifying auth token...');

    // Create auth client with anon key to verify user token
    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the user token with Supabase
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) {
      console.error('❌ Auth verification failed:', userError);
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    console.log('✅ User verified:', user.email);

    // Get user profile
    console.log('🔍 Looking for user profile...');
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    console.log('✅ Profile found:', profile.email);

    // Check demo user limits if this is a demo user
    if (profile.role === 'demo_user') {
      if (!canStartDemoSession(profile)) {
        const { maxSessions, maxMinutes } = getDemoLimits();
        const sessionsUsed = profile.demo_sessions_used || 0;
        const minutesUsed = profile.demo_minutes_used || 0;

        return NextResponse.json({
          error: 'Demo limit exceeded',
          message: `Demo users can use ${maxSessions} session(s) up to ${maxMinutes} minutes total. You've used ${sessionsUsed} session(s) and ${minutesUsed.toFixed(1)} minutes. Please upgrade to continue training.`,
          needsUpgrade: true
        }, { status: 400 });
      }

      console.log('✅ Demo user can start session - limits OK');
    }

    // Body already parsed above, validate it
    const validatedData = validateSchema(body, createSessionSchema);

    // Check if user has available minutes (if they have a subscription)
    const { data: subscription, error: subError } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .select('*')
      .eq('profile_id', profile.id)
      .eq('status', 'active')
      .single();

    if (subscription && subscription.minutes_used >= subscription.minutes_limit) {
      return NextResponse.json({ 
        error: 'Subscription minute limit reached. Please upgrade your plan.' 
      }, { status: 400 });
    }

    // Create the session
    console.log('🔍 Creating real session in database...');
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.SESSIONS)
      .insert({
        profile_id: profile.id,
        company_id: validatedData.company_id || profile.company_id,
        title: validatedData.title,
        status: 'active',
        processing_status: 'ready'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('✅ Real session created:', session.id);

    // Update demo usage if this is a demo user
    if (profile.role === 'demo_user') {
      console.log('🔍 Updating demo usage for user...');
      try {
        await incrementDemoSessions(profile.id);
        console.log('✅ Demo usage updated atomically');
      } catch (updateError) {
        console.error('⚠️ Failed to update demo usage:', updateError);
        // Don't fail the session creation for this
      }
    }

    // Log audit trail
    await supabase.from(TABLES.AUDIT_LOGS).insert({
      user_id: user.id,
      company_id: profile.company_id,
      event_type: 'session',
      resource: 'sessions',
      action: 'create',
      details: {
        session_id: session.id,
        title: validatedData.title,
        timestamp: new Date().toISOString()
      }
    });

    // Prepare response with demo limit info if applicable
    const response: any = {
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        started_at: session.started_at,
        processing_status: session.processing_status
      }
    };

    // Add demo user info to response
    if (profile.role === 'demo_user') {
      const { maxMinutes } = getDemoLimits();
      const remainingMinutes = Math.max(0, maxMinutes - (profile.demo_minutes_used || 0));

      response.demo = {
        isDemo: true,
        maxSessionMinutes: Math.min(2, remainingMinutes), // Max 2 minutes per session
        remainingMinutes,
        message: `Demo session limited to ${Math.min(2, remainingMinutes).toFixed(1)} minutes`
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in create-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
