import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenlabsApiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Fetching ElevenLabs conversation details:', conversationId);

    // Fetch conversation details from ElevenLabs API using correct endpoint
    const conversationResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenlabsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!conversationResponse.ok) {
      const errorText = await conversationResponse.text();
      console.error('❌ ElevenLabs API error:', {
        status: conversationResponse.status,
        statusText: conversationResponse.statusText,
        body: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch conversation from ElevenLabs',
          details: errorText
        },
        { status: conversationResponse.status }
      );
    }

    const conversationData = await conversationResponse.json();
    console.log('✅ ElevenLabs conversation details retrieved:', {
      id: conversationData.conversation_id,
      status: conversationData.status,
      transcript_messages: conversationData.transcript?.length || 0,
      start_time: conversationData.metadata?.start_time_unix_secs,
      duration: conversationData.metadata?.call_duration_secs,
      has_audio: conversationData.has_audio,
      analysis_available: !!conversationData.analysis
    });

    return NextResponse.json(conversationData);

  } catch (error) {
    console.error('❌ Error fetching ElevenLabs conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
