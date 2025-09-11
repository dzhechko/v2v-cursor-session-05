import { NextRequest, NextResponse } from 'next/server';

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

      // Transform ElevenLabs conversations for dashboard using real API structure
      const recentSessions = conversations.slice(0, 10).map((conv: any) => ({
        id: conv.conversation_id,
        title: conv.call_summary_title || `Voice Training - ${new Date(conv.start_time_unix_secs * 1000).toLocaleDateString()}`,
        duration: Math.ceil((conv.call_duration_secs || 0) / 60),
        minutes: Math.ceil((conv.call_duration_secs || 0) / 60),
        score: Math.floor(Math.random() * 2 + 3.5 * 10) / 10, // Random score until analysis
        date: new Date(conv.start_time_unix_secs * 1000).toISOString(),
        status: conv.status === 'done' ? 'completed' : conv.status,
        improvement: Math.floor(Math.random() * 5 + 10) / 10, // Random improvement until historical data
        feedback: conv.transcript_summary || 'AI-powered analysis available',
        topics: ['Voice Training', 'Sales Conversation', 'Product Demo']
      }));

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
