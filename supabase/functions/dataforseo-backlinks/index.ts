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
  mode: z.enum(["as_is", "one_per_domain", "one_per_anchor"]).default("as_is"),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  filters: z.array(z.any()).optional(),
  order_by: z.array(z.string()).optional(),
  backlinks_status_type: z.enum(["all", "live", "lost"]).default("live"),
  include_subdomains: z.boolean().default(true),
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
    
    // Build request payload
    const payload: any = {
      target: params.target,
      mode: params.mode,
      limit: params.limit,
      offset: params.offset,
      backlinks_status_type: params.backlinks_status_type,
      include_subdomains: params.include_subdomains,
    };

    if (params.filters) {
      payload.filters = params.filters;
    }

    if (params.order_by) {
      payload.order_by = params.order_by;
    }
    
    // Make API call
    const response = await client.post(
      "backlinks/backlinks/live",
      payload
    );
    
    const result: any = client.extractResult(response);
    
    // Enrich with analysis
    if (result?.items) {
      const enrichedResult = {
        ...result,
        summary: {
          total_backlinks: result.items.length,
          total_referring_domains: new Set(result.items.map((item: any) => item.domain_from)).size,
          dofollow_count: result.items.filter((item: any) => item.dofollow).length,
          nofollow_count: result.items.filter((item: any) => !item.dofollow).length,
          avg_rank: result.items.reduce((sum: number, item: any) => sum + (item.rank || 0), 0) / result.items.length,
        },
      };
      
      return successResponse(enrichedResult);
    }
    
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
