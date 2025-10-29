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
  keywords: z.array(z.string().min(1).max(200)).min(1).max(1000),
  location_code: z.number().int().positive().default(2840),
  language_code: z.string().regex(/^[a-z]{2}$/).default("en"),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const params = await validateRequest(req, RequestSchema) as z.infer<typeof RequestSchema>;
    const client = new DataForSEOClient();
    
    const payload: any = {
      keywords: params.keywords,
      location_code: params.location_code,
      language_code: params.language_code,
    };

    if (params.date_from) payload.date_from = params.date_from;
    if (params.date_to) payload.date_to = params.date_to;
    
    const response = await client.post(
      "keywords_data/google/search_volume_history/live",
      payload
    );
    
    const result: any = client.extractResult(response);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
