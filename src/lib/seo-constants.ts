/**
 * SEO Constants and Industry Standards
 * Based on research from Advanced Web Ranking, Ahrefs, and SEMrush
 */

// Click-Through Rate by Position (Desktop - AWR Data 2024)
export const CTR_BY_POSITION_DESKTOP = {
  1: 0.316,   // 31.6%
  2: 0.158,   // 15.8%
  3: 0.103,   // 10.3%
  4: 0.073,   // 7.3%
  5: 0.058,   // 5.8%
  6: 0.047,   // 4.7%
  7: 0.040,   // 4.0%
  8: 0.034,   // 3.4%
  9: 0.030,   // 3.0%
  10: 0.027,  // 2.7%
  11: 0.024,  // 2.4%
  12: 0.021,  // 2.1%
  13: 0.019,  // 1.9%
  14: 0.017,  // 1.7%
  15: 0.015,  // 1.5%
  16: 0.014,  // 1.4%
  17: 0.013,  // 1.3%
  18: 0.012,  // 1.2%
  19: 0.011,  // 1.1%
  20: 0.010,  // 1.0%
} as const;

// Click-Through Rate by Position (Mobile - slightly different)
export const CTR_BY_POSITION_MOBILE = {
  1: 0.283,   // 28.3%
  2: 0.142,   // 14.2%
  3: 0.093,   // 9.3%
  4: 0.066,   // 6.6%
  5: 0.052,   // 5.2%
  6: 0.042,   // 4.2%
  7: 0.036,   // 3.6%
  8: 0.031,   // 3.1%
  9: 0.027,   // 2.7%
  10: 0.024,  // 2.4%
} as const;

// SERP Features Impact on CTR
export const SERP_FEATURES_CTR_IMPACT = {
  featured_snippet: 0.20,      // +20% CTR if you own it
  people_also_ask: -0.05,      // -5% CTR (steals clicks)
  local_pack: -0.15,           // -15% CTR for organic
  shopping_results: -0.10,     // -10% CTR
  video_carousel: -0.08,       // -8% CTR
  knowledge_panel: -0.12,      // -12% CTR
  image_pack: -0.06,           // -6% CTR
  ai_overview: -0.25,          // -25% CTR (significant impact)
} as const;

// Keyword Difficulty Weights
export const KD_WEIGHTS = {
  domain_authority: 0.40,      // 40% weight
  avg_backlinks: 0.30,         // 30% weight
  content_quality: 0.15,       // 15% weight
  serp_features: 0.10,         // 10% weight
  rank_volatility: 0.05,       // 5% weight
} as const;

// Keyword Difficulty Score Interpretation
export const KD_DIFFICULTY_RANGES = {
  very_easy: { min: 0, max: 20, label: 'Very Easy', color: 'emerald' },
  easy: { min: 21, max: 40, label: 'Easy', color: 'green' },
  medium: { min: 41, max: 60, label: 'Medium', color: 'yellow' },
  hard: { min: 61, max: 80, label: 'Hard', color: 'orange' },
  very_hard: { min: 81, max: 100, label: 'Very Hard', color: 'red' },
} as const;

// Search Intent Indicators
export const INTENT_KEYWORDS = {
  transactional: ['buy', 'purchase', 'order', 'shop', 'cart', 'price', 'cheap', 'discount', 'deal', 'coupon', 'sale'],
  commercial: ['best', 'top', 'review', 'compare', 'vs', 'alternative', 'comparison', 'versus'],
  informational: ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial', 'learn', 'tips'],
  navigational: ['login', 'signin', 'website', 'official', 'brand name'],
} as const;

// Buying Stage Indicators
export const BUYING_STAGE_KEYWORDS = {
  awareness: ['what is', 'how to', 'guide', 'tips', 'ideas', 'examples'],
  consideration: ['best', 'top', 'review', 'compare', 'vs', 'alternative'],
  decision: ['buy', 'price', 'discount', 'coupon', 'deal', 'cheap', 'order'],
} as const;

// Content Quality Metrics
export const CONTENT_QUALITY_BENCHMARKS = {
  word_count: {
    informational: { min: 1500, ideal: 2500, max: 4000 },
    commercial: { min: 1000, ideal: 2000, max: 3000 },
    transactional: { min: 500, ideal: 1000, max: 2000 },
  },
  heading_structure: {
    min_h2: 5,
    ideal_h2: 10,
    max_h2: 20,
    min_h3: 10,
    ideal_h3: 20,
  },
  keyword_density: {
    min: 0.005,  // 0.5%
    ideal: 0.015, // 1.5%
    max: 0.03,   // 3%
  },
} as const;

// Backlink Quality Tiers
export const BACKLINK_QUALITY_TIERS = {
  tier1: { da_min: 70, value: 10 },   // High authority
  tier2: { da_min: 50, value: 5 },    // Medium authority
  tier3: { da_min: 30, value: 2 },    // Low authority
  tier4: { da_min: 0, value: 0.5 },   // Very low authority
} as const;

// Seasonality Patterns
export const SEASONALITY_PATTERNS = {
  holiday: [11, 12],           // November, December
  back_to_school: [8, 9],      // August, September
  summer: [6, 7, 8],           // June, July, August
  new_year: [1],               // January
  spring: [3, 4, 5],           // March, April, May
} as const;

// SERP Volatility Thresholds
export const VOLATILITY_THRESHOLDS = {
  stable: { max: 20, label: 'Stable', color: 'emerald', opportunity: 'locked' },
  moderate: { min: 21, max: 50, label: 'Moderate', color: 'yellow', opportunity: 'competitive' },
  high: { min: 51, label: 'High', color: 'red', opportunity: 'open' },
} as const;

// Content Freshness Impact
export const FRESHNESS_IMPACT = {
  news: { importance: 'critical', update_frequency: 'daily', boost: 0.30 },
  trending: { importance: 'critical', update_frequency: 'weekly', boost: 0.25 },
  evergreen: { importance: 'minor', update_frequency: 'quarterly', boost: 0.05 },
  seasonal: { importance: 'important', update_frequency: 'monthly', boost: 0.15 },
} as const;

// Ranking Time Estimates (in months)
export const TIME_TO_RANK_ESTIMATES = {
  kd_0_20: { min: 1, max: 3 },      // Very Easy
  kd_21_40: { min: 2, max: 4 },     // Easy
  kd_41_60: { min: 3, max: 6 },     // Medium
  kd_61_80: { min: 6, max: 12 },    // Hard
  kd_81_100: { min: 12, max: 24 },  // Very Hard
} as const;

// Opportunity Score Thresholds
export const OPPORTUNITY_SCORE_RANGES = {
  high: { min: 100, label: 'High Priority', color: 'emerald' },
  medium: { min: 50, max: 99, label: 'Medium Priority', color: 'yellow' },
  low: { max: 49, label: 'Low Priority', color: 'red' },
} as const;

// Topic Clustering Similarity Threshold
export const CLUSTERING_THRESHOLD = 0.65; // 65% similarity

// Brand CTR Boost (recognized brands get higher CTR)
export const BRAND_CTR_BOOST = 0.20; // +20%

// Domain Age Impact on Trust
export const DOMAIN_AGE_IMPACT = {
  new: { max_months: 6, penalty: 0.20 },      // -20% trust
  young: { max_months: 24, penalty: 0.10 },   // -10% trust
  established: { min_months: 24, bonus: 0 },  // No change
  mature: { min_months: 60, bonus: 0.10 },    // +10% trust
} as const;

// Competition Index Calculation
export const COMPETITION_WEIGHTS = {
  avg_da: 0.35,
  avg_backlinks: 0.25,
  avg_content_length: 0.20,
  serp_features_count: 0.15,
  paid_ads_count: 0.05,
} as const;
