import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push('🧪 Starting database save test...');

    const authHeader = request.headers.get('authorization');
    logs.push(`🔑 Authorization header: ${authHeader ? 'Present' : 'Missing'}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    logs.push('✅ Supabase client created with service_role');

    let profileId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      logs.push('🔍 Getting user from token...');
      const { data: { user }, error: userError } = await authClient.auth.getUser(token);

      if (userError) {
        logs.push(`❌ User error: ${JSON.stringify(userError)}`);
      } else if (user) {
        logs.push(`✅ User found: ${user.email}`);

        const { data: profile, error: profileError } = await supabase
          .from('salesai_profiles')
          .select('id, company_id, email, role')
          .eq('auth_id', user.id)
          .single();

        if (profileError) {
          logs.push(`❌ Profile error: ${JSON.stringify(profileError)}`);
        } else if (profile) {
          profileId = profile.id;
          logs.push(`✅ Profile found: ${profile.email} (${profile.role})`);
        } else {
          logs.push('⚠️ No profile found');
        }
      }
    } else {
      logs.push('⚠️ No authorization header - cannot identify user');
    }

    if (profileId) {
      logs.push(`💾 Attempting to save test session with profile_id: ${profileId}`);

      const testConversationId = `test-${Date.now()}`;
      const sessionData = {
        conversation_id: testConversationId,
        profile_id: profileId,
        title: 'Test Session - DB Diagnostics',
        status: 'analyzed' as const,
        duration_seconds: 60,
        processing_status: 'completed',
        analytics_summary: {
          overall_score: 8.5,
          message_count: 2,
          test: true
        }
      };

      logs.push(`📝 Session data prepared for conversation: ${testConversationId}`);

      const { data: session, error: sessionError } = await supabase
        .from('salesai_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (sessionError) {
        logs.push(`❌ Session insert error: ${JSON.stringify(sessionError)}`);
        logs.push(`❌ Error code: ${sessionError.code}`);
        logs.push(`❌ Error message: ${sessionError.message}`);
        logs.push(`❌ Error hint: ${sessionError.hint}`);
      } else if (session) {
        logs.push(`✅ Session created successfully with ID: ${session.id}`);

        // Try to save analysis
        const analysisData = {
          session_id: session.id,
          analysis_type: 'test',
          provider: 'test',
          version: '1.0',
          results: { test: true, message: 'Database test successful' },
          confidence_score: 0.85
        };

        const { error: analysisError } = await supabase
          .from('salesai_analysis_results')
          .insert(analysisData);

        if (analysisError) {
          logs.push(`❌ Analysis insert error: ${JSON.stringify(analysisError)}`);
        } else {
          logs.push(`✅ Analysis result saved successfully`);
        }
      }
    } else {
      logs.push('⚠️ Cannot save - no profile ID available');
    }

    logs.push('🏁 Test complete');

    return NextResponse.json({
      success: !logs.some(l => l.includes('❌')),
      logs,
      profileId
    });

  } catch (error) {
    logs.push(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      success: false,
      logs,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
