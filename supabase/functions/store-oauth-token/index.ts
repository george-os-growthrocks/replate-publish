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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''; // Use service role key
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', user.id);

    // Get token from request body
    const { provider_token, provider_refresh_token, expires_at } = await req.json();
    
    if (!provider_token) {
      throw new Error('No provider_token provided');
    }

    console.log('💾 Storing OAuth token for user:', user.id);

    // Store token in database
    const { data, error } = await supabaseClient
      .from('user_oauth_tokens')
      .upsert({
        user_id: user.id,
        provider: 'google',
        access_token: provider_token,
        refresh_token: provider_refresh_token,
        expires_at: expires_at ? new Date(expires_at * 1000).toISOString() : null,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      }, {
        onConflict: 'user_id,provider'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error storing token:', error);
      throw error;
    }

    console.log('✅ Token stored successfully');

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Error in store-oauth-token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400,
      }
    );
  }
});

