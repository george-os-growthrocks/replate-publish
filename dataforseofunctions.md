Below are copy-paste edge functions (Supabase Deno) with Zod schemas + handlers for the core DataForSEO endpoints.
Pattern: each function has its own index.ts. Shared utils live in /_shared.

/_shared/dfs.ts (auth + fetch helper)
// /_shared/dfs.ts
// Deno/Supabase Edge Function helper for DataForSEO v3
const DFS_BASE = "https://api.dataforseo.com/v3";

export function dfsAuthHeader() {
  const login = Deno.env.get("DFS_LOGIN")!;
  const password = Deno.env.get("DFS_PASSWORD")!;
  const token = btoa(`${login}:${password}`);
  return `Basic ${token}`;
}

export async function dfsPost<T = unknown>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${DFS_BASE}/${path}`, {
    method: "POST",
    headers: {
      "Authorization": dfsAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify([payload]), // DFS expects array of tasks
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`DFS_ERROR ${res.status} ${res.statusText}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    // sometimes DFS returns plain text; bubble it up
    return text as unknown as T;
  }
}

export function ok(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  const body = await req.text();
  if (!body) return {} as T;
  return JSON.parse(body);
}

export function err(e: unknown, status = 400): Response {
  const msg = e instanceof Error ? e.message : String(e);
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/_shared/validate.ts (Zod helper)
// /_shared/validate.ts
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export { z };

export async function parseJson<T>(req: Request, schema: z.ZodType<T>) {
  const raw = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("VALIDATION_ERROR: " + JSON.stringify(parsed.error.format()));
  }
  return parsed.data;
}

SERP — Live Advanced
/functions/dataforseo-serp-live-advanced/index.ts
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  keyword: z.string().min(1),
  se: z.string().default("google"),
  se_type: z.string().default("organic"),
  location_code: z.number(),
  language_code: z.string(),
  device: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
  os: z.string().optional(), // e.g., "windows"
  depth: z.number().min(1).max(100).default(100),
});

serve(async (req) => {
  try {
    const body = await parseJson(req, Schema);
    const payload = {
      keyword: body.keyword,
      location_code: body.location_code,
      language_code: body.language_code,
      device: body.device,
      os: body.os,
      se: body.se,
      se_type: body.se_type,
      depth: body.depth,
    };
    const data = await dfsPost<any>(`serp/${body.se}/${body.se_type}/live/advanced`, payload);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

LABS — Keyword Ideas (live)
/functions/dataforseo-labs-keyword-ideas-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  location_code: z.number(),
  language_code: z.string(),
  include_seed_keywords: z.boolean().default(false),
  limit: z.number().min(10).max(10000).default(1000),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const payload = {
      keywords: b.keywords,
      location_code: b.location_code,
      language_code: b.language_code,
      include_seed_keywords: b.include_seed_keywords,
      limit: b.limit,
    };
    const data = await dfsPost("dataforseo_labs/google/keyword_ideas/live", payload);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

LABS — Keyword Suggestions (live)
/functions/dataforseo-labs-keyword-suggestions-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  keyword: z.string().min(1),
  location_code: z.number(),
  language_code: z.string(),
  limit: z.number().min(10).max(10000).default(1000),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("dataforseo_labs/google/keyword_suggestions/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Keywords Data — Google Ads Search Volume (live)
/functions/dataforseo-keywords-google-ads-volume-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  location_code: z.number(),
  language_code: z.string(),
  include_serp_info: z.boolean().default(false),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const payload = {
      keywords: b.keywords,
      location_code: b.location_code,
      language_code: b.language_code,
      include_serp_info: b.include_serp_info,
    };
    const data = await dfsPost("keywords_data/google_ads/search_volume/live", payload);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

OnPage — Instant Pages
/functions/dataforseo-onpage-instant-pages/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  url: z.string().url(),
  enable_javascript: z.boolean().default(false),
  custom_user_agent: z.string().optional(),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("on_page/instant_pages", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

OnPage — Summary
/functions/dataforseo-onpage-summary/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  target: z.string().min(1), // domain or start URL
  max_crawl_pages: z.number().min(1).max(50000).default(5000),
  force_include_subdomains: z.boolean().default(true),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const payload = {
      target: b.target,
      max_crawl_pages: b.max_crawl_pages,
      force_include_subdomains: b.force_include_subdomains,
    };
    const data = await dfsPost("on_page/summary", payload);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

OnPage — Content Parsing (live)
/functions/dataforseo-onpage-content-parsing-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  url: z.string().url(),
  extract_content: z.boolean().default(true),
  include_headers: z.boolean().default(true),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("on_page/content_parsing/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

OnPage — Lighthouse (live)
/functions/dataforseo-onpage-lighthouse-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  url: z.string().url(),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("on_page/lighthouse/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Backlinks — Live
/functions/dataforseo-backlinks-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  target: z.string().min(1),
  mode: z.enum(["as_is","domain_with_subdomains","domain_without_subdomains"]).default("as_is"),
  limit: z.number().min(1).max(10000).default(1000),
  filters: z.array(z.any()).default([]), // DFS expression filters
  include_indirect_links: z.boolean().default(false),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("backlinks/backlinks/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Backlinks — Referring Domains (live)
/functions/dataforseo-backlinks-referring-domains-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  target: z.string().min(1),
  mode: z.enum(["as_is","domain_with_subdomains","domain_without_subdomains"]).default("as_is"),
  limit: z.number().min(1).max(10000).default(1000),
  filters: z.array(z.any()).default([]),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("backlinks/referring_domains/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Backlinks — History (live)
/functions/dataforseo-backlinks-history-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  target: z.string().min(1),
  date_from: z.string().min(4), // "2024-01-01"
  date_to: z.string().min(4),
  group_by: z.enum(["day","week","month"]).default("month"),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("backlinks/history/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Backlinks — Page Intersection (live)
/functions/dataforseo-backlinks-page-intersection-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../..//_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  targets: z.array(z.string().min(1)).min(2), // competitor urls/domains
  limit: z.number().min(1).max(10000).default(1000),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("backlinks/page_intersection/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Backlinks — Domain Intersection (live)
/functions/dataforseo-backlinks-domain-intersection-live/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  targets: z.array(z.string().min(1)).min(2),
  limit: z.number().min(1).max(10000).default(1000),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("backlinks/domain_intersection/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Business Data — Google Maps Search
/functions/dataforseo-business-google-maps-search/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../../_shared/dfs.ts";

const Schema = z.object({
  query: z.string().min(1),          // e.g. "souvlaki artemonas"
  location_coordinate: z.string().optional(), // "37.06,-24.52"
  location_radius: z.number().optional(),     // in meters
  language_code: z.string().default("en"),
  limit: z.number().min(1).max(100).default(20),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const payload = {
      query: b.query,
      language_code: b.language_code,
      location_coordinate: b.location_coordinate,
      location_radius: b.location_radius,
      limit: b.limit,
    };
    const data = await dfsPost("business_data/google/maps/search/live", payload);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Business Data — Google Maps Reviews
/functions/dataforseo-business-google-maps-reviews/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z, parseJson } from "../../_shared/validate.ts";
import { dfsPost, ok, err } from "../..//_shared/dfs.ts";

const Schema = z.object({
  place_id: z.string().min(1),   // Google place_id from search
  limit: z.number().min(1).max(100).default(50),
  sort_by: z.enum(["most_relevant","newest"]).default("most_relevant"),
});

serve(async (req) => {
  try {
    const b = await parseJson(req, Schema);
    const data = await dfsPost("business_data/google/reviews/live", b);
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Utilities — Locations
/functions/dataforseo-locations/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { ok, err } from "../../_shared/dfs.ts";

// DFS exposes locations per suite; this is a minimal passthrough for SERP Google.
serve(async () => {
  try {
    // No payload needed for this “db” endpoint; if needed, switch to locations by engine.
    const res = await fetch("https://api.dataforseo.com/v3/serp/google/locations", {
      headers: { "Authorization": "Basic " + btoa(`${Deno.env.get("DFS_LOGIN")}:${Deno.env.get("DFS_PASSWORD")}`) }
    });
    const data = await res.json();
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Utilities — Languages
/functions/dataforseo-languages/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { ok, err } from "../../_shared/dfs.ts";

serve(async () => {
  try {
    const res = await fetch("https://api.dataforseo.com/v3/serp/google/languages", {
      headers: { "Authorization": "Basic " + btoa(`${Deno.env.get("DFS_LOGIN")}:${Deno.env.get("DFS_PASSWORD")}`) }
    });
    const data = await res.json();
    return ok(data);
  } catch (e) {
    return err(e);
  }
});

Environment (Supabase)