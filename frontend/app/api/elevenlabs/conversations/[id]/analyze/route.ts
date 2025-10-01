import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

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

    // 1. Check cache in database first
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: cachedAnalysis, error: cacheError } = await supabase
      .from('salesai_sessions')
      .select('id, conversation_id, analytics_summary, salesai_analysis_results(*)')
      .eq('conversation_id', conversationId)
      .single();

    if (cacheError) {
      console.log('ℹ️ No cached analysis found (expected for first analysis)');
    }

    if (cachedAnalysis?.salesai_analysis_results?.[0]?.results) {
      console.log('✅ Found cached analysis in database - returning cached result');
      const cached = cachedAnalysis.salesai_analysis_results[0].results;
      return NextResponse.json(cached);
    }

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

    // 1. Fetch conversation details from ElevenLabs with retry logic
    let conversationData;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount <= maxRetries) {
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

      conversationData = await conversationResponse.json();
      console.log('📋 ElevenLabs conversation data (attempt', retryCount + 1, '):', {
        id: conversationData.conversation_id,
        status: conversationData.status,
        transcript_messages: conversationData.transcript?.length || 0,
        duration: conversationData.metadata?.call_duration_secs
      });

      // 2. Check if transcript is available
      const transcript = conversationData.transcript || [];

      if (transcript.length > 0) {
        console.log('✅ Transcript ready with', transcript.length, 'messages');
        break; // Transcript is ready, exit retry loop
      }

      // If no transcript and we haven't exhausted retries, wait and retry
      if (retryCount < maxRetries) {
        console.log(`⏳ Transcript not ready yet, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryCount++;
      } else {
        // Final retry exhausted, return error
        console.error('❌ Transcript still not available after', maxRetries + 1, 'attempts');
        return NextResponse.json(
          {
            error: 'Transcript not ready yet. Please wait a moment and try again.',
            conversation_status: conversationData.status,
            retry_after: 5 // Suggest retry after 5 seconds
          },
          { status: 400 }
        );
      }
    }

    // 3. Extract transcript for analysis
    const transcript = conversationData.transcript || [];
    if (transcript.length === 0) {
      return NextResponse.json(
        { error: 'No transcript available for analysis after retries' },
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

    // 5. Save to database for caching (prevents redundant GPT API calls)
    console.log('💾 Starting database caching process...');
    const debugInfo: any = { cache_attempt: true };
    try {
      const authHeader = request.headers.get('authorization');
      console.log('🔑 Authorization header present:', !!authHeader);
      debugInfo.has_auth_header = !!authHeader;

      let profileId = null;

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const authClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log('🔍 Getting user from auth token...');
        const { data: { user }, error: userError } = await authClient.auth.getUser(token);

        if (userError) {
          console.error('❌ Failed to get user from token:', userError);
          debugInfo.user_error = userError.message;
        } else if (user) {
          console.log('✅ User authenticated:', user.email);
          debugInfo.user_email = user.email;

          const { data: profile, error: profileError } = await supabase
            .from('salesai_profiles')
            .select('id, company_id')
            .eq('auth_id', user.id)
            .single();

          if (profileError) {
            console.error('❌ Failed to fetch profile:', profileError);
            debugInfo.profile_error = profileError.message;
          } else if (profile) {
            profileId = profile.id;
            console.log('✅ Profile found:', profile.id);
            debugInfo.profile_id = profile.id;
          } else {
            console.warn('⚠️ No profile found for user:', user.id);
            debugInfo.profile_not_found = true;
          }
        } else {
          console.warn('⚠️ No user data from token');
        }
      } else {
        console.warn('⚠️ No authorization header in request');
      }

      if (profileId) {
        console.log('💾 Caching analysis to database for conversation:', conversationId);

        // Create or update session record
        const sessionData = {
          conversation_id: conversationId,
          profile_id: profileId,
          title: `Voice Training - ${new Date().toLocaleString()}`,
          status: 'analyzed' as const,
          duration_seconds: conversationData.metadata?.call_duration_secs || 0,
          processing_status: 'completed',
          analytics_summary: {
            overall_score: analysis.overall_score,
            message_count: transcript.length,
            cached_at: new Date().toISOString()
          }
        };

        console.log('📝 Upserting session with data:', { conversation_id: conversationId, profile_id: profileId });

        const { data: session, error: sessionError } = await supabase
          .from('salesai_sessions')
          .upsert(sessionData, {
            onConflict: 'conversation_id',
            ignoreDuplicates: false
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('❌ Failed to save session:', sessionError);
          console.error('❌ Session error details:', JSON.stringify(sessionError));
          throw sessionError;
        }

        if (session) {
          console.log('✅ Session saved with ID:', session.id);

          // Save analysis results with unique constraint per session
          const analysisData = {
            session_id: session.id,
            analysis_type: 'sales_conversation',
            provider: 'openai',
            version: process.env.OPENAI_MODEL || 'gpt-4o',
            results: result,
            confidence_score: analysis.overall_score / 10
          };

          console.log('📝 Upserting analysis results for session:', session.id);

          const { error: analysisError } = await supabase
            .from('salesai_analysis_results')
            .upsert(analysisData, {
              onConflict: 'session_id',
              ignoreDuplicates: false
            });

          if (analysisError) {
            console.error('❌ Failed to save analysis results:', analysisError);
            console.error('❌ Analysis error details:', JSON.stringify(analysisError));
            throw analysisError;
          }

          console.log('✅ Analysis successfully cached in database (session_id:', session.id, ')');
          console.log('💡 Future requests for this conversation will use cached results');
          debugInfo.cache_saved = true;
          debugInfo.session_id = session.id;
        } else {
          console.error('❌ Session upsert returned no data');
          debugInfo.session_no_data = true;
        }
      } else {
        console.warn('⚠️ No profile ID - analysis will not be cached');
        console.warn('⚠️ Caching requires: 1) Authorization header, 2) Valid user, 3) Existing profile');
        debugInfo.no_profile_id = true;
      }

      result._debug = debugInfo;
    } catch (dbError) {
      console.error('❌ Failed to cache analysis (detailed):', dbError);
      console.error('❌ Error type:', dbError instanceof Error ? dbError.constructor.name : typeof dbError);
      console.error('❌ Error message:', dbError instanceof Error ? dbError.message : String(dbError));
      // Don't fail the response if caching fails - analysis is still returned to user
      debugInfo.cache_error = dbError instanceof Error ? dbError.message : String(dbError);
      result._debug = debugInfo;
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
