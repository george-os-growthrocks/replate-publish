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
  include_seed_keyword: z.boolean().default(true),
  include_serp_info: z.boolean().default(true),
  limit: z.number().int().min(10).max(10000).default(700),
  offset: z.number().int().min(0).default(0),
  filters: z.array(z.any()).optional(),
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
    
    // Make API call
    const response = await client.post(
      "dataforseo_labs/google/keyword_ideas/live",
      {
        keywords: params.keywords,
        location_code: params.location_code,
        language_code: params.language_code,
        include_seed_keyword: params.include_seed_keyword,
        include_serp_info: params.include_serp_info,
        limit: params.limit,
        offset: params.offset,
        ...(params.filters && { filters: params.filters }),
      }
    );
    
    // Extract and return result
    const result: any = client.extractResult(response);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
