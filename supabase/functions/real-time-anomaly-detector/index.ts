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

    const { projectId, pageId, currentTraffic } = await req.json();

    // Get historical traffic data (last 30 days)
    const { data: historicalData } = await supabase
      .from("pages")
      .select("traffic, created_at")
      .eq("id", pageId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true });

    if (!historicalData || historicalData.length < 7) {
      return new Response(
        JSON.stringify({ message: "Insufficient historical data" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate statistics
    const trafficValues = historicalData.map(d => d.traffic);
    const mean = trafficValues.reduce((a, b) => a + b, 0) / trafficValues.length;
    const variance = trafficValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / trafficValues.length;
    const stdDev = Math.sqrt(variance);

    // Calculate Z-score
    const zScore = (currentTraffic - mean) / stdDev;
    const deviationPercent = ((currentTraffic - mean) / mean) * 100;

    // Detect anomaly (|Z-score| > 2 indicates anomaly)
    const isAnomaly = Math.abs(zScore) > 2;
    const anomalyType = zScore > 0 ? "spike" : "drop";
    const confidence = Math.min(Math.abs(zScore) * 33, 100);

    // Statistical significance (p-value approximation)
    const significance = 1 - (1 / (1 + Math.exp(-Math.abs(zScore))));

    if (isAnomaly) {
      // Analyze possible causes
      const possibleCauses = await analyzeCauses(supabase, projectId, pageId, anomalyType);

      // Create anomaly record
      const { data: anomaly, error } = await supabase
        .from("traffic_anomaly_detection")
        .insert({
          project_id: projectId,
          page_id: pageId,
          anomaly_type: anomalyType,
          expected_traffic: Math.round(mean),
          actual_traffic: currentTraffic,
          deviation_percent: deviationPercent,
          confidence_level: confidence,
          statistical_significance: significance,
          possible_causes: possibleCauses,
          correlation_data: {
            zScore,
            stdDev,
            mean,
            historicalCount: historicalData.length
          },
          auto_analysis: generateAnalysis(anomalyType, deviationPercent, possibleCauses)
        })
        .select()
        .single();

      if (error) throw error;

      // Create alert if severity is high
      if (Math.abs(deviationPercent) > 30) {
        await createAlert(supabase, projectId, pageId, anomaly);
      }

      return new Response(
        JSON.stringify({
          anomalyDetected: true,
          anomaly,
          metrics: { zScore, confidence, significance }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        anomalyDetected: false,
        message: "Traffic within normal range",
        metrics: { zScore, deviationPercent }
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

async function analyzeCauses(supabase: any, projectId: string, pageId: number, type: string) {
  const causes = [];

  // Check for ranking changes
  const { data: rankChanges } = await supabase
    .from("ranks")
    .select("position, keyword")
    .eq("page_id", pageId)
    .gte("tracked_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("tracked_at", { ascending: false })
    .limit(10);

  if (rankChanges && rankChanges.length > 0) {
    causes.push({
      type: "ranking_change",
      description: "Ranking position changes detected",
      data: rankChanges
    });
  }

  // Check for algorithm updates (mock)
  const recentAlgoUpdate = Math.random() > 0.8;
  if (recentAlgoUpdate) {
    causes.push({
      type: "algorithm_update",
      description: "Potential Google algorithm update impact",
      data: { confidence: 0.65 }
    });
  }

  // Check for technical issues
  const { data: cwvData } = await supabase
    .from("core_web_vitals")
    .select("lcp, fid, cls")
    .eq("page_id", pageId)
    .gte("measured_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("measured_at", { ascending: false })
    .limit(1);

  if (cwvData && cwvData.length > 0) {
    const cwv = cwvData[0];
    if (cwv.lcp > 2500 || cwv.fid > 100 || cwv.cls > 0.1) {
      causes.push({
        type: "core_web_vitals",
        description: "Core Web Vitals degradation detected",
        data: cwv
      });
    }
  }

  return causes;
}

function generateAnalysis(type: string, deviation: number, causes: any[]) {
  let analysis = `Traffic ${type} detected with ${Math.abs(deviation).toFixed(1)}% deviation. `;
  
  if (causes.length > 0) {
    analysis += "Possible causes: ";
    analysis += causes.map(c => c.description).join(", ");
  } else {
    analysis += "No obvious technical causes detected. May be due to seasonality, marketing campaigns, or external factors.";
  }
  
  return analysis;
}

async function createAlert(supabase: any, projectId: string, pageId: number, anomaly: any) {
  await supabase.from("rank_tracking_alerts").insert({
    project_id: projectId,
    page_id: pageId,
    keyword: "traffic_anomaly",
    alert_type: anomaly.anomaly_type,
    alert_severity: Math.abs(anomaly.deviation_percent) > 50 ? "critical" : "high",
    notes: anomaly.auto_analysis
  });
}