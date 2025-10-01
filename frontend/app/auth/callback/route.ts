import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const response = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options })
          },
        }
      }
    )

    try {
      const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && authData?.user) {
        console.log('✅ Auth successful for user:', authData.user.email)

        // After successful auth, try to ensure user profile exists
        try {
          await ensureUserProfile(authData.user, authData.session, origin)
          console.log('✅ User profile verified/created')
        } catch (profileError) {
          console.error('⚠️ Profile creation failed:', profileError)
          // Don't block login, but redirect to setup page
          return NextResponse.redirect(`${origin}/setup?source=profile_creation_failed`)
        }

        // Successfully authenticated, redirect to intended destination
        return NextResponse.redirect(`${origin}${next}`, { headers: response.headers })
      } else {
        console.error('Auth exchange error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}

async function ensureUserProfile(user: any, session: any, origin: string) {
  try {
    // Detect if this is a self-registration vs admin-created user
    // Self-registrations should always be demo users
    const isAdminCreated = user.user_metadata?.role && user.user_metadata?.role !== 'demo_user';
    const finalRole = isAdminCreated ? user.user_metadata.role : 'demo_user';

    console.log('👤 Creating profile - Admin created:', isAdminCreated, 'Role:', finalRole);
    console.log('🔑 Authentication context available - Access token:', session.access_token ? 'Present' : 'Missing');

    // Extract access token from session for API authentication
    const accessToken = session?.access_token;
    if (!accessToken) {
      console.error('❌ No access token available in session');
      throw new Error('Authentication token missing from session');
    }

    // Check if profile already exists by calling our profile creation API
    const profileResponse = await fetch(`${origin}/api/profile/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name ||
                    user.user_metadata?.full_name?.split(' ')[0] ||
                    user.email?.split('@')[0] ||
                    'User',
        last_name: user.user_metadata?.last_name ||
                   user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                   '',
        company_name: user.user_metadata?.company ||
                      user.user_metadata?.company_name ||
                      'Unknown Company',
        position: user.user_metadata?.position || null,
        phone: user.user_metadata?.phone || null,
        team_size: user.user_metadata?.team_size || null,
        role: finalRole
      })
    })

    if (profileResponse.status === 409) {
      // Profile already exists, that's fine
      console.log('👤 User profile already exists')
      return
    }

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json().catch(() => ({ error: 'Unable to parse error response' }))
      console.error('❌ Profile creation failed:', {
        status: profileResponse.status,
        statusText: profileResponse.statusText,
        error: errorData,
        authContext: accessToken ? 'Bearer token present' : 'No bearer token'
      })

      // Handle specific error cases with detailed debugging
      if (profileResponse.status === 401) {
        console.error('🚫 Authentication failed - Bearer token may be invalid or expired')
        throw new Error('Authentication failed: Bearer token invalid or expired')
      }

      if (profileResponse.status === 403) {
        console.error('🚫 Authorization failed - User may not have permission to create profile')
        throw new Error('Authorization failed: Insufficient permissions to create profile')
      }

      if (profileResponse.status === 400 && errorData.error?.includes('role')) {
        console.error('⚠️ Role validation failed for demo user registration')
        throw new Error('Invalid role assignment for demo user registration')
      }

      if (profileResponse.status === 500) {
        console.error('💥 Server error during profile creation')
        throw new Error(`Server error during profile creation: ${errorData.error}`)
      }

      throw new Error(`Profile creation failed (${profileResponse.status}): ${errorData.error}`)
    }

    const profileData = await profileResponse.json()
    console.log('✅ User profile created:', profileData.profile.email)

  } catch (error) {
    console.error('❌ Error in ensureUserProfile:', error)
    throw error
  }
}
