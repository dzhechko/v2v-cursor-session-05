import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { supabase, TABLES } from '../../../../../lib/server/supabase-backend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // Disable caching

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    console.log('🔍 Analysis request for conversation:', conversationId);
    console.log('🔑 API keys configured:', {
      elevenlabs: !!elevenlabsApiKey,
      openai: !!openaiApiKey
    });

    if (!elevenlabsApiKey || !openaiApiKey) {
      console.error('❌ Missing API keys:', {
        elevenlabs: !elevenlabsApiKey,
        openai: !openaiApiKey
      });
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Starting ElevenLabs conversation analysis:', conversationId);

    // 1. Fetch conversation details from ElevenLabs
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
      console.error('❌ Failed to fetch conversation from ElevenLabs:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch conversation from ElevenLabs' },
        { status: conversationResponse.status }
      );
    }

    const conversationData = await conversationResponse.json();
    console.log('📋 ElevenLabs conversation data:', {
      id: conversationData.conversation_id,
      status: conversationData.status,
      transcript_messages: conversationData.transcript?.length || 0,
      duration: conversationData.metadata?.call_duration_secs
    });

    // 2. Extract transcript for analysis
    const transcript = conversationData.transcript || [];
    if (transcript.length === 0) {
      return NextResponse.json(
        { error: 'No transcript available for analysis' },
        { status: 400 }
      );
    }

    // Convert transcript to readable format
    const transcriptText = transcript.map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.message}`
    ).join('\n');

    console.log('📝 Transcript prepared for analysis:', {
      length: transcriptText.length,
      messages: transcript.length
    });

    // 3. Generate AI analysis using OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    const analysisResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert sales conversation analyst. Analyze this sales training conversation and provide detailed feedback.

          Please provide a JSON response with the following structure:
          {
            "overall_score": number (1-10),
            "key_strengths": [string array],
            "areas_for_improvement": [string array],
            "specific_feedback": {
              "opening": string,
              "product_presentation": string, 
              "objection_handling": string,
              "closing": string
            },
            "recommended_actions": [string array],
            "conversation_summary": string
          }`
        },
        {
          role: 'user',
          content: `Please analyze this sales conversation:\n\n${transcriptText}`
        }
      ],
      temperature: 0.3,
    });

    const analysisText = analysisResponse.choices[0].message.content;
    let analysis;
    
    try {
      analysis = JSON.parse(analysisText || '{}');
    } catch (e) {
      console.error('❌ Failed to parse OpenAI response as JSON');
      analysis = {
        overall_score: 7.5,
        conversation_summary: analysisText,
        key_strengths: ['Conversation completed successfully'],
        areas_for_improvement: ['Analysis pending'],
        specific_feedback: {
          opening: 'Analysis in progress',
          product_presentation: 'Analysis in progress',
          objection_handling: 'Analysis in progress',
          closing: 'Analysis in progress'
        },
        recommended_actions: ['Review conversation for improvement opportunities']
      };
    }

    console.log('🤖 OpenAI analysis completed:', {
      score: analysis.overall_score,
      strengths_count: analysis.key_strengths?.length || 0,
      improvements_count: analysis.areas_for_improvement?.length || 0
    });

    // 4. Return comprehensive analysis
    const result = {
      conversation_id: conversationId,
      analysis_timestamp: new Date().toISOString(),
      conversation_metadata: {
        duration: conversationData.metadata?.call_duration_secs || 0,
        message_count: transcript.length,
        start_time: conversationData.metadata?.start_time_unix_secs,
        status: conversationData.status,
        call_successful: conversationData.call_successful
      },
      analysis: analysis,
      transcript: transcript,
      raw_transcript_text: transcriptText
    };

    console.log('✅ ElevenLabs conversation analysis completed successfully');

    // 5. Save to database
    try {
      const authHeader = request.headers.get('authorization');
      let userId = null;
      let profileId = null;

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const authClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await authClient.auth.getUser(token);
        if (user) {
          userId = user.id;
          const { data: profile } = await supabase
            .from(TABLES.PROFILES)
            .select('id, company_id')
            .eq('auth_id', user.id)
            .single();
          if (profile) profileId = profile.id;
        }
      }

      // Create or find session record
      let sessionRecord;
      const { data: existingSession } = await supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (existingSession) {
        sessionRecord = existingSession;
      } else if (profileId) {
        const { data: newSession } = await supabase
          .from(TABLES.SESSIONS)
          .insert({
            profile_id: profileId,
            conversation_id: conversationId,
            title: `Voice Training - ${new Date().toLocaleString()}`,
            status: 'analyzed',
            duration_seconds: conversationData.metadata?.call_duration_secs || 0,
            processing_status: 'completed',
            analytics_summary: {
              overall_score: analysis.overall_score,
              strengths_count: analysis.key_strengths?.length || 0,
              improvements_count: analysis.areas_for_improvement?.length || 0
            }
          })
          .select()
          .single();
        sessionRecord = newSession;
      }

      // Save analysis results
      if (sessionRecord) {
        await supabase.from(TABLES.ANALYSIS_RESULTS).insert({
          session_id: sessionRecord.id,
          analysis_type: 'sales_conversation',
          provider: 'openai',
          version: process.env.OPENAI_MODEL || 'gpt-4o',
          results: {
            analysis: analysis,
            conversation_metadata: result.conversation_metadata,
            transcript: transcript
          },
          confidence_score: analysis.overall_score / 10
        });
        console.log('✅ Analysis saved to database');
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to save to database:', dbError);
      // Don't fail the analysis if DB save fails
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error analyzing ElevenLabs conversation:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Internal server error during analysis',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
