import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import {
  DataForSEOClient,
  validateRequest,
  successResponse,
  errorResponse,
  handleCORS,
} from "../_shared/dataforseo.ts";

const RequestSchema = z.object({
  keyword: z.string().min(1).max(200),
  location_code: z.number().int().positive().default(2840),
  language_code: z.string().regex(/^[a-z]{2}$/).default("en"),
  include_serp_info: z.boolean().default(true),
  include_clickstream_data: z.boolean().default(true),
});

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const params = await validateRequest(req, RequestSchema) as z.infer<typeof RequestSchema>;
    const client = new DataForSEOClient();
    
    const response = await client.post(
      "dataforseo_labs/google/keyword_overview/live",
      {
        keyword: params.keyword,
        location_code: params.location_code,
        language_code: params.language_code,
        include_serp_info: params.include_serp_info,
        include_clickstream_data: params.include_clickstream_data,
      }
    );
    
    const result: any = client.extractResult(response);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
