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

    const { projectId, pageId, url, metrics } = await req.json();

    // Validate metrics
    if (!metrics || !metrics.lcp || !metrics.fid || !metrics.cls) {
      return new Response(
        JSON.stringify({ error: "Missing required metrics (lcp, fid, cls)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate performance scores
    const lcpScore = calculateLCPScore(metrics.lcp);
    const fidScore = calculateFIDScore(metrics.fid);
    const clsScore = calculateCLSScore(metrics.cls);
    const overallScore = Math.round((lcpScore + fidScore + clsScore) / 3);

    // Calculate pass rate (percentage of good scores)
    const goodScores = [lcpScore === 100, fidScore === 100, clsScore === 100].filter(Boolean).length;
    const passRate = (goodScores / 3) * 100;

    // Determine device type and connection
    const deviceType = metrics.deviceType || "desktop";
    const connectionType = metrics.connectionType || "4g";
    const geoLocation = metrics.geoLocation || "us";
    const browser = metrics.browser || "chrome";

    // Store metrics
    const { data: cwvRecord, error: insertError } = await supabase
      .from("core_web_vitals")
      .insert({
        project_id: projectId,
        page_id: pageId,
        url,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        fcp: metrics.fcp || null,
        ttfb: metrics.ttfb || null,
        inp: metrics.inp || null,
        device_type: deviceType,
        connection_type: connectionType,
        geo_location: geoLocation,
        browser,
        pass_rate: passRate,
        performance_score: overallScore
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Check for degradation
    const { data: recentMetrics } = await supabase
      .from("core_web_vitals")
      .select("lcp, fid, cls, performance_score, measured_at")
      .eq("page_id", pageId)
      .eq("device_type", deviceType)
      .gte("measured_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("measured_at", { ascending: false })
      .limit(20);

    let degradationDetected = false;
    let degradationDetails = null;

    if (recentMetrics && recentMetrics.length >= 5) {
      const avgPrevScore = recentMetrics.slice(1, 6)
        .reduce((sum, m) => sum + m.performance_score, 0) / 5;
      
      if (overallScore < avgPrevScore - 10) {
        degradationDetected = true;
        degradationDetails = {
          currentScore: overallScore,
          previousAvg: Math.round(avgPrevScore),
          scoreDrop: Math.round(avgPrevScore - overallScore),
          affectedMetrics: [
            metrics.lcp > 2500 ? "LCP" : null,
            metrics.fid > 100 ? "FID" : null,
            metrics.cls > 0.1 ? "CLS" : null
          ].filter(Boolean)
        };

        // Create alert
        await supabase.from("rank_tracking_alerts").insert({
          project_id: projectId,
          page_id: pageId,
          keyword: "core_web_vitals",
          alert_type: "drop",
          alert_severity: degradationDetails.scoreDrop > 20 ? "critical" : "high",
          notes: `Core Web Vitals degradation detected: ${degradationDetails.affectedMetrics.join(", ")} failing. Score dropped from ${degradationDetails.previousAvg} to ${degradationDetails.currentScore}.`
        });
      }
    }

    // Generate recommendations
    const recommendations = generateRecommendations(metrics, lcpScore, fidScore, clsScore);

    return new Response(
      JSON.stringify({
        success: true,
        record: cwvRecord,
        scores: {
          lcp: { value: metrics.lcp, score: lcpScore, status: getStatus(lcpScore) },
          fid: { value: metrics.fid, score: fidScore, status: getStatus(fidScore) },
          cls: { value: metrics.cls, score: clsScore, status: getStatus(clsScore) },
          overall: overallScore,
          passRate
        },
        degradationDetected,
        degradationDetails,
        recommendations,
        trend: recentMetrics ? {
          dataPoints: recentMetrics.length,
          avgScore: Math.round(recentMetrics.reduce((sum, m) => sum + m.performance_score, 0) / recentMetrics.length),
          improving: recentMetrics.length >= 3 && overallScore > recentMetrics[1].performance_score
        } : null
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

function calculateLCPScore(lcp: number): number {
  if (lcp <= 2500) return 100;
  if (lcp <= 4000) return 50;
  return 0;
}

function calculateFIDScore(fid: number): number {
  if (fid <= 100) return 100;
  if (fid <= 300) return 50;
  return 0;
}

function calculateCLSScore(cls: number): number {
  if (cls <= 0.1) return 100;
  if (cls <= 0.25) return 50;
  return 0;
}

function getStatus(score: number): string {
  if (score === 100) return "good";
  if (score === 50) return "needs_improvement";
  return "poor";
}

function generateRecommendations(metrics: any, lcpScore: number, fidScore: number, clsScore: number) {
  const recommendations = [];

  if (lcpScore < 100) {
    recommendations.push({
      metric: "LCP",
      priority: lcpScore === 0 ? "critical" : "high",
      issue: `Largest Contentful Paint is ${metrics.lcp}ms (target: <2500ms)`,
      fixes: [
        "Optimize and compress images",
        "Implement lazy loading for below-fold images",
        "Use a CDN for static assets",
        "Remove render-blocking resources",
        "Improve server response times"
      ]
    });
  }

  if (fidScore < 100) {
    recommendations.push({
      metric: "FID",
      priority: fidScore === 0 ? "critical" : "high",
      issue: `First Input Delay is ${metrics.fid}ms (target: <100ms)`,
      fixes: [
        "Break up long JavaScript tasks",
        "Reduce JavaScript execution time",
        "Minimize main thread work",
        "Use web workers for heavy computations",
        "Remove unused JavaScript"
      ]
    });
  }

  if (clsScore < 100) {
    recommendations.push({
      metric: "CLS",
      priority: clsScore === 0 ? "critical" : "high",
      issue: `Cumulative Layout Shift is ${metrics.cls} (target: <0.1)`,
      fixes: [
        "Add width and height attributes to images and videos",
        "Reserve space for ad slots",
        "Avoid inserting content above existing content",
        "Use CSS aspect-ratio for dynamic content",
        "Preload fonts to avoid FOIT/FOUT"
      ]
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      metric: "All",
      priority: "low",
      issue: "All Core Web Vitals are in good range",
      fixes: [
        "Continue monitoring for regressions",
        "Consider further optimizations for even better performance"
      ]
    });
  }

  return recommendations;
}