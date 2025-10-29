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
  target: z.string().url(),
  max_crawl_pages: z.number().int().min(1).max(10000).default(100),
  load_resources: z.boolean().default(true),
  enable_javascript: z.boolean().default(true),
  enable_browser_rendering: z.boolean().default(false),
  custom_js: z.string().optional(),
  check_spell: z.boolean().default(false),
  calculate_keyword_density: z.boolean().default(true),
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
    
    // Start crawl task
    const response = await client.post(
      "on_page/task_post",
      {
        target: params.target,
        max_crawl_pages: params.max_crawl_pages,
        load_resources: params.load_resources,
        enable_javascript: params.enable_javascript,
        enable_browser_rendering: params.enable_browser_rendering,
        custom_js: params.custom_js,
        check_spell: params.check_spell,
        calculate_keyword_density: params.calculate_keyword_density,
      }
    );
    
    const result: any = client.extractResult(response);
    
    return successResponse({
      ...result,
      message: "On-page crawl task started. Use the task ID to retrieve results.",
    });
  } catch (error) {
    return errorResponse(error);
  }
});
