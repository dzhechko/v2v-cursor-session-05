// Real ElevenLabs integration using environment variables
export async function GET(request: Request) {
  try {
    // Use environment variables with proper validation
    const XI_API_KEY = process.env.ELEVENLABS_API_KEY?.trim();
    const AGENT_ID = process.env.ELEVENLABS_AGENT_ID?.trim();
    
    if (!XI_API_KEY || XI_API_KEY === '' || XI_API_KEY === 'your_elevenlabs_api_key_here') {
      console.error('❌ ELEVENLABS_API_KEY not properly configured');
      return new Response(JSON.stringify({ 
        error: 'ElevenLabs API key not configured',
        message: 'Please set ELEVENLABS_API_KEY environment variable in .env.local with your actual API key from elevenlabs.io',
        setup: 'Create .env.local file in /frontend/ directory and add: ELEVENLABS_API_KEY=sk_your_actual_key'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!AGENT_ID || AGENT_ID === '' || AGENT_ID === 'your_elevenlabs_agent_id_here') {
      console.error('❌ ELEVENLABS_AGENT_ID not properly configured');
      return new Response(JSON.stringify({ 
        error: 'ElevenLabs agent not configured',
        message: 'Please set ELEVENLABS_AGENT_ID environment variable in .env.local with your agent ID from ElevenLabs Conversational AI',
        setup: 'Create Conversational AI agent at elevenlabs.io/app/conversational-ai and copy the Agent ID'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔄 Requesting signed URL from ElevenLabs API...');

    // Request signed URL from ElevenLabs API with conversation_id included
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}&include_conversation_id=true`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': XI_API_KEY
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to get signed URL from ElevenLabs',
        status: response.status,
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Extract conversation_id from signed URL query parameters
    let conversationId = null;
    try {
      const url = new URL(data.signed_url);
      conversationId = url.searchParams.get('conversation_id');
    } catch (e) {
      console.warn('Could not parse conversation_id from signed URL');
    }

    console.log('✅ ElevenLabs signed URL obtained successfully', {
      hasConversationId: !!conversationId,
      conversationId
    });

    return new Response(JSON.stringify({
      signedUrl: data.signed_url,
      conversationId: conversationId, // Extracted from signed_url query params
      agentId: AGENT_ID
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ElevenLabs API route error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
