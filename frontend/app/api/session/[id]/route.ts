import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '../../../../lib/supabase-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    // Handle demo sessions
    if (sessionId.startsWith('demo-')) {
      console.log('🎭 Demo session requested:', sessionId);
      return NextResponse.json({
        session: null,
        isDemo: true,
        message: 'Demo session - using localStorage data'
      });
    }

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from(TABLES.SESSIONS)
      .select(`
        *,
        profile:${TABLES.PROFILES}(
          first_name,
          last_name,
          company_name,
          position
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get detailed analysis if available
    const { data: analysisResult } = await supabase
      .from(TABLES.ANALYSIS_RESULTS)
      .select('analysis_data')
      .eq('session_id', sessionId)
      .single();

    console.log('✅ Session found:', session.id, 'Status:', session.status);

    const sessionData = {
      id: session.id,
      title: session.session_type || 'Voice Training Session',
      status: session.status,
      duration: session.duration_seconds || 0,
      transcript: session.transcript,
      overallScore: session.overall_score,
      feedbackSummary: session.feedback_summary,
      createdAt: session.created_at,
      endedAt: session.ended_at,
      analyzedAt: session.analyzed_at,
      processingStatus: session.processing_status,
      profile: session.profile,
      detailedAnalysis: analysisResult?.analysis_data || null
    };

    return NextResponse.json({
      session: sessionData,
      isDemo: false
    });

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
