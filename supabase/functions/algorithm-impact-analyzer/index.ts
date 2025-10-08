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

    const { projectId, updateName, updateDate } = await req.json();

    // Get traffic data before and after update
    const updateDateObj = new Date(updateDate);
    const beforeDate = new Date(updateDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
    const afterDate = new Date(updateDateObj.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all pages for project
    const { data: pages } = await supabase
      .from("pages")
      .select("id, url, traffic")
      .eq("project_id", projectId);

    if (!pages || pages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No pages found for project" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get ranking data before and after
    const { data: beforeRanks } = await supabase
      .from("ranks")
      .select("page_id, keyword, position")
      .in("page_id", pages.map(p => p.id))
      .gte("tracked_at", beforeDate.toISOString())
      .lt("tracked_at", updateDateObj.toISOString());

    const { data: afterRanks } = await supabase
      .from("ranks")
      .select("page_id, keyword, position")
      .in("page_id", pages.map(p => p.id))
      .gt("tracked_at", updateDateObj.toISOString())
      .lte("tracked_at", afterDate.toISOString());

    // Analyze impact
    const analysis = analyzeImpact(pages, beforeRanks || [], afterRanks || []);

    // Determine primary impact areas
    const impactAreas = identifyImpactAreas(analysis);

    // Generate recovery actions
    const recoveryActions = generateRecoveryActions(analysis, impactAreas);

    // Calculate overall impact score
    const impactScore = calculateImpactScore(analysis);

    // Create algorithm impact record
    const { data: impact, error } = await supabase
      .from("algorithm_update_impact")
      .insert({
        project_id: projectId,
        update_name: updateName,
        update_date: updateDate,
        impact_score: impactScore,
        traffic_change_percent: analysis.trafficChangePercent,
        rankings_affected: analysis.rankingsAffected,
        pages_improved: analysis.pagesImproved,
        pages_declined: analysis.pagesDeclined,
        primary_impact_areas: impactAreas,
        affected_keywords: analysis.affectedKeywords.slice(0, 100),
        recovery_actions: recoveryActions,
        recovery_status: impactScore < -20 ? "analyzing" : "monitoring"
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        impact,
        analysis: {
          impactScore,
          summary: `${analysis.pagesImproved} pages improved, ${analysis.pagesDeclined} pages declined`,
          severity: impactScore < -30 ? "high" : impactScore < -15 ? "medium" : "low",
          recommendation: impactScore < -20 ? "Immediate action required" : "Monitor closely"
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

function analyzeImpact(pages: any[], beforeRanks: any[], afterRanks: any[]) {
  let pagesImproved = 0;
  let pagesDeclined = 0;
  let rankingsAffected = 0;
  const affectedKeywords = [];

  // Group rankings by page
  const beforeByPage = groupBy(beforeRanks, "page_id");
  const afterByPage = groupBy(afterRanks, "page_id");

  for (const page of pages) {
    const beforePageRanks = beforeByPage[page.id] || [];
    const afterPageRanks = afterByPage[page.id] || [];

    let pageImproved = false;
    let pageDeclined = false;

    for (const beforeRank of beforePageRanks) {
      const afterRank = afterPageRanks.find(r => r.keyword === beforeRank.keyword);
      if (afterRank) {
        const positionChange = beforeRank.position - afterRank.position;
        if (Math.abs(positionChange) >= 3) {
          rankingsAffected++;
          affectedKeywords.push({
            keyword: beforeRank.keyword,
            beforePosition: beforeRank.position,
            afterPosition: afterRank.position,
            change: positionChange
          });

          if (positionChange > 0) pageImproved = true;
          if (positionChange < 0) pageDeclined = true;
        }
      }
    }

    if (pageImproved) pagesImproved++;
    if (pageDeclined) pagesDeclined++;
  }

  // Calculate traffic change (simplified)
  const trafficChangePercent = ((pagesImproved - pagesDeclined) / pages.length) * 100;

  return {
    pagesImproved,
    pagesDeclined,
    rankingsAffected,
    affectedKeywords,
    trafficChangePercent
  };
}

function identifyImpactAreas(analysis: any) {
  const areas = [];

  if (analysis.pagesDeclined > analysis.pagesImproved * 1.5) {
    areas.push({
      area: "content_quality",
      severity: "high",
      description: "Significant content quality issues detected"
    });
  }

  if (analysis.rankingsAffected > 50) {
    areas.push({
      area: "technical_seo",
      severity: "medium",
      description: "Widespread ranking changes suggest technical issues"
    });
  }

  // Check keyword patterns
  const keywords = analysis.affectedKeywords;
  const avgChange = keywords.reduce((sum: number, k: any) => sum + k.change, 0) / keywords.length;
  
  if (avgChange < -5) {
    areas.push({
      area: "user_experience",
      severity: "high",
      description: "User experience signals may be negatively impacting rankings"
    });
  }

  return areas;
}

function generateRecoveryActions(analysis: any, impactAreas: any[]) {
  const actions = [];

  for (const area of impactAreas) {
    if (area.area === "content_quality") {
      actions.push({
        priority: 1,
        action: "Content Quality Audit",
        description: "Review and improve content quality on affected pages",
        steps: [
          "Identify thin or low-quality content",
          "Add more comprehensive information",
          "Update outdated information",
          "Improve content structure and readability"
        ]
      });
    }

    if (area.area === "technical_seo") {
      actions.push({
        priority: 1,
        action: "Technical SEO Audit",
        description: "Conduct comprehensive technical audit",
        steps: [
          "Check Core Web Vitals",
          "Review crawlability and indexability",
          "Fix broken links and redirects",
          "Optimize site speed"
        ]
      });
    }

    if (area.area === "user_experience") {
      actions.push({
        priority: 2,
        action: "UX Improvements",
        description: "Enhance user experience signals",
        steps: [
          "Improve page load times",
          "Reduce intrusive interstitials",
          "Enhance mobile experience",
          "Improve content accessibility"
        ]
      });
    }
  }

  return actions;
}

function calculateImpactScore(analysis: any) {
  // Score from -100 (very negative) to +100 (very positive)
  const netPageChange = analysis.pagesImproved - analysis.pagesDeclined;
  const totalPages = analysis.pagesImproved + analysis.pagesDeclined || 1;
  
  return Math.round((netPageChange / totalPages) * 100);
}

function groupBy(array: any[], key: string) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}