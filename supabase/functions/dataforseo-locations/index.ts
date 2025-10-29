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
  search: z.string().optional(),
  country: z.string().length(2).optional(),
  limit: z.number().int().min(1).max(1000).default(100),
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
    
    // Get locations list
    const response = await client.get("serp/google/locations");
    
    let result = client.extractResult(response);
    
    // Filter by search term if provided
    if (params.search && Array.isArray(result)) {
      const searchLower = params.search.toLowerCase();
      result = result.filter((loc: any) => 
        loc.location_name?.toLowerCase().includes(searchLower) ||
        loc.location_code?.toString().includes(searchLower)
      );
    }
    
    // Filter by country if provided
    if (params.country && Array.isArray(result)) {
      const countryUpper = params.country.toUpperCase();
      result = result.filter((loc: any) => 
        loc.country_iso_code === countryUpper
      );
    }
    
    // Limit results
    if (Array.isArray(result) && result.length > params.limit) {
      result = result.slice(0, params.limit);
    }
    
    return successResponse({
      total: Array.isArray(result) ? result.length : 0,
      locations: result,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
