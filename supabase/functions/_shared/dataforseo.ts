import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// Configuration
const DFS_BASE_URL = "https://api.dataforseo.com/v3";

// Standard CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Type-safe response wrapper
export interface DFSResponse<T = unknown> {
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: any;
    result: T;
  }>;
}

// Type-safe client
export class DataForSEOClient {
  private login: string;
  private password: string;

  constructor() {
    this.login = Deno.env.get("DATAFORSEO_LOGIN")!;
    this.password = Deno.env.get("DATAFORSEO_PASSWORD")!;
    
    if (!this.login || !this.password) {
      throw new Error("DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD");
    }
  }

  private getAuthHeader(): string {
    return `Basic ${btoa(`${this.login}:${this.password}`)}`;
  }

  async post<T = unknown>(
    endpoint: string,
    payload: unknown,
    options?: {
      timeout?: number;
      retries?: number;
    }
  ): Promise<DFSResponse<T>> {
    const url = `${DFS_BASE_URL}/${endpoint}`;
    const body = JSON.stringify([payload]); // DFS expects array

    console.log(`[DataForSEO] POST ${endpoint}`);
    console.log(`[DataForSEO] Payload:`, JSON.stringify(payload, null, 2));

    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.getAuthHeader(),
        },
        body,
        signal: AbortSignal.timeout(options?.timeout || 30000),
      });

      const text = await response.text();
      const duration = Date.now() - startTime;

      console.log(`[DataForSEO] Response: ${response.status} in ${duration}ms`);

      if (!response.ok) {
        console.error(`[DataForSEO] Error response:`, text);
        throw new DataForSEOError(
          `API Error: ${response.status} ${response.statusText}`,
          response.status,
          text
        );
      }

      const data: DFSResponse<T> = JSON.parse(text);
      
      // Log cost
      const cost = data.tasks?.[0]?.cost || 0;
      if (cost > 0) {
        console.log(`[DataForSEO] Cost: $${cost.toFixed(4)}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DataForSEOError) {
        throw error;
      }
      throw new DataForSEOError(
        error instanceof Error ? error.message : "Unknown error",
        500,
        String(error)
      );
    }
  }

  // Convenience method to extract result from response
  extractResult<T>(response: DFSResponse<T>): T {
    const task = response.tasks?.[0];
    if (!task) {
      throw new DataForSEOError("No task in response", 500, JSON.stringify(response));
    }
    if (task.status_code !== 20000) {
      throw new DataForSEOError(
        task.status_message || "Task failed",
        task.status_code,
        JSON.stringify(task)
      );
    }
    return task.result;
  }
}

// Custom error class
export class DataForSEOError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details: string
  ) {
    super(message);
    this.name = "DataForSEOError";
  }
}

// Request validation helper
export async function validateRequest<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<T> {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  
  if (!parsed.success) {
    throw new ValidationError(
      "Invalid request parameters",
      parsed.error.format()
    );
  }
  
  return parsed.data;
}

// Validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Standard response helpers
export function successResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(error: unknown): Response {
  console.error("[Error]", error);
  
  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details,
        type: "validation_error"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  
  if (error instanceof DataForSEOError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details,
        type: "dataforseo_error"
      }),
      {
        status: error.statusCode >= 500 ? 500 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  
  // Generic error
  const message = error instanceof Error ? error.message : "Unknown error";
  return new Response(
    JSON.stringify({
      error: message,
      type: "internal_error"
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// CORS preflight handler
export function handleCORS(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
