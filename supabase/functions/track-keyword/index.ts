import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Authorization header:', authHeader ? `EXISTS (${authHeader.substring(0, 20)}...)` : 'MISSING');
    
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const jwt = authHeader.replace('Bearer ', '');
    console.log('🔑 JWT extracted:', jwt.substring(0, 30) + '...');
    
    // Create Supabase client with the user's JWT for RLS to work
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    console.log('🔍 Calling supabase.auth.getUser(jwt)...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    console.log('👤 User result:', user ? `EXISTS (id: ${user.id})` : 'NULL');
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Auth failed: ${authError.message}`);
    }
    
    if (!user) {
      throw new Error('Unauthorized: No user found in token');
    }
    
    console.log('✅ User authenticated successfully:', user.email);

    const { action, keyword, property } = await req.json();
    console.log('📋 Action:', action, '| Keyword:', keyword, '| Property:', property);

    if (action === 'add') {
      console.log('➕ Adding keyword to tracked_keywords table...');
      
      // Add keyword to tracked_keywords
      const { data, error } = await supabase
        .from('tracked_keywords')
        .insert({
          user_id: user.id,
          property,
          keyword: keyword.toLowerCase(),
          active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }
      
      console.log('✅ Keyword inserted:', data);
      console.log('📊 Recording current ranking from GSC...');

      // Create initial ranking record from GSC data
      await recordCurrentRanking(supabase, user.id, property, keyword);

      console.log('✅ Add operation complete');
      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'remove') {
      // Remove keyword from tracking
      const { error } = await supabase
        .from('tracked_keywords')
        .update({ active: false })
        .eq('user_id', user.id)
        .eq('property', property)
        .eq('keyword', keyword.toLowerCase());

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'list') {
      // Get all tracked keywords
      const { data, error } = await supabase
        .from('tracked_keywords')
        .select('*')
        .eq('user_id', user.id)
        .eq('property', property)
        .eq('active', true);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'get_history') {
      // Get ranking history for a keyword
      const { data, error } = await supabase
        .from('keyword_rankings')
        .select('*')
        .eq('user_id', user.id)
        .eq('property', property)
        .eq('keyword', keyword.toLowerCase())
        .order('checked_at', { ascending: true })
        .limit(90); // Last 90 days

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'sync_all') {
      // Sync all tracked keywords with current GSC data
      console.log('🔄 Syncing all tracked keywords for property:', property);
      
      // Get all tracked keywords
      const { data: trackedKeywords, error: fetchError } = await supabase
        .from('tracked_keywords')
        .select('keyword')
        .eq('user_id', user.id)
        .eq('property', property)
        .eq('active', true);

      if (fetchError) throw fetchError;

      if (!trackedKeywords || trackedKeywords.length === 0) {
        return new Response(
          JSON.stringify({ success: true, synced: 0, message: 'No keywords to sync' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📊 Found ${trackedKeywords.length} keywords to sync`);

      // Sync each keyword
      let syncedCount = 0;
      for (const { keyword } of trackedKeywords) {
        try {
          await recordCurrentRanking(supabase, user.id, property, keyword);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Failed to sync keyword: ${keyword}`, error);
          // Continue with other keywords even if one fails
        }
      }

      console.log(`✅ Successfully synced ${syncedCount} out of ${trackedKeywords.length} keywords`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: syncedCount,
          total: trackedKeywords.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('❌ track-keyword ERROR CAUGHT:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    // Try to extract as much info as possible
    let errorMessage = 'Unknown error';
    let errorDetails = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else if (typeof error === 'string') {
      errorMessage = error;
      console.error('String error:', error);
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
      errorDetails = JSON.stringify(error, null, 2);
      console.error('Object error:', JSON.stringify(error, null, 2));
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: errorDetails
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function recordCurrentRanking(supabase: any, userId: string, property: string, keyword: string) {
  try {
    console.log('📞 Calling gsc-query for keyword:', keyword);
    
    // Call GSC to get current ranking
    const { data: gscData, error: gscError } = await supabase.functions.invoke('gsc-query', {
      body: { property, filters: { query: keyword } }
    });

    if (gscError) {
      console.error('❌ GSC query error:', gscError);
      return; // Don't throw, just skip ranking
    }

    console.log('📊 GSC data received:', gscData ? 'Has data' : 'No data');

    if (gscData && gscData.rows && gscData.rows.length > 0) {
      const row = gscData.rows[0];
      console.log('📍 Recording ranking - Position:', row.position, 'Clicks:', row.clicks);
      
      const { error: insertError } = await supabase.from('keyword_rankings').insert({
        user_id: userId,
        property,
        keyword: keyword.toLowerCase(),
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
      });
      
      if (insertError) {
        console.error('❌ Ranking insert error:', insertError);
      } else {
        console.log('✅ Ranking recorded successfully');
      }
    } else {
      console.log('ℹ️ No GSC data found for this keyword');
    }
  } catch (error) {
    console.error('❌ Error in recordCurrentRanking:', error);
    // Don't throw - we still want to track the keyword even if initial ranking fails
  }
}

