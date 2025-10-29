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
  location_code: z.number().int().positive().default(2840),
  language_code: z.string().regex(/^[a-z]{2}$/).default("en"),
  limit: z.number().int().min(10).max(10000).default(1000),
  offset: z.number().int().min(0).default(0),
  filters: z.array(z.any()).optional(),
  order_by: z.array(z.string()).optional(),
  include_serp_info: z.boolean().default(true),
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
    
    // Make API call to Ranked Keywords endpoint
    const response = await client.post(
      "dataforseo_labs/google/ranked_keywords/live",
      {
        target: params.target,
        location_code: params.location_code,
        language_code: params.language_code,
        limit: params.limit,
        offset: params.offset,
        include_serp_info: params.include_serp_info,
        ...(params.filters && { filters: params.filters }),
        ...(params.order_by && { order_by: params.order_by }),
      }
    );
    
    // Extract result
    const result: any = client.extractResult(response);
    
    // Calculate ranking distribution
    const keywords = result?.items || [];
    const distribution = {
      top_3: keywords.filter((k: any) => k.rank_group === 1).length,
      top_10: keywords.filter((k: any) => k.rank_group <= 3).length,
      top_20: keywords.filter((k: any) => k.rank_group <= 4).length,
      top_50: keywords.filter((k: any) => k.rank_group <= 8).length,
      top_100: keywords.filter((k: any) => k.rank_group <= 10).length,
    };
    
    // Calculate traffic potential
    const estimatedTraffic = keywords.reduce((sum: number, k: any) => {
      const ctr = k.rank_absolute <= 1 ? 0.30 : 
                  k.rank_absolute <= 3 ? 0.15 :
                  k.rank_absolute <= 5 ? 0.08 :
                  k.rank_absolute <= 10 ? 0.05 :
                  k.rank_absolute <= 20 ? 0.02 : 0.01;
      return sum + ((k.search_volume || 0) * ctr);
    }, 0);
    
    // Identify low-hanging fruit (positions 11-20 with high volume)
    const lowHangingFruit = keywords
      .filter((k: any) => k.rank_absolute > 10 && k.rank_absolute <= 20 && (k.search_volume || 0) > 100)
      .sort((a: any, b: any) => (b.search_volume || 0) - (a.search_volume || 0))
      .slice(0, 20);
    
    // Enhanced response
    const enrichedResult = {
      ...result,
      distribution,
      summary: {
        total_keywords: result.total_count || keywords.length,
        estimated_monthly_traffic: Math.round(estimatedTraffic),
        avg_position: keywords.reduce((sum: number, k: any) => sum + (k.rank_absolute || 0), 0) / keywords.length || 0,
        avg_search_volume: keywords.reduce((sum: number, k: any) => sum + (k.search_volume || 0), 0) / keywords.length || 0,
      },
      low_hanging_fruit: lowHangingFruit,
    };
    
    return successResponse(enrichedResult);
  } catch (error) {
    return errorResponse(error);
  }
});
