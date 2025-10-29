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
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  filters: z.array(z.any()).optional(),
  order_by: z.array(z.string()).optional(),
});

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const params = await validateRequest(req, RequestSchema) as z.infer<typeof RequestSchema>;
    const client = new DataForSEOClient();
    
    const payload: any = {
      keyword: params.keyword,
      location_code: params.location_code,
      language_code: params.language_code,
      limit: params.limit,
      offset: params.offset,
    };

    if (params.filters) payload.filters = params.filters;
    if (params.order_by) payload.order_by = params.order_by;
    
    const response = await client.post(
      "dataforseo_labs/google/keyword_suggestions/live",
      payload
    );
    
    const result: any = client.extractResult(response);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
