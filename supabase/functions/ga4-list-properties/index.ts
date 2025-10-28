import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's OAuth token for Google Analytics
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_oauth_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (tokenError || !tokenData?.access_token) {
      return new Response(
        JSON.stringify({ 
          error: 'Google Analytics not connected',
          needsAuth: true 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching GA4 properties for user:', user.id);

    // Fetch GA4 properties from Google Analytics Admin API
    const response = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GA4 API error:', errorData);
      
      // If token expired, mark for refresh
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Token expired, please reconnect Google Analytics',
            needsAuth: true 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`GA4 API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract GA4 properties
    const properties = [];
    
    if (data.accountSummaries) {
      for (const account of data.accountSummaries) {
        if (account.propertySummaries) {
          for (const property of account.propertySummaries) {
            // Only GA4 properties (not UA properties)
            if (property.property && property.property.startsWith('properties/')) {
              properties.push({
                propertyId: property.property.replace('properties/', ''),
                propertyName: property.displayName || 'Unnamed Property',
                accountName: account.displayName || 'Unnamed Account',
                parent: property.parent || account.account,
              });
            }
          }
        }
      }
    }

    // Save properties to database
    if (properties.length > 0) {
      const propertiesToInsert = properties.map(prop => ({
        user_id: user.id,
        property_id: prop.propertyId,
        property_name: prop.propertyName,
        last_synced_at: new Date().toISOString(),
      }));

      // Upsert properties
      await supabase
        .from('ga4_properties')
        .upsert(propertiesToInsert, { 
          onConflict: 'user_id,property_id',
          ignoreDuplicates: false 
        });
    }

    return new Response(
      JSON.stringify({ 
        properties,
        count: properties.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ga4-list-properties:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
