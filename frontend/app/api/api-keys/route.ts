import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase-backend';
import { createHash, createCipher, createDecipher } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this-in-production';

interface ApiKeyRequest {
  api_keys: {
    service: string;
    key: string;
  }[];
}

// Simple encryption/decryption (use better solution in production)
function encryptKey(text: string): string {
  try {
    const cipher = createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    // Fallback to base64 if crypto fails
    return Buffer.from(text).toString('base64');
  }
}

function decryptKey(encryptedText: string): string {
  try {
    const decipher = createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Fallback from base64
    try {
      return Buffer.from(encryptedText, 'base64').toString('utf8');
    } catch {
      return encryptedText; // Return as-is if can't decrypt
    }
  }
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// GET - Retrieve user's API keys
export async function GET(request: NextRequest) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Extract token from Bearer
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('salesai_profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('salesai_api_keys')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_active', true);

    if (keysError) {
      console.error('Error fetching API keys:', keysError);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    // Decrypt keys for response (only return masked versions for security)
    const maskedKeys = apiKeys?.map(key => ({
      id: key.id,
      service: key.service,
      key: maskApiKey(decryptKey(key.encrypted_key)),
      is_active: key.is_active,
      last_used: key.last_used,
      created_at: key.created_at
    })) || [];

    return NextResponse.json({ api_keys: maskedKeys });

  } catch (error) {
    console.error('GET API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save/Update API keys
export async function POST(request: NextRequest) {
  try {
    const body: ApiKeyRequest = await request.json();
    
    if (!body.api_keys || !Array.isArray(body.api_keys)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('salesai_profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log('💾 Saving API keys for profile:', profile.id);

    // Process each API key
    const savedKeys = [];
    
    for (const keyData of body.api_keys) {
      if (!keyData.service || !keyData.key) {
        continue; // Skip invalid entries
      }

      const encryptedKey = encryptKey(keyData.key);
      const keyHash = hashKey(keyData.key);

      // Check if key already exists for this service
      const { data: existingKey } = await supabase
        .from('salesai_api_keys')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('service', keyData.service)
        .single();

      if (existingKey) {
        // Update existing key
        const { error: updateError } = await supabase
          .from('salesai_api_keys')
          .update({
            encrypted_key: encryptedKey,
            key_hash: keyHash,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingKey.id);

        if (updateError) {
          console.error(`Error updating ${keyData.service} key:`, updateError);
          continue;
        }

        console.log(`✅ Updated ${keyData.service} API key`);
      } else {
        // Create new key
        const { data: newKey, error: insertError } = await supabase
          .from('salesai_api_keys')
          .insert({
            profile_id: profile.id,
            service: keyData.service,
            encrypted_key: encryptedKey,
            key_hash: keyHash,
            is_active: true
          })
          .select('*')
          .single();

        if (insertError) {
          console.error(`Error creating ${keyData.service} key:`, insertError);
          continue;
        }

        console.log(`✅ Created ${keyData.service} API key`);
      }

      savedKeys.push({
        service: keyData.service,
        status: 'saved'
      });
    }

    return NextResponse.json({
      message: 'API keys saved successfully',
      saved_keys: savedKeys
    });

  } catch (error) {
    console.error('POST API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to mask API keys for display
function maskApiKey(key: string): string {
  if (key.length <= 8) return key;
  
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const masked = '*'.repeat(key.length - 8);
  
  return `${start}${masked}${end}`;
}
