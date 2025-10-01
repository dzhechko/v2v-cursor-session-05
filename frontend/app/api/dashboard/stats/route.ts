import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for server-side
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.log('❌ No authenticated session for stats');
      // Return demo stats for non-authenticated users
      return NextResponse.json({
        minutesLeft: 2,
        sessionsToday: 0,
        progressScore: 0,
        streakDays: 0,
        totalMinutesUsed: 0,
        totalSessions: 0,
        averageScore: 0,
        isDemo: true
      });
    }

    console.log('✅ Getting real stats for user:', session.user.id);

    // Get user profile with error handling
    const { data: profile, error: profileError } = await supabase
      .from('salesai_profiles')
      .select('*')
      .eq('auth_id', session.user.id)
      .maybeSingle(); // Use maybeSingle() to avoid errors when profile doesn't exist

    if (profileError) {
      console.error('❌ Profile query error:', profileError);
      // Return demo stats if profile query fails
      return NextResponse.json({
        minutesLeft: 2,
        sessionsToday: 0,
        progressScore: 0,
        streakDays: 0,
        totalMinutesUsed: 0,
        totalSessions: 0,
        averageScore: 0,
        isDemo: true,
        error: 'Profile query failed'
      });
    }

    if (!profile) {
      console.warn('⚠️ User profile not found, creating default demo profile');
      // Instead of returning 404, create a default demo profile or return demo stats
      return NextResponse.json({
        minutesLeft: 2,
        sessionsToday: 0,
        progressScore: 0,
        streakDays: 0,
        totalMinutesUsed: 0,
        totalSessions: 0,
        averageScore: 0,
        isDemo: true,
        error: 'Profile needs to be created'
      });
    }

    // Handle demo users with specific stats
    if (profile.role === 'demo_user') {
      console.log('📊 Getting demo user stats');
      const demoSessionsUsed = profile.demo_sessions_used || 0;
      const demoMinutesUsed = profile.demo_minutes_used || 0;
      const minutesLeft = Math.max(0, 2 - demoMinutesUsed);
      const sessionsLeft = Math.max(0, 1 - demoSessionsUsed);

      return NextResponse.json({
        minutesLeft,
        sessionsToday: demoSessionsUsed,
        progressScore: 0,
        streakDays: 0,
        totalMinutesUsed: demoMinutesUsed,
        totalSessions: demoSessionsUsed,
        averageScore: 0,
        isDemo: true,
        demoLimits: {
          maxSessions: 1,
          maxMinutes: 2,
          sessionsUsed: demoSessionsUsed,
          minutesUsed: demoMinutesUsed,
          sessionsLeft,
          canStartSession: sessionsLeft > 0 && minutesLeft > 0
        }
      });
    }

    // Get user's subscription to determine minutes left (skip for demo users)
    const { data: subscription } = await supabase
      .from('salesai_subscriptions')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no subscription exists

    // Calculate minutes left from subscription data
    let minutesLeft = 100; // Default fallback
    if (subscription) {
      minutesLeft = Math.max(0, subscription.minutes_limit - subscription.minutes_used);
    }

    // Get usage statistics for display purposes (not used in minutes calculation)
    const { data: usage } = await supabase
      .from('salesai_usage')
      .select('minutes_used')
      .eq('profile_id', profile.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const totalMinutesUsed = usage?.reduce((sum, record) => sum + record.minutes_used, 0) || 0;

    // Get sessions for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todaySessions, count: sessionsToday } = await supabase
      .from('salesai_sessions')
      .select('*', { count: 'exact' })
      .eq('profile_id', profile.id)
      .gte('created_at', today.toISOString());

    // Get all completed sessions for statistics
    const { data: allSessions } = await supabase
      .from('salesai_sessions')
      .select('id, created_at')
      .eq('profile_id', profile.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(100);

    // Get analytics data for scoring
    const { data: analyticsData } = await supabase
      .from('salesai_session_analytics')
      .select('overall_score')
      .eq('profile_id', profile.id)
      .not('overall_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate average score from analytics data
    const averageScore = analyticsData && analyticsData.length > 0
      ? analyticsData.reduce((sum, record) => sum + (record.overall_score || 0), 0) / analyticsData.length
      : 0;

    // Calculate streak days (consecutive days with sessions)
    let streakDays = 0;
    if (allSessions && allSessions.length > 0) {
      const sessionDates = allSessions.map(s => new Date(s.created_at).toDateString());
      const uniqueDates = [...new Set(sessionDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      const todayStr = new Date().toDateString();
      if (uniqueDates[0] === todayStr || uniqueDates[0] === new Date(Date.now() - 24*60*60*1000).toDateString()) {
        streakDays = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i-1]);
          const prevDate = new Date(uniqueDates[i]);
          const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (24*60*60*1000);
          
          if (daysDiff === 1) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    const stats = {
      minutesLeft,
      sessionsToday: sessionsToday || 0,
      progressScore: Math.round(averageScore * 10) / 10,
      streakDays,
      totalMinutesUsed,
      totalSessions: allSessions?.length || 0,
      averageScore: Math.round(averageScore * 10) / 10,
      subscriptionTier: subscription?.plan_name || 'starter',
      isDemo: false
    };

    console.log('📊 Real user stats calculated:', stats);
    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    
    // Fallback to demo stats if database query fails
    return NextResponse.json({
      minutesLeft: 2,
      sessionsToday: 0,
      progressScore: 0,
      streakDays: 0,
      totalMinutesUsed: 0,
      totalSessions: 0,
      averageScore: 0,
      isDemo: true,
      error: 'Could not load real stats'
    });
  }
}
