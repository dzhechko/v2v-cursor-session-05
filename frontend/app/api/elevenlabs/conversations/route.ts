import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenlabsApiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Fetching ElevenLabs conversations list');

    console.log('🔍 Fetching real conversations from ElevenLabs API...');
    
    // Fetch conversations list from ElevenLabs API using correct endpoint
    const conversationsResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversations',
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenlabsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!conversationsResponse.ok) {
      const errorText = await conversationsResponse.text();
      console.error('❌ ElevenLabs Conversations API error:', {
        status: conversationsResponse.status,
        statusText: conversationsResponse.statusText,
        body: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch conversations from ElevenLabs',
          details: errorText
        },
        { status: conversationsResponse.status }
      );
    }

    const conversationsData = await conversationsResponse.json();
    console.log('✅ Real ElevenLabs conversations retrieved:', {
      count: conversationsData.conversations?.length || 0
    });

    // Transform data for dashboard using real ElevenLabs API structure
    const transformedConversations = (conversationsData.conversations || []).map((conv: any) => ({
      id: conv.conversation_id,
      title: conv.call_summary_title || `Voice Training - ${new Date(conv.start_time_unix_secs * 1000).toLocaleDateString()}`,
      date: new Date(conv.start_time_unix_secs * 1000).toISOString(),
      duration: conv.call_duration_secs || 0,
      status: conv.status || 'completed',
      call_successful: conv.call_successful,
      feedback_summary: conv.transcript_summary || 'AI-powered analysis available',
      overall_score: null, // Will be populated by analysis
      message_count: conv.message_count,
      agent_id: conv.agent_id,
      agent_name: conv.agent_name,
      direction: conv.direction
    }));

    return NextResponse.json({
      conversations: transformedConversations,
      total: transformedConversations.length
    });

  } catch (error) {
    console.error('❌ Error fetching ElevenLabs conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
