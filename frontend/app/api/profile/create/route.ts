import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabase } from '../../../../lib/server/supabase-backend';

interface ProfileCreateRequest {
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  role?: string;
  position?: string;
  phone?: string;
  team_size?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProfileCreateRequest = await request.json();

    // Validate required fields (last_name is optional to support various identity providers)
    if (!body.auth_id || !body.email || !body.first_name || !body.company_name) {
      return NextResponse.json(
        { error: 'Missing required fields: auth_id, email, first_name, company_name' },
        { status: 400 }
      );
    }

    console.log('📝 Creating profile for user:', body.email);

    // Try multiple authentication methods: cookie-based first, then bearer token
    let user = null;
    let authMethod = '';
    let serverClient = null;
    let bearerClient = null;

    // Method 1: Cookie-based authentication (for direct API calls)
    try {
      const cookieStore = cookies();
      serverClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      const { data: { user: cookieUser }, error: cookieAuthError } = await serverClient.auth.getUser();

      if (!cookieAuthError && cookieUser) {
        user = cookieUser;
        authMethod = 'cookie';
        console.log('🍪 Authenticated via cookies for user:', user.email);
      }
    } catch (cookieError) {
      console.log('⚠️ Cookie authentication failed:', cookieError);
    }

    // Method 2: Bearer token authentication (for internal calls from callback)
    if (!user) {
      try {
        const authHeader = request.headers.get('authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          console.log('🔑 Attempting bearer token authentication');

          // Use supabase-js client for better reliability with bearer tokens
          bearerClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          await bearerClient.auth.setSession({ access_token: token, refresh_token: '' });
          const { data: { user: bearerUser }, error: bearerAuthError } = await bearerClient.auth.getUser();

          if (!bearerAuthError && bearerUser) {
            user = bearerUser;
            authMethod = 'bearer';
            console.log('🎫 Authenticated via bearer token for user:', user.email);
          } else {
            console.error('🚫 Bearer token authentication failed:', bearerAuthError);
          }
        }
      } catch (bearerError) {
        console.error('⚠️ Bearer token authentication error:', bearerError);
      }
    }

    // If neither authentication method worked, return 401
    if (!user) {
      console.log('❌ All authentication methods failed - no valid user found');
      return NextResponse.json(
        { error: 'Authentication required - no valid session or bearer token provided' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated via:', authMethod, 'User ID:', user.id);

    // Get the requester's profile to check permissions
    const { data: requesterProfile } = await supabase
      .from('salesai_profiles')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    // Validate role assignment - only authorized users can create non-demo profiles
    const requestedRole = body.role || 'demo_user';
    const isPrivilegedRoleRequest = requestedRole !== 'demo_user';
    const isRequesterAdmin = requesterProfile?.role === 'admin' || requesterProfile?.role === 'super_admin';

    console.log('🔍 Role validation context:', {
      requestedRole,
      isPrivilegedRoleRequest,
      isRequesterAdmin,
      requesterProfile: requesterProfile?.role || 'no existing profile',
      authMethod,
      isCreatingOwnProfile: user.id === body.auth_id
    });

    if (isPrivilegedRoleRequest && !isRequesterAdmin) {
      console.log('⚠️ Unauthorized attempt to create non-demo role:', requestedRole, 'by user:', user.id, 'via', authMethod);
      return NextResponse.json(
        { error: 'Insufficient permissions to assign non-demo roles' },
        { status: 403 }
      );
    }

    // Force demo_user role for self-registrations (non-admin users)
    const finalRole = isRequesterAdmin ? requestedRole : 'demo_user';

    if (finalRole !== requestedRole) {
      console.log('🔒 Role overridden to demo_user for non-admin requester (auth method:', authMethod + ')');
    }

    // Prevent cross-user profile creation for non-admin users
    if (!isRequesterAdmin && user.id !== body.auth_id) {
      console.log('🚫 Mismatch between requester and target auth_id', { requesterId: user.id, targetId: body.auth_id });
      return NextResponse.json({ error: 'Cannot create profile for another user' }, { status: 403 });
    }

    console.log('👤 Creating profile with role:', finalRole, 'for user:', body.email, '(requested by:', user.email, 'via', authMethod + ')');

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('salesai_profiles')
      .select('id')
      .eq('auth_id', body.auth_id)
      .single();

    if (existingProfile) {
      console.log('⚠️ Profile already exists for auth_id:', body.auth_id);
      return NextResponse.json(
        { error: 'Profile already exists for this user' },
        { status: 409 }
      );
    }

    // Create or get company
    let company_id = null;
    
    // First, try to find existing company by name
    const { data: existingCompany } = await supabase
      .from('salesai_companies')
      .select('id')
      .eq('name', body.company_name.trim())
      .single();

    if (existingCompany) {
      company_id = existingCompany.id;
      console.log('✅ Using existing company:', body.company_name);
    } else {
      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('salesai_companies')
        .insert({
          name: body.company_name.trim(),
          domain: extractDomainFromEmail(body.email),
          settings: {}
        })
        .select('id')
        .single();

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        return NextResponse.json(
          { error: 'Failed to create company record' },
          { status: 500 }
        );
      }

      company_id = newCompany.id;
      console.log('✅ Created new company:', body.company_name);
    }

    // Choose appropriate database client based on admin status for RLS enforcement
    const dbClient = isRequesterAdmin
      ? supabase // service role for admin operations
      : (authMethod === 'cookie' ? serverClient : bearerClient); // user client for RLS enforcement

    // Create user profile
    const { data: profile, error: profileError } = await dbClient
      .from('salesai_profiles')
      .insert({
        auth_id: body.auth_id,
        company_id: company_id,
        email: body.email.toLowerCase().trim(),
        first_name: body.first_name.trim(),
        last_name: body.last_name?.trim() || '',
        position: body.position?.trim() || null,
        phone: body.phone?.trim() || null,
        team_size: body.team_size || null,
        role: finalRole as 'user' | 'admin' | 'super_admin' | 'demo_user',
        demo_sessions_used: 0,
        demo_minutes_used: 0,
        settings: {
          notifications: true,
          email_summaries: true,
          onboarding_completed: false
        }
      })
      .select('*')
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', {
        error: profileError,
        authMethod,
        finalRole,
        userContext: {
          auth_id: body.auth_id,
          email: body.email,
          requester: user.email
        }
      });
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('✅ Profile created successfully for:', profile.email, 'with role:', profile.role, '(auth method:', authMethod + ')');

    return NextResponse.json({
      profile: {
        id: profile.id,
        auth_id: profile.auth_id,
        company_id: profile.company_id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: `${profile.first_name} ${profile.last_name}`,
        position: profile.position,
        phone: profile.phone,
        team_size: profile.team_size,
        role: profile.role,
        demo_sessions_used: profile.demo_sessions_used,
        demo_minutes_used: profile.demo_minutes_used,
        created_at: profile.created_at
      },
      message: 'Profile created successfully'
    });

  } catch (error) {
    console.error('❌ Profile creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to extract domain from email
function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@(.+)/);
  return match ? match[1].toLowerCase() : null;
}
