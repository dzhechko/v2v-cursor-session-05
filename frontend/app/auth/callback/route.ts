import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
      },
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieStore,
      }
    )

    try {
      const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && authData?.user) {
        console.log('✅ Auth successful for user:', authData.user.email)

        // After successful auth, try to ensure user profile exists
        try {
          await ensureUserProfile(authData.user, origin)
          console.log('✅ User profile verified/created')
        } catch (profileError) {
          console.error('⚠️ Profile creation failed:', profileError)
          // Don't block login, but redirect to setup page
          return NextResponse.redirect(`${origin}/setup?source=profile_creation_failed`)
        }

        // Successfully authenticated, redirect to intended destination
        return NextResponse.redirect(`${origin}${next}`)
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

async function ensureUserProfile(user: any, origin: string) {
  try {
    // Check if profile already exists by calling our profile creation API
    const profileResponse = await fetch(`${origin}/api/profile/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        role: user.user_metadata?.role || 'user'
      })
    })

    if (profileResponse.status === 409) {
      // Profile already exists, that's fine
      console.log('👤 User profile already exists')
      return
    }

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json()
      console.error('❌ Profile creation failed:', errorData)
      throw new Error(`Profile creation failed: ${errorData.error}`)
    }

    const profileData = await profileResponse.json()
    console.log('✅ User profile created:', profileData.profile.email)

  } catch (error) {
    console.error('❌ Error in ensureUserProfile:', error)
    throw error
  }
}
