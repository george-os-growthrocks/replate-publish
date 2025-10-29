// Keyword Explorer Types
// Advanced SEO intelligence API specifications

export interface KeywordOverview {
  keyword: string;
  location_code: number;
  language_code: string;
  
  // Core metrics
  search_volume: number;
  keyword_difficulty: number; // KD 0-100
  cpc: number;
  competition: number;
  
  // Clicks data
  monthly_searches?: Array<{ month: number; year: number; search_volume: number }>;
  clickstream_keyword_info?: {
    monthly_searches: Array<{ month: number; year: number; search_volume: number }>;
  };
  
  // Intent & features
  search_intent_info?: {
    main_intent?: string; // commercial, informational, navigational, transactional
    last_updated_time?: string;
  };
  
  // SERP features
  serp_info?: {
    se_results_count: number;
    check_url?: string;
  };
  
  // Impressions/clicks
  impressions_info?: {
    daily_impressions_average?: number;
    daily_impressions_min?: number;
    daily_impressions_max?: number;
    daily_clicks_average?: number;
    daily_clicks_min?: number;
    daily_clicks_max?: number;
  };
}

export interface KeywordIdea {
  keyword: string;
  keyword_info: {
    search_volume: number;
    cpc?: number;
    competition?: number;
    monthly_searches?: Array<{ month: number; year: number; search_volume: number }>;
  };
  keyword_properties?: {
    keyword_difficulty?: number;
  };
  search_intent_info?: {
    main_intent?: string;
  };
  impressions_info?: {
    daily_clicks_average?: number;
  };
}

export interface SerpItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position?: string;
  url: string;
  domain: string;
  title?: string;
  description?: string;
  
  // Enriched with backlink data
  backlinks?: {
    backlinks: number;
    referring_domains: number;
    dofollow: number;
    nofollow: number;
  };
  
  // Enriched with traffic data
  traffic?: {
    etv: number; // Estimated traffic value
    estimated_paid_traffic_cost?: number;
  };
  
  // Authority score (computed)
  authority_score?: number;
}

export interface HistoricalSerp {
  date: string;
  items: Array<{
    rank_absolute: number;
    url: string;
    domain: string;
  }>;
  ads?: Array<{
    position: string;
    title: string;
    advertiser_domain: string;
  }>;
}

export interface RankedKeywordData {
  keyword: string;
  search_volume: number;
  rank_group: number;
  rank_absolute: number;
  etv: number; // Estimated traffic value per keyword
  cpc?: number;
}

export interface TrafficShare {
  domain: string;
  url?: string;
  estimated_traffic: number;
  traffic_share_percentage: number;
  ctr: number;
  rank: number;
}

export interface KeywordExplorerState {
  // Search params
  seedKeyword: string;
  locationCode: number;
  languageCode: string;
  
  // Overview data
  overview: KeywordOverview | null;
  overviewLoading: boolean;
  
  // Keyword ideas
  matchingTerms: KeywordIdea[];
  relatedTerms: KeywordIdea[];
  questions: KeywordIdea[];
  searchSuggestions: string[];
  ideasLoading: boolean;
  
  // SERP data
  serpItems: SerpItem[];
  serpLoading: boolean;
  
  // Also rank for
  alsoRankFor: RankedKeywordData[];
  alsoRankForLoading: boolean;
  
  // History
  positionHistory: HistoricalSerp[];
  historyLoading: boolean;
  
  // Traffic analysis
  trafficShare: TrafficShare[];
  trafficLoading: boolean;
  
  // Parent topic & Traffic Potential
  parentTopic?: {
    keyword: string;
    search_volume: number;
  };
  trafficPotential?: number;
}

// CTR curve by position (industry standard)
export const CTR_CURVE: Record<number, number> = {
  1: 0.3945,
  2: 0.1831,
  3: 0.1065,
  4: 0.0718,
  5: 0.0547,
  6: 0.0421,
  7: 0.0332,
  8: 0.0268,
  9: 0.0221,
  10: 0.0184,
  11: 0.0156,
  12: 0.0133,
  13: 0.0115,
  14: 0.0100,
  15: 0.0088,
  16: 0.0078,
  17: 0.0069,
  18: 0.0062,
  19: 0.0056,
  20: 0.0050,
};

// Helper to calculate Clicks Per Search (CPS)
export function calculateCPS(
  dailyClicks: number | undefined,
  searchVolume: number | undefined
): number {
  if (!dailyClicks || !searchVolume || searchVolume === 0) return 0;
  const monthlyClicks = dailyClicks * 30;
  return monthlyClicks / searchVolume;
}

// Helper to calculate Traffic Potential
export function calculateTrafficPotential(
  rankedKeywords: RankedKeywordData[]
): number {
  return rankedKeywords.reduce((total, kw) => {
    const ctr = CTR_CURVE[kw.rank_absolute] || 0;
    return total + (kw.search_volume * ctr);
  }, 0);
}

// Helper to compute authority score (0-100)
export function computeAuthorityScore(data: {
  referringDomains: number;
  backlinks: number;
  dofollowRatio: number;
  estimatedTraffic: number;
}): number {
  // Normalize and weight each factor
  const rdScore = Math.min(100, (Math.log10(data.referringDomains + 1) / 4) * 100); // Log scale
  const blScore = Math.min(100, (Math.log10(data.backlinks + 1) / 6) * 100);
  const dfScore = data.dofollowRatio * 100;
  const trafficScore = Math.min(100, (Math.log10(data.estimatedTraffic + 1) / 5) * 100);
  
  // Weighted average
  return Math.round(
    rdScore * 0.40 +
    blScore * 0.25 +
    dfScore * 0.15 +
    trafficScore * 0.20
  );
}
