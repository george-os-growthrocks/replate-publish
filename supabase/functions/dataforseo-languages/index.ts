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
  search: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

serve(async (req) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const params = await validateRequest(req, RequestSchema) as z.infer<typeof RequestSchema>;
    const client = new DataForSEOClient();
    
    const response = await client.post("serp/google/languages", {});
    let result = client.extractResult(response);
    
    if (params.search && Array.isArray(result)) {
      const searchLower = params.search.toLowerCase();
      result = result.filter((lang: any) => 
        lang.language_name?.toLowerCase().includes(searchLower) ||
        lang.language_code?.toLowerCase().includes(searchLower)
      );
    }
    
    if (Array.isArray(result) && result.length > params.limit) {
      result = result.slice(0, params.limit);
    }
    
    return successResponse({
      total: Array.isArray(result) ? result.length : 0,
      languages: result,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
