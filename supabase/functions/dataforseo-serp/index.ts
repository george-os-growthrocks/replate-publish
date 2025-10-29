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
  keyword: z.string().min(1).max(200),
  location_code: z.number().int().positive().default(2840),
  language_code: z.string().regex(/^[a-z]{2}$/).default("en"),
  device: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
  se: z.string().default("google"),
  se_type: z.string().default("organic"),
  depth: z.number().int().min(1).max(100).default(100),
  enable_ai_overview: z.boolean().default(true),
  enable_ai_mode: z.boolean().default(false),
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
    
    // Try AI Mode first if requested
    if (params.enable_ai_mode) {
      try {
        const aiModeResponse = await client.post(
          "serp/google/ai_mode/live",
          {
            keyword: params.keyword,
            location_code: params.location_code,
            language_code: params.language_code,
            device: params.device,
          }
        );
        
        const aiModeResult = client.extractResult(aiModeResponse);
        return successResponse({
          ...aiModeResult,
          ai_mode_enabled: true,
        });
      } catch (error) {
        console.warn("AI Mode endpoint failed, falling back to regular SERP:", error);
      }
    }
    
    // Regular SERP call
    const response = await client.post(
      `serp/${params.se}/${params.se_type}/live/advanced`,
      {
        keyword: params.keyword,
        location_code: params.location_code,
        language_code: params.language_code,
        device: params.device,
        depth: params.depth,
      }
    );
    
    const result: any = client.extractResult(response);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
