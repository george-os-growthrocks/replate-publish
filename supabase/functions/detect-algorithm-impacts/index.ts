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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { property, days = 90 } = await req.json();

    console.log(`Detecting algorithm impacts for ${property} over last ${days} days`);

    // Get Google algorithm updates in date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: updates, error: updatesError } = await supabase
      .from('google_algorithm_updates')
      .select('*')
      .gte('update_date', startDate.toISOString().split('T')[0])
      .order('update_date', { ascending: false });

    if (updatesError) throw updatesError;

    console.log(`Found ${updates?.length || 0} algorithm updates in range`);

    // Get user's GSC data for the period
    const { data: gscData } = await supabase.functions.invoke('gsc-query', {
      body: {
        property,
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['query', 'date']
      }
    });

    if (!gscData || !gscData.rows) {
      return new Response(
        JSON.stringify({ success: true, impacts: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze each algorithm update
    const impacts = [];

    for (const update of updates || []) {
      const impact = await analyzeUpdateImpact(gscData.rows, update);
      
      if (impact && impact.affectedKeywords.length >= 3) {
        // Significant impact detected
        impacts.push({
          ...impact,
          algorithmUpdate: update
        });

        // Save to database
        const { error: insertError } = await supabase
          .from('algorithm_impacts')
          .upsert({
            user_id: user.id,
            property,
            algorithm_update_id: update.id,
            avg_position_drop: impact.avgDrop,
            affected_keywords: impact.affectedKeywords,
            estimated_traffic_loss: impact.trafficLoss,
            severity: impact.severity,
            diagnosis: impact.diagnosis,
            recovery_actions: impact.actions,
          }, {
            onConflict: 'user_id,property,algorithm_update_id'
          });

        if (insertError) {
          console.error('Error saving impact:', insertError);
        }

        // Create notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'algorithm_impact',
          title: `${update.name} Impact Detected`,
          message: `${impact.affectedKeywords.length} keywords affected with avg drop of ${impact.avgDrop.toFixed(1)} positions`,
          data: {
            algorithm_update_id: update.id,
            severity: impact.severity,
            traffic_loss: impact.trafficLoss
          }
        });
      }
    }

    console.log(`Detected ${impacts.length} significant algorithm impacts`);

    return new Response(
      JSON.stringify({ success: true, impacts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeUpdateImpact(gscRows: any[], update: any) {
  const updateDate = new Date(update.update_date);
  const beforeStart = new Date(updateDate);
  beforeStart.setDate(beforeStart.getDate() - 14); // 2 weeks before
  const afterEnd = new Date(updateDate);
  afterEnd.setDate(afterEnd.getDate() + 14); // 2 weeks after

  // Group by keyword
  const keywordData = new Map();

  for (const row of gscRows) {
    const date = new Date(row.keys[1]); // Assuming date is second dimension
    const keyword = row.keys[0]; // Assuming query is first dimension

    if (!keywordData.has(keyword)) {
      keywordData.set(keyword, { before: [], after: [] });
    }

    if (date >= beforeStart && date < updateDate) {
      keywordData.get(keyword).before.push(row.position);
    } else if (date > updateDate && date <= afterEnd) {
      keywordData.get(keyword).after.push(row.position);
    }
  }

  // Calculate position changes
  const affectedKeywords = [];
  let totalDrop = 0;
  let totalTrafficLoss = 0;

  for (const [keyword, data] of keywordData.entries()) {
    if (data.before.length === 0 || data.after.length === 0) continue;

    const avgBefore = data.before.reduce((a, b) => a + b, 0) / data.before.length;
    const avgAfter = data.after.reduce((a, b) => a + b, 0) / data.after.length;
    const drop = avgAfter - avgBefore;

    if (drop > 3) { // Significant drop
      affectedKeywords.push(keyword);
      totalDrop += drop;

      // Estimate traffic loss (simplified)
      const clicksBefore = gscRows.find(r => r.keys[0] === keyword && new Date(r.keys[1]) < updateDate)?.clicks || 0;
      const clicksAfter = gscRows.find(r => r.keys[0] === keyword && new Date(r.keys[1]) > updateDate)?.clicks || 0;
      totalTrafficLoss += Math.max(0, clicksBefore - clicksAfter);
    }
  }

  if (affectedKeywords.length < 3) {
    return null; // Not significant enough
  }

  const avgDrop = totalDrop / affectedKeywords.length;
  
  // Determine severity
  let severity = 'low';
  if (avgDrop > 15 || affectedKeywords.length > 20) severity = 'severe';
  else if (avgDrop > 10 || affectedKeywords.length > 10) severity = 'high';
  else if (avgDrop > 5 || affectedKeywords.length > 5) severity = 'moderate';

  return {
    avgDrop,
    affectedKeywords,
    trafficLoss: totalTrafficLoss,
    severity,
    diagnosis: generateDiagnosis(update, affectedKeywords.length, avgDrop),
    actions: generateRecoveryActions(update.category, severity)
  };
}

function generateDiagnosis(update: any, keywordCount: number, avgDrop: number): string {
  return `Detected significant ranking drops following ${update.name}. ${keywordCount} keywords lost an average of ${avgDrop.toFixed(1)} positions. ${update.description}`;
}

function generateRecoveryActions(category: string, severity: string) {
  const actions = [];

  if (category === 'core' || category === 'helpful-content') {
    actions.push({
      title: 'Enhance Content Depth & Quality',
      description: 'Add 500-1000 words of original, expert analysis to affected pages. Include data, case studies, and unique insights that demonstrate E-E-A-T.',
      priority: severity === 'severe' || severity === 'high' ? 'high' : 'medium',
      effort: 'medium'
    });

    actions.push({
      title: 'Improve E-E-A-T Signals',
      description: 'Add author bios with credentials, citations to authoritative sources, and demonstrate real expertise and experience.',
      priority: 'high',
      effort: 'low'
    });

    actions.push({
      title: 'Remove Thin or Duplicate Content',
      description: 'Audit pages under 300 words or with high similarity. Consolidate, expand, or noindex low-value pages.',
      priority: 'medium',
      effort: 'medium'
    });
  }

  if (category === 'spam') {
    actions.push({
      title: 'Audit Backlink Profile',
      description: 'Review backlinks for spammy or low-quality links. Disavow toxic links using Google Search Console.',
      priority: 'high',
      effort: 'medium'
    });

    actions.push({
      title: 'Check for Hacked Content',
      description: 'Scan site for injected spam content, hidden links, or compromised pages. Update security if needed.',
      priority: 'high',
      effort: 'low'
    });
  }

  if (category === 'reviews') {
    actions.push({
      title: 'Add First-Hand Experience',
      description: 'Include photos, videos, or detailed observations from actually using the product. Demonstrate expertise.',
      priority: 'high',
      effort: 'medium'
    });

    actions.push({
      title: 'Reduce Affiliate Link Density',
      description: 'Lower affiliate link percentage to under 3%. Focus on providing value before monetization.',
      priority: 'medium',
      effort: 'low'
    });
  }

  return actions;
}

