import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import {
  DataForSEOClient,
  validateRequest,
  successResponse,
  errorResponse,
  handleCORS,
} from "../_shared/dataforseo.ts";

// Request validation schema
const RequestSchema = z.object({
  target: z.string().min(1).max(255),
  keywords: z.array(z.string().min(1).max(200)).min(1).max(100),
  location_code: z.number().int().positive().default(2840),
  language_code: z.string().regex(/^[a-z]{2}$/).default("en"),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  group_by: z.enum(["day", "week", "month"]).default("month"),
});

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Validate request
    const params = await validateRequest(req, RequestSchema) as z.infer<typeof RequestSchema>;
    
    // Initialize DataForSEO client
    const client = new DataForSEOClient();
    
    // Fetch historical rank overview for the target domain
    const response = await client.post(
      "dataforseo_labs/google/historical_rank_overview/live",
      {
        target: params.target,
        location_code: params.location_code,
        language_code: params.language_code,
        date_from: params.date_from,
        date_to: params.date_to,
      }
    );
    
    const result: any = client.extractResult(response);
    
    // Filter for requested keywords
    const keywordLowerSet = new Set(params.keywords.map(k => k.toLowerCase()));
    const filteredMetrics = (result?.metrics || []).filter((metric: any) =>
      keywordLowerSet.has(metric.keyword?.toLowerCase())
    );
    
    // Enrich each keyword with trend analysis
    const enrichedKeywords = filteredMetrics.map((metric: any) => {
      const history = metric.metrics_history || [];
      
      // Calculate trends
      const positions = history.map((h: any) => h.rank_absolute || 100);
      const firstPosition = positions[0] || 100;
      const lastPosition = positions[positions.length - 1] || 100;
      const positionChange = firstPosition - lastPosition;
      
      // Determine trend
      let trend = "stable";
      if (positionChange > 5) trend = "improving";
      else if (positionChange < -5) trend = "declining";
      
      // Detect algorithm impacts (significant position changes > 10 positions)
      const algorithmImpacts = [];
      for (let i = 1; i < history.length; i++) {
        const prevPos = history[i - 1].rank_absolute || 100;
        const currPos = history[i].rank_absolute || 100;
        const change = prevPos - currPos;
        
        if (Math.abs(change) >= 10) {
          algorithmImpacts.push({
            date: history[i].date,
            impact: change > 0 ? `+${change} positions` : `${change} positions`,
            name: inferAlgorithmUpdate(history[i].date),
          });
        }
      }
      
      return {
        keyword: metric.keyword,
        history: history.map((h: any) => ({
          date: h.date,
          position: h.rank_absolute,
          search_volume: h.search_volume,
        })),
        trend,
        position_change: positionChange,
        algorithm_impacts: algorithmImpacts,
        current_position: lastPosition,
        best_position: Math.min(...positions),
        worst_position: Math.max(...positions),
      };
    });
    
    // Sort by position change (most improved first)
    enrichedKeywords.sort((a: any, b: any) => b.position_change - a.position_change);
    
    // Calculate summary statistics
    const improving = enrichedKeywords.filter((k: any) => k.trend === "improving").length;
    const declining = enrichedKeywords.filter((k: any) => k.trend === "declining").length;
    const stable = enrichedKeywords.filter((k: any) => k.trend === "stable").length;
    
    const avgPositionChange = enrichedKeywords.reduce((sum: number, k: any) => 
      sum + k.position_change, 0
    ) / enrichedKeywords.length || 0;
    
    const enrichedResult = {
      target: params.target,
      period: {
        from: params.date_from,
        to: params.date_to,
        group_by: params.group_by,
      },
      summary: {
        total_keywords: enrichedKeywords.length,
        improving,
        declining,
        stable,
        avg_position_change: Math.round(avgPositionChange * 10) / 10,
        overall_trend: improving > declining ? "positive" : declining > improving ? "negative" : "stable",
      },
      keywords: enrichedKeywords,
    };
    
    return successResponse(enrichedResult);
  } catch (error) {
    return errorResponse(error);
  }
});

// Infer potential algorithm update based on date
function inferAlgorithmUpdate(date: string): string {
  const updateDates: Record<string, string> = {
    "2024-03": "March 2024 Core Update",
    "2024-11": "November 2024 Core Update",
    "2025-03": "March 2025 Core Update (estimated)",
  };
  
  const monthKey = date.substring(0, 7);
  return updateDates[monthKey] || "Potential Algorithm Update";
}
