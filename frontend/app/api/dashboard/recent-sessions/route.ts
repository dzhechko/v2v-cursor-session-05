import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenlabsApiKey) {
      console.log('⚠️ ElevenLabs API key not configured');
      return NextResponse.json([]);
    }

    console.log('📋 Fetching real ElevenLabs conversations for dashboard...');

    // Direct call to ElevenLabs API
    const elevenlabsResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversations',
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenlabsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (elevenlabsResponse.ok) {
      const conversationsData = await elevenlabsResponse.json();
      const conversations = conversationsData.conversations || [];

      // Get cached analysis from database
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const conversationIds = conversations.map((c: any) => c.conversation_id).filter(Boolean);

      let cachedAnalysis: any[] = [];
      if (conversationIds.length > 0) {
        const { data } = await supabase
          .from('salesai_sessions')
          .select('conversation_id, analytics_summary, salesai_analysis_results(results)')
          .in('conversation_id', conversationIds);

        cachedAnalysis = data || [];
        console.log(`💾 Found ${cachedAnalysis.length} cached analyses in database`);
      }

      // Transform ElevenLabs conversations for dashboard using real API structure
      // Sort by start time (newest first) and show ALL conversations
      const recentSessions = conversations
        .sort((a: any, b: any) => b.start_time_unix_secs - a.start_time_unix_secs)
        .map((conv: any) => {
        const cached = cachedAnalysis.find(c => c.conversation_id === conv.conversation_id);
        const cachedScore = cached?.analytics_summary?.overall_score ||
                           cached?.salesai_analysis_results?.[0]?.results?.analysis?.overall_score;

        return {
          id: conv.conversation_id,
          conversation_id: conv.conversation_id, // Include for unique identification
          title: conv.call_summary_title || `Voice Training - ${new Date(conv.start_time_unix_secs * 1000).toLocaleDateString()}`,
          duration: conv.call_duration_secs || 0,
          minutes: Math.ceil((conv.call_duration_secs || 0) / 60),
          score: cachedScore || 0, // Use cached score or 0 if not analyzed yet
          date: new Date(conv.start_time_unix_secs * 1000).toISOString(),
          status: conv.status === 'done' ? 'completed' : conv.status,
          improvement: 0, // Will calculate when we have historical data
          feedback: cached ? '✅ Analysis cached' : '📊 Click to analyze',
          topics: ['Voice Training', 'Sales Conversation', 'Product Demo'],
          isCached: !!cached
        };
      });

      console.log(`📋 Real ElevenLabs sessions found: ${recentSessions.length}`);
      return NextResponse.json(recentSessions);
    } else {
      const errorText = await elevenlabsResponse.text();
      console.error('❌ ElevenLabs API error:', errorText);
      return NextResponse.json([]);
    }

  } catch (error) {
    console.error('❌ Recent sessions error:', error);
    return NextResponse.json([]);
  }
}
