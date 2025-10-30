import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SavePropertyRequest {
  project_id: string;
  site_url: string;
  permission_level?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💾 GSC Save Property - Saving GSC property to project');

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    
    if (userError || !user) {
      console.error('❌ Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body: SavePropertyRequest = await req.json();
    const { project_id, site_url, permission_level } = body;

    if (!project_id || !site_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: project_id and site_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Saving property:', { project_id, site_url, permission_level });

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user owns the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error('❌ Project not found or unauthorized:', projectError);
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark all other properties as not selected for this project
    console.log('🔄 Deselecting other properties for project...');
    const { error: deselectError } = await supabaseAdmin
      .from('gsc_properties')
      .update({ selected: false })
      .eq('project_id', project_id);

    if (deselectError) {
      console.error('⚠️ Warning: Failed to deselect other properties:', deselectError);
      // Continue anyway
    }

    // Upsert the selected property
    console.log('💾 Upserting selected property...');
    const { data: savedProperty, error: upsertError } = await supabaseAdmin
      .from('gsc_properties')
      .upsert({
        user_id: user.id,
        project_id,
        site_url,
        permission_level: permission_level ?? 'full',
        verified: true,
        selected: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,site_url',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('❌ Failed to save property:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save property', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Property saved:', savedProperty);

    // Update project.gsc_connected = true
    console.log('🔄 Updating project gsc_connected status...');
    const { error: updateProjectError } = await supabaseAdmin
      .from('projects')
      .update({ 
        gsc_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id);

    if (updateProjectError) {
      console.error('⚠️ Warning: Failed to update project gsc_connected:', updateProjectError);
      // Don't fail - property is saved, just log the warning
    } else {
      console.log('✅ Project gsc_connected updated');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        property: savedProperty,
        message: 'GSC property successfully connected to project'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in gsc-save-property:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to save GSC property'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

