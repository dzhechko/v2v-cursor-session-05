import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES, incrementDemoMinutes } from '../../../../lib/server/supabase-backend';

function validateEndSession(data: any) {
  if (!data.session_id || typeof data.session_id !== 'string') {
    throw new Error('Invalid session_id');
  }
  if (!data.duration_seconds || typeof data.duration_seconds !== 'number' || data.duration_seconds <= 0) {
    throw new Error('Invalid duration_seconds');
  }
  // conversation_id is optional but should be string if provided
  if (data.conversation_id && typeof data.conversation_id !== 'string') {
    throw new Error('Invalid conversation_id');
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body first to check for demo session
    const body = await req.json();
    const validatedData = validateEndSession(body);
    
    // Handle demo sessions
    if (validatedData.session_id.startsWith('demo-')) {
      console.log('🎭 Demo session ending:', validatedData.session_id);
      
      const minutesUsed = Math.ceil(validatedData.duration_seconds / 60);
      const mockScore = Math.round((Math.random() * 2 + 3.5) * 10) / 10; // 3.5-5.5
      
      // Return mock response for demo
      return NextResponse.json({
        session: {
          id: validatedData.session_id,
          status: 'completed',
          ended_at: new Date().toISOString(),
          duration_seconds: validatedData.duration_seconds,
          minute_cost: 0, // Free for demo
          minutes_used: minutesUsed,
          score: mockScore,
          isDemo: true
        }
      });
    }
    
    // For real sessions, require authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user token with Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Body already parsed and validated above

    // Get the session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.SESSIONS)
      .select('*')
      .eq('id', validatedData.session_id)
      .eq('profile_id', profile.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Calculate minute cost based on duration
    const minutesUsed = Math.ceil(validatedData.duration_seconds / 60);
    const minuteCost = minutesUsed * 0.1; // $0.1 per minute (example pricing)

    // Update the session
    const { data: updatedSession, error: updateError } = await supabase
      .from(TABLES.SESSIONS)
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: validatedData.duration_seconds,
        transcript: validatedData.transcript, // ← Store real transcript
        conversation_id: validatedData.conversation_id, // ← Store ElevenLabs conversation_id
        audio_quality: validatedData.audio_quality,
        audio_file_url: validatedData.audio_file_url,
        audio_file_size: validatedData.audio_file_size,
        minute_cost: minuteCost,
        processing_status: 'analyzing'
      })
      .eq('id', validatedData.session_id)
      .select()
      .single();

    if (updateError) {
      console.error('Session update error:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    // Update demo usage if this is a demo user
    if (profile.role === 'demo_user') {
      console.log('🔍 Updating demo minutes for completed session...');
      try {
        await incrementDemoMinutes(profile.id, minutesUsed);
        console.log('✅ Demo minutes updated:', minutesUsed);
      } catch (demoError) {
        console.error('⚠️ Failed to update demo minutes:', demoError);
        // Don't fail the session completion for this
      }
    }

    // Update subscription usage (only for non-demo users with active subscriptions)
    if (profile.role !== 'demo_user') {
      const { data: subscription } = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .select('*')
        .eq('profile_id', profile.id)
        .eq('status', 'active')
        .single();

      if (subscription) {
        await supabase
          .from(TABLES.SUBSCRIPTIONS)
          .update({
            minutes_used: subscription.minutes_used + minutesUsed
          })
          .eq('id', subscription.id);

        // Record usage
        await supabase.from(TABLES.USAGE).insert({
          profile_id: profile.id,
          company_id: profile.company_id,
          minutes_used: minutesUsed,
          session_id: validatedData.session_id,
          period_start: subscription.current_period_start,
          period_end: subscription.current_period_end
        });
      }
    }

    // Log audit trail
    await supabase.from(TABLES.AUDIT_LOGS).insert({
      user_id: user.id,
      company_id: profile.company_id,
      event_type: 'session',
      resource: 'sessions',
      action: 'complete',
      details: {
        session_id: validatedData.session_id,
        duration_seconds: validatedData.duration_seconds,
        minutes_used: minutesUsed,
        minute_cost: minuteCost,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        ended_at: updatedSession.ended_at,
        duration_seconds: updatedSession.duration_seconds,
        minute_cost: minuteCost,
        minutes_used: minutesUsed
      }
    });

  } catch (error) {
    console.error('Error in end-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
