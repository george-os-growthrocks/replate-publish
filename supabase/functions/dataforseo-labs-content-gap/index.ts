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
  competitors: z.array(z.string().min(1).max(255)).min(1).max(20),
  location_code: z.number().int().positive().default(2840),
  language_code: z.string().regex(/^[a-z]{2}$/).default("en"),
  intersection_mode: z.enum(["all_competitors", "any_competitor"]).default("all_competitors"),
  limit: z.number().int().min(10).max(10000).default(1000),
  offset: z.number().int().min(0).default(0),
  filters: z.array(z.any()).optional(),
  include_clickstream_data: z.boolean().default(true),
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
    
    // Make API call to Content Gap endpoint
    const response = await client.post(
      "dataforseo_labs/google/keywords_for_keywords/live",
      {
        keywords: params.competitors,
        location_code: params.location_code,
        language_code: params.language_code,
        limit: params.limit,
        offset: params.offset,
        include_clickstream_data: params.include_clickstream_data,
        ...(params.filters && { filters: params.filters }),
      }
    );
    
    // Extract result
    const competitorKeywords = client.extractResult(response);
    
    // Get target site keywords
    const targetResponse = await client.post(
      "dataforseo_labs/google/ranked_keywords/live",
      {
        target: params.target,
        location_code: params.location_code,
        language_code: params.language_code,
        limit: 10000,
      }
    );
    
    const targetKeywords = client.extractResult(targetResponse);
    
    // Calculate gaps (keywords competitors rank for but target doesn't)
    const targetKeywordSet = new Set(
      (targetKeywords as any)?.items?.map((item: any) => item.keyword.toLowerCase()) || []
    );
    
    const gapKeywords = (competitorKeywords as any)?.items?.filter((item: any) => {
      return !targetKeywordSet.has(item.keyword?.toLowerCase());
    }) || [];
    
    // Enrich with opportunity scores
    const enrichedGaps = gapKeywords.map((item: any) => {
      // Calculate opportunity score (0-10)
      // Higher volume + lower difficulty = better opportunity
      const volumeScore = Math.min((item.search_volume || 0) / 1000, 5);
      const difficultyScore = item.keyword_difficulty ? (100 - item.keyword_difficulty) / 20 : 2.5;
      const opportunityScore = Math.min(volumeScore + difficultyScore, 10);
      
      return {
        ...item,
        opportunity_score: Math.round(opportunityScore * 10) / 10,
        gap_type: params.intersection_mode,
      };
    });
    
    // Sort by opportunity score
    enrichedGaps.sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);
    
    const result = {
      target: params.target,
      competitors: params.competitors,
      total_gap_keywords: enrichedGaps.length,
      gap_keywords: enrichedGaps.slice(0, params.limit),
      summary: {
        avg_search_volume: enrichedGaps.reduce((sum: number, k: any) => sum + (k.search_volume || 0), 0) / enrichedGaps.length || 0,
        avg_difficulty: enrichedGaps.reduce((sum: number, k: any) => sum + (k.keyword_difficulty || 0), 0) / enrichedGaps.length || 0,
        high_opportunity_count: enrichedGaps.filter((k: any) => k.opportunity_score >= 7).length,
      },
    };
    
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
