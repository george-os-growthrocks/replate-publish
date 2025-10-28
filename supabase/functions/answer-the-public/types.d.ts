// Type declarations for Deno edge function runtime
// These suppress IDE errors but won't affect Deno runtime

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.7.1" {
  export * from "@supabase/supabase-js";
  export { createClient } from "@supabase/supabase-js";
}
