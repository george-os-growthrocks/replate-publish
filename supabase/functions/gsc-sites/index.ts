import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getFreshGoogleToken } from "../_shared/gsc-token-refresh.ts";

// Deno global type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 GSC Sites - Fetching list of GSC properties');

    // Authenticate user
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
      throw new Error('Missing authorization header');
      }
      
      const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false }
        }
      );

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user) throw new Error('Unauthorized');

      console.log('✅ User authenticated:', user.id);
      
    // Get fresh Google token (auto-refreshes if needed)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const providerToken = await getFreshGoogleToken(supabaseAdmin, user.id);

    console.log('🚀 Fetching GSC sites from Google API...');

    const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: {
        'Authorization': `Bearer ${providerToken}`,
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
