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

    const { provider_token } = await req.json();
    if (!provider_token) {
      throw new Error('No Google access token provided. Please sign out and sign in again with Google.');
    }

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
