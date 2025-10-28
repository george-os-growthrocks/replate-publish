import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user) throw new Error('Unauthorized - no user found');

    console.log('✅ User authenticated:', user.id);

    // Try to get provider_token from database first
    let provider_token = null;
    
    console.log('🔍 Looking for stored OAuth token in database...');
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('user_oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (tokenError) {
      console.error('❌ Error fetching token from database:', tokenError);
    } else if (tokenData) {
      console.log('✅ Found stored token in database');
      provider_token = tokenData.access_token;
      
      // Check if token is expired
      if (tokenData.expires_at) {
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        if (expiresAt <= now) {
          console.warn('⚠️ Stored token is expired. User needs to re-authenticate.');
          provider_token = null;
        }
      }
    }

    // Fallback: try to get from request body
    if (!provider_token) {
      try {
        const body = await req.json();
        provider_token = body.provider_token;
        console.log('📥 Received provider_token from request:', provider_token ? 'Yes' : 'No');
      } catch (e) {
        console.log('⚠️ No JSON body provided');
      }
    }

    // Last resort: try to get from session (rarely works)
    if (!provider_token) {
      const { data: session } = await supabaseClient.auth.getSession();
      provider_token = session?.session?.provider_token;
      console.log('🔑 Provider token from session:', provider_token ? 'Yes' : 'No');
    }

    if (!provider_token) {
      throw new Error('No Google access token available. Please sign out and sign in again with Google to grant access to Search Console.');
    }

    console.log('🚀 Fetching GSC sites for user:', user.id);

    const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: {
        'Authorization': `Bearer ${provider_token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('GSC API error:', responseText);
      throw new Error(`Google Search Console API error (${response.status}): ${responseText}`);
    }

    const data = JSON.parse(responseText);

    // Transform to match expected format (API returns siteEntry, frontend expects sites)
    const transformedData = {
      sites: data.siteEntry || []
    };

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gsc-sites function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      }), 
      {
        status: 200, // Return 200 so the client can read the error details
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
