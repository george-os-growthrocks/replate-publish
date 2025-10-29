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
  keywords: z.array(z.string().min(1).max(200)).min(1).max(100),
  location_code: z.number().int().positive().default(2840),
  language_code: z.string().regex(/^[a-z]{2}$/).default("en"),
  device: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
  include_ai_mode: z.boolean().default(true),
  track_changes: z.boolean().default(false),
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
    
    // Fetch SERP data for all keywords
    const serpPromises = params.keywords.map(keyword =>
      client.post(
        "serp/google/organic/live/advanced",
        {
          keyword,
          location_code: params.location_code,
          language_code: params.language_code,
          device: params.device,
        }
      )
    );
    
    const serpResponses = await Promise.all(serpPromises);
    
    // Analyze each SERP for AI Overview presence
    const keywordAnalysis = serpResponses.map((response, index) => {
      const result: any = client.extractResult(response);
      const items = result?.items || [];
      
      // Check for AI Overview
      const aiOverview = items.find((item: any) => 
        item.type === "ai_overview" || 
        item.type === "ai_mode" ||
        item.type === "featured_snippet_ai"
      );
      
      // Check for regular organic results
      const organicResults = items.filter((item: any) => item.type === "organic");
      
      // Find position shift if AI Overview is present
      let organicPositionShift = 0;
      if (aiOverview) {
        const firstOrganicPosition = organicResults[0]?.rank_absolute || 0;
        organicPositionShift = firstOrganicPosition - 1; // How many positions pushed down
      }
      
      // Extract cited sources from AI Overview
      const citedSources = aiOverview?.links?.map((link: any) => link.url) || [];
      
      return {
        keyword: params.keywords[index],
        has_ai_overview: !!aiOverview,
        has_ai_mode: aiOverview?.type === "ai_mode",
        ai_overview_content: aiOverview?.description || null,
        cited_sources: citedSources,
        organic_position_shift: organicPositionShift,
        total_organic_results: organicResults.length,
        search_volume: null, // Will be enriched if needed
      };
    });
    
    // Calculate summary statistics
    const withAiOverview = keywordAnalysis.filter(k => k.has_ai_overview).length;
    const withAiMode = keywordAnalysis.filter(k => k.has_ai_mode).length;
    
    // Calculate average CTR drop (estimated)
    const avgCtrDrop = withAiOverview > 0 ? 15.3 : 0; // Industry average ~15% CTR drop
    
    // Optionally fetch search volumes for traffic analysis
    let enrichedAnalysis = keywordAnalysis;
    if (params.track_changes) {
      try {
        const volumeResponse = await client.post(
          "keywords_data/google_ads/search_volume/live",
          {
            keywords: params.keywords,
            location_code: params.location_code,
            language_code: params.language_code,
          }
        );
        
        const volumeData: any = client.extractResult(volumeResponse);
        const volumeMap = new Map(
          (volumeData?.items || []).map((item: any) => [
            item.keyword,
            item.search_volume
          ])
        );
        
        enrichedAnalysis = keywordAnalysis.map(k => ({
          ...k,
          search_volume: volumeMap.get(k.keyword) || 0,
        }));
      } catch (error) {
        console.error("Failed to fetch search volumes:", error);
      }
    }
    
    // Calculate traffic at risk
    const totalVolume = enrichedAnalysis.reduce((sum, k) => sum + (k.search_volume || 0), 0);
    const trafficAtRisk = Math.round(totalVolume * (withAiOverview / params.keywords.length) * (avgCtrDrop / 100));
    
    const result = {
      summary: {
        total_keywords: params.keywords.length,
        with_ai_overview: withAiOverview,
        with_ai_mode: withAiMode,
        percentage_ai: Math.round((withAiOverview / params.keywords.length) * 100 * 10) / 10,
        trend: "unknown", // Would need historical data to determine
      },
      by_keyword: enrichedAnalysis,
      impact_analysis: {
        avg_ctr_drop: avgCtrDrop,
        traffic_at_risk: trafficAtRisk,
        keywords_affected: withAiOverview,
      },
      recommendations: generateRecommendations(enrichedAnalysis),
    };
    
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});

// Generate actionable recommendations based on AI Overview analysis
function generateRecommendations(analysis: any[]): string[] {
  const recommendations: string[] = [];
  
  const aiOverviewCount = analysis.filter(k => k.has_ai_overview).length;
  const totalKeywords = analysis.length;
  const aiPercentage = (aiOverviewCount / totalKeywords) * 100;
  
  if (aiPercentage > 50) {
    recommendations.push("High AI Overview presence detected. Focus on creating authoritative, cited content.");
    recommendations.push("Build topical authority to increase chances of being cited in AI Overviews.");
  }
  
  if (aiPercentage > 0 && aiPercentage <= 25) {
    recommendations.push("Moderate AI Overview impact. Monitor these keywords for changes.");
  }
  
  // Check if any keywords have user cited in AI Overview
  const citedKeywords = analysis.filter(k => 
    k.cited_sources?.some((url: string) => url.includes("yoursite.com"))
  );
  
  if (citedKeywords.length > 0) {
    recommendations.push(`Great! You're cited in ${citedKeywords.length} AI Overview(s). Maintain content quality.`);
  }
  
  // Identify AI-resistant keywords
  const noAiKeywords = analysis.filter(k => !k.has_ai_overview);
  if (noAiKeywords.length > 0) {
    recommendations.push(`${noAiKeywords.length} keywords show no AI Overview. These may be safer targets.`);
  }
  
  recommendations.push("Continue monitoring AI Overview trends monthly to adapt strategy.");
  
  return recommendations;
}
