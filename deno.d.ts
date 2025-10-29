// Deno type declarations for edge functions
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.7.1" {
  export function createClient(url: string, key: string, options?: Record<string, unknown>): SupabaseClient;
}

interface SupabaseClient {
  auth: {
    getUser(token?: string): Promise<{ data: { user?: User }, error: Error | null }>;
    getSession(): Promise<{ data: { session?: Session }, error: Error | null }>;
  };
  from(table: string): {
    select(columns?: string): any;
    insert(data: Record<string, unknown>): any;
    update(data: Record<string, unknown>): any;
    upsert(data: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string; ignoreDuplicates?: boolean }): any;
    delete(): any;
    eq(column: string, value: unknown): any;
    single(): any;
    maybeSingle(): any;
  };
}

interface User {
  id: string;
  email?: string;
}

interface Session {
  user: User;
  provider_token?: string;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export function createClient(url: string, key: string, options?: Record<string, unknown>): SupabaseClient;
}
