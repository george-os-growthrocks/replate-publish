/**
 * React hooks for DataForSEO API consumption
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// SERP Hooks
// ============================================================================

export interface SerpAdvancedParams {
  keyword: string;
  location_code?: number;
  language_code?: string;
  device?: "desktop" | "mobile" | "tablet";
}

export function useSerpAdvanced(
  params: SerpAdvancedParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-serp", params.keyword, params.location_code, params.device],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-serp", {
        body: params,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!params.keyword,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// ============================================================================
// Keywords Hooks
// ============================================================================

export interface KeywordIdeasParams {
  keywords: string[];
  location_code?: number;
  language_code?: string;
}

export function useKeywordIdeas(
  params: KeywordIdeasParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-keywords-ideas", params.keywords, params.location_code],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-keywords", {
        body: {
          type: "ideas",
          ...params,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && params.keywords.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export interface KeywordSuggestionsParams {
  keyword: string;
  location_code?: number;
  language_code?: string;
}

export function useKeywordSuggestions(
  params: KeywordSuggestionsParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-keywords-suggestions", params.keyword, params.location_code],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-keywords", {
        body: {
          type: "suggestions",
          ...params,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!params.keyword,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export interface KeywordVolumeParams {
  keywords: string[];
  location_code?: number;
  language_code?: string;
}

export function useKeywordVolume(
  params: KeywordVolumeParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-keywords-volume", params.keywords, params.location_code],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-keywords", {
        body: {
          type: "volume",
          ...params,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && params.keywords.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

// ============================================================================
// OnPage Hooks
// ============================================================================

export function useOnPageInstant(
  url: string,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-onpage-instant", url],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-onpage", {
        body: {
          type: "instant",
          url,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!url,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useOnPageSummary(
  target: string,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-onpage-summary", target],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-onpage", {
        body: {
          type: "summary",
          target,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!target,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useOnPageParse(
  url: string,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-onpage-parse", url],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-onpage", {
        body: {
          type: "parse",
          url,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!url,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export interface LighthouseParams {
  url: string;
  device?: "desktop" | "mobile";
}

export function useLighthouse(
  params: LighthouseParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-lighthouse", params.url, params.device],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-onpage", {
        body: {
          type: "lighthouse",
          ...params,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!params.url,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// ============================================================================
// Backlinks Hooks
// ============================================================================

export interface BacklinksLiveParams {
  target: string;
  mode?: "as_is" | "one_per_domain" | "one_per_anchor";
  limit?: number;
  filters?: any[];
}

export function useBacklinksLive(
  params: BacklinksLiveParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-backlinks-live", params.target, params.mode, params.limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-backlinks", {
        body: {
          type: "live",
          ...params,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!params.target,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export interface BacklinksHistoryParams {
  target: string;
  date_from?: string;
  date_to?: string;
  group_by?: "day" | "week" | "month";
}

export function useBacklinksHistory(
  params: BacklinksHistoryParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-backlinks-history", params.target, params.date_from, params.date_to],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-backlinks", {
        body: {
          type: "history",
          ...params,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && !!params.target,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export interface BacklinksIntersectionParams {
  targets: string[];
  limit?: number;
}

export function useBacklinksIntersection(
  params: BacklinksIntersectionParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dataforseo-backlinks-intersection", params.targets],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-backlinks", {
        body: {
          type: "intersection",
          ...params,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    enabled: enabled && params.targets.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

// ============================================================================
// NEW: Advanced Labs Hooks
// ============================================================================

export interface BulkKeywordDifficultyParams {
  keywords: string[];
  location_code?: number;
  language_code?: string;
}

export function useBulkKeywordDifficulty(
  params: BulkKeywordDifficultyParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-labs-bulk-kd", params.keywords],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-labs-bulk-kd", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: enabled && params.keywords.length > 0,
  });
}

export interface SerpOverviewParams {
  keyword: string;
  location_code?: number;
  language_code?: string;
}

export function useSerpOverview(
  params: SerpOverviewParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-labs-serp-overview", params.keyword],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-labs-serp-overview", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: enabled && !!params.keyword,
  });
}

export interface DomainCompetitorsParams {
  target: string;
  location_code?: number;
  language_code?: string;
  limit?: number;
}

export function useDomainCompetitors(
  params: DomainCompetitorsParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-labs-domain-competitors", params.target],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-labs-domain-competitors", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: enabled && !!params.target,
  });
}

// ============================================================================
// NEW: Keywords Data Hooks
// ============================================================================

export interface GoogleAdsVolumeParams {
  keywords: string[];
  location_code?: number;
  language_code?: string;
}

export function useGoogleAdsVolume(
  params: GoogleAdsVolumeParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-keywords-google-ads-volume", params.keywords],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-keywords-google-ads-volume", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    enabled: enabled && params.keywords.length > 0,
  });
}

// ============================================================================
// NEW: Business Data Hooks
// ============================================================================

export interface GoogleMapsSearchParams {
  keyword: string;
  location_code?: number;
  language_code?: string;
  depth?: number;
}

export function useGoogleMapsSearch(
  params: GoogleMapsSearchParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-business-google-maps-search", params.keyword, params.location_code],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-business-google-maps-search", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: enabled && !!params.keyword,
  });
}

export interface GoogleMapsReviewsParams {
  cid: string;
  depth?: number;
  sort_by?: string;
}

export function useGoogleMapsReviews(
  params: GoogleMapsReviewsParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-business-google-maps-reviews", params.cid],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-business-google-maps-reviews", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: enabled && !!params.cid,
  });
}

// ============================================================================
// NEW: Merchant Hooks
// ============================================================================

export interface MerchantProductsSearchParams {
  keyword: string;
  location_code?: number;
  language_code?: string;
  depth?: number;
}

export function useMerchantProductsSearch(
  params: MerchantProductsSearchParams,
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-merchant-products-search", params.keyword, params.location_code],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-merchant-products-search", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: enabled && !!params.keyword,
  });
}

// ============================================================================
// NEW: Utility Hooks
// ============================================================================

export interface UtilityParams {
  api?: string;
  se?: string;
}

export function useDataForSEOLocations(
  params: UtilityParams = {},
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-locations", params],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-locations", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days (rarely changes)
    enabled,
  });
}

export function useDataForSEOLanguages(
  params: UtilityParams = {},
  enabled: boolean = true
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ["dfs-languages", params],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dataforseo-languages", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days
    enabled,
  });
}

// ============================================================================
// OnPage Crawl Hooks (Full Site Audit)
// ============================================================================

export interface OnPageCrawlParams {
  target: string;
  max_crawl_pages?: number;
  allow_subdomains?: boolean;
  enable_javascript?: boolean;
  load_resources?: boolean;
  validate_micromarkup?: boolean;
  check_spell?: boolean;
  calculate_keyword_density?: boolean;
  checks_threshold?: {
    high_loading_time?: number;
    large_page_size?: number;
  };
  tag?: string;
}

// Start a crawl
export async function startOnPageCrawl(params: OnPageCrawlParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/task-post", {
    body: [params],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  const taskId = data?.tasks?.[0]?.id;
  if (!taskId) throw new Error("No task ID returned from crawl");
  
  return taskId;
}

// Check if crawl is ready
export async function checkOnPageCrawlReady(): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/tasks-ready", {
    body: [],
  });
  
  if (error) throw error;
  return data;
}

// Get crawl summary
export async function getOnPageSummary(taskId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/summary", {
    body: [{ id: taskId }],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get pages with issues
export async function getOnPageCriticalPages(taskId: string, filters?: any[]): Promise<any> {
  const payload = [{
    id: taskId,
    filters: filters || [
      ["checks.is_4xx_code", "=", true],
      "or",
      ["checks.no_title", "=", true],
      "or",
      ["checks.no_description", "=", true]
    ],
    limit: 200
  }];
  
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/pages", {
    body: payload,
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get all pages
export async function getOnPageAllPages(taskId: string, limit = 100, offset = 0): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/pages", {
    body: [{ id: taskId, limit, offset }],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get duplicate tags
export async function getOnPageDuplicateTags(taskId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/duplicate-tags", {
    body: [{ id: taskId }],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get duplicate content
export async function getOnPageDuplicateContent(taskId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/duplicate-content", {
    body: [{ id: taskId }],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get non-indexable pages
export async function getOnPageNonIndexable(taskId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/non-indexable", {
    body: [{ id: taskId }],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get redirect chains
export async function getOnPageRedirectChains(taskId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/redirect-chains", {
    body: [{ id: taskId }],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get links
export async function getOnPageLinks(taskId: string, filters?: any[]): Promise<any> {
  const payload = [{ 
    id: taskId, 
    limit: 100,
    ...(filters && { filters })
  }];
  
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/links", {
    body: payload,
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

// Get resources
export async function getOnPageResources(taskId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("dataforseo-onpage-crawl/resources", {
    body: [{ id: taskId, limit: 100 }],
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(JSON.stringify(data.error));
  
  return data;
}

