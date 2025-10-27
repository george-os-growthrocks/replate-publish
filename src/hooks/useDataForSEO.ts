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

