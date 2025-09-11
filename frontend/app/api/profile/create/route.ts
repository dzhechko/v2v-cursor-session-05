import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase-backend';

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
    
    // Validate required fields
    if (!body.auth_id || !body.email || !body.first_name || !body.last_name || !body.company_name) {
      return NextResponse.json(
        { error: 'Missing required fields: auth_id, email, first_name, last_name, company_name' },
        { status: 400 }
      );
    }

    console.log('📝 Creating profile for user:', body.email);

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

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('salesai_profiles')
      .insert({
        auth_id: body.auth_id,
        company_id: company_id,
        email: body.email.toLowerCase().trim(),
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        position: body.position?.trim() || null,
        phone: body.phone?.trim() || null,
        team_size: body.team_size || null,
        role: (body.role || 'user') as 'user' | 'admin' | 'super_admin',
        settings: {
          notifications: true,
          email_summaries: true,
          onboarding_completed: false
        }
      })
      .select('*')
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('✅ Profile created successfully for:', profile.email);

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
