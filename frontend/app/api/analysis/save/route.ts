import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversation_id, analysis_data } = body;

    if (!conversation_id || !analysis_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role for DB operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user from auth header if available
    const authHeader = req.headers.get('authorization');
    let profileId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await authClient.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from('salesai_profiles')
          .select('id, company_id')
          .eq('auth_id', user.id)
          .single();
        if (profile) profileId = profile.id;
      }
    }

    // Check if analysis already exists
    const { data: existing } = await supabase
      .from('salesai_sessions')
      .select('id, conversation_id')
      .eq('conversation_id', conversation_id)
      .single();

    let sessionId;

    if (existing) {
      sessionId = existing.id;
      console.log(' Found existing session:', sessionId);
    } else if (profileId) {
      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from('salesai_sessions')
        .insert({
          profile_id: profileId,
          conversation_id: conversation_id,
          title: analysis_data.title || `Voice Training - ${new Date().toLocaleString()}`,
          status: 'analyzed',
          duration_seconds: analysis_data.duration_seconds || 0,
          processing_status: 'completed',
          analytics_summary: {
            overall_score: analysis_data.overall_score,
            message_count: analysis_data.message_count
          }
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
      } else if (newSession) {
        sessionId = newSession.id;
        console.log(' Created new session:', sessionId);
      }
    }

    // Save analysis results
    if (sessionId) {
      const { error: analysisError } = await supabase
        .from('salesai_analysis_results')
        .upsert({
          session_id: sessionId,
          analysis_type: 'sales_conversation',
          provider: 'openai',
          version: analysis_data.model || 'gpt-4o',
          results: analysis_data,
          confidence_score: (analysis_data.overall_score || 0) / 10
        }, {
          onConflict: 'session_id'
        });

      if (analysisError) {
        console.error('Analysis save error:', analysisError);
        return NextResponse.json(
          { error: 'Failed to save analysis' },
          { status: 500 }
        );
      }

      console.log(' Analysis saved to database');
      return NextResponse.json({ success: true, session_id: sessionId });
    }

    // No profile - can't save
    return NextResponse.json({
      success: false,
      message: 'No user profile found, analysis not saved'
    });

  } catch (error) {
    console.error('L Error saving analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
