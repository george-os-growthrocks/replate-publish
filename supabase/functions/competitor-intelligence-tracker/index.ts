import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { projectId, competitorDomain, keywords } = await req.json();

    const alerts = [];
    const movements = [];

    // Get our current rankings
    const { data: ourRankings } = await supabase
      .from("ranks")
      .select("keyword, position")
      .eq("project_id", projectId)
      .in("keyword", keywords);

    // Simulate competitor data fetching (in production, use DataForSEO)
    for (const keyword of keywords) {
      const competitorPos = Math.floor(Math.random() * 20) + 1;
      const previousPos = Math.floor(Math.random() * 20) + 1;
      const ourPos = ourRankings?.find(r => r.keyword === keyword)?.position || 50;
      const ourPreviousPos = ourPos + (Math.random() > 0.5 ? 1 : -1);

      // Detect significant movements
      const positionChange = previousPos - competitorPos;
      
      if (Math.abs(positionChange) >= 3) {
        let movementType = "";
        let priority = "medium";

        if (competitorPos <= 10 && previousPos > 10) {
          movementType = "entered_top_10";
          priority = "high";
        } else if (competitorPos > 10 && previousPos <= 10) {
          movementType = "left_top_10";
          priority = "medium";
        } else if (competitorPos < ourPos && previousPos >= ourPos) {
          movementType = "overtook_us";
          priority = "high";
        } else if (competitorPos > ourPos && previousPos <= ourPos) {
          movementType = "we_overtook";
          priority = "low";
        }

        if (movementType) {
          const recommendedActions = generateRecommendations(movementType, competitorPos, ourPos);

          const { data: alert } = await supabase
            .from("competitor_movement_alerts")
            .insert({
              project_id: projectId,
              competitor_domain: competitorDomain,
              keyword,
              movement_type: movementType,
              previous_position: previousPos,
              current_position: competitorPos,
              our_previous_position: ourPreviousPos,
              our_current_position: ourPos,
              position_gap: Math.abs(competitorPos - ourPos),
              content_changes_detected: {
                wordCountChange: Math.floor(Math.random() * 500),
                newSections: Math.floor(Math.random() * 3),
                updatedDate: new Date().toISOString()
              },
              backlink_changes: Math.floor(Math.random() * 20) - 10,
              estimated_traffic_impact: calculateTrafficImpact(positionChange),
              recommended_actions: recommendedActions,
              priority
            })
            .select()
            .single();

          if (alert) {
            alerts.push(alert);
          }
        }
      }

      movements.push({
        keyword,
        competitorPosition: competitorPos,
        previousPosition: previousPos,
        change: positionChange,
        ourPosition: ourPos
      });
    }

    // Check for SERP feature changes
    const serpChanges = await checkSERPFeatures(supabase, projectId, keywords);

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated: alerts.length,
        alerts,
        movements,
        serpChanges,
        summary: {
          totalKeywords: keywords.length,
          significantMovements: alerts.length,
          highPriorityAlerts: alerts.filter(a => a.priority === "high").length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateRecommendations(movementType: string, compPos: number, ourPos: number) {
  const recommendations = [];

  if (movementType === "overtook_us") {
    recommendations.push({
      action: "content_audit",
      description: "Perform content audit to identify gaps",
      priority: "high"
    });
    recommendations.push({
      action: "backlink_analysis",
      description: "Analyze competitor's recent backlink gains",
      priority: "high"
    });
    recommendations.push({
      action: "technical_check",
      description: "Check for technical SEO issues",
      priority: "medium"
    });
  } else if (movementType === "entered_top_10") {
    recommendations.push({
      action: "competitor_content_analysis",
      description: "Deep dive into competitor's content strategy",
      priority: "high"
    });
    recommendations.push({
      action: "content_refresh",
      description: "Update and expand your content",
      priority: "high"
    });
  }

  return recommendations;
}

function calculateTrafficImpact(positionChange: number) {
  // Approximate CTR changes based on position
  const ctrMap: { [key: number]: number } = {
    1: 31.7, 2: 24.7, 3: 18.7, 4: 13.6, 5: 9.5,
    6: 6.7, 7: 4.8, 8: 3.5, 9: 2.6, 10: 2.0
  };

  return Math.abs(positionChange) * 100;
}

async function checkSERPFeatures(supabase: any, projectId: string, keywords: string[]) {
  const changes = [];

  for (const keyword of keywords.slice(0, 5)) {
    // Simulate SERP feature detection
    if (Math.random() > 0.7) {
      const featureTypes = ["featured_snippet", "people_also_ask", "local_pack", "images"];
      const changeTypes = ["appeared", "disappeared", "owner_changed"];
      
      const featureType = featureTypes[Math.floor(Math.random() * featureTypes.length)];
      const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];

      const { data } = await supabase
        .from("serp_feature_changes")
        .insert({
          project_id: projectId,
          keyword,
          feature_type: featureType,
          change_type: changeType,
          our_opportunity: changeType === "appeared" || changeType === "disappeared",
          opportunity_score: Math.random() * 100,
          content_requirements: {
            format: featureType === "featured_snippet" ? "concise_answer" : "comprehensive",
            wordCount: featureType === "featured_snippet" ? 50 : 300
          },
          estimated_traffic_value: Math.floor(Math.random() * 500),
          action_plan: `Optimize content for ${featureType} acquisition`
        })
        .select()
        .single();

      if (data) changes.push(data);
    }
  }

  return changes;
}