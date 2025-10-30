/**
 * Credit costs for all features in the platform
 * Updated to match new rate card from pricing redesign
 */

export const CREDIT_COSTS = {
  // Keyword Research
  keyword_ideas: 5, // per seed
  keyword_autocomplete: 2, // per seed
  answer_the_public: 1, // per keyword
  paa_extractor: 1, // per keyword
  
  // SERP & Rankings
  serp_overview: 2, // per keyword/locale
  rank_tracking_per_keyword: 0.02, // per keyword check (~0.6/keyword/mo)
  keyword_clustering: 2, // per 100 keywords
  
  // Content Tools
  ai_content_brief: 10, // per brief
  meta_description_generator: 0.2, // per URL
  content_repurpose: 5, // per repurpose operation
  chatgpt_optimization: 5, // per optimization
  
  // Technical SEO
  crawl_fetch: 0.01, // per URL (100 URLs = 1 credit)
  cwv_check: 0.5, // per URL
  technical_audit: 0.5, // per 100 URLs (ruleset evaluation)
  schema_validation: 0.5, // per URL
  bulk_url_analyzer: 1, // per 100 URLs
  
  // Competitor Analysis
  competitor_analysis: 3, // per analysis
  content_gap_analysis: 5, // per analysis (1 target vs 3 comps)
  competitor_monitoring: 0.2, // per domain/day
  backlink_lookup: 2, // per domain or URL
  
  // Local SEO
  local_seo_audit: 10, // per location
  
  // AI Overview & Citations
  ai_overview_check: 1, // per keyword
  ai_overview_optimization: 2, // per keyword
  citation_optimization: 5, // per optimization
  
  // Reporting
  scheduled_report: 5, // per report
  automated_reporting: 5, // per report
  
  // Legacy keys for backward compatibility
  keyword_research: 5, // maps to keyword_ideas
  serp_analysis: 2, // maps to serp_overview
  serp_similarity: 3, // uses competitor_analysis cost
} as const;

export type FeatureKey = keyof typeof CREDIT_COSTS;

/**
 * Get credit cost for a feature
 * @param feature - The feature key
 * @param quantity - Number of units (keywords, URLs, etc.)
 * @returns Total credit cost
 */
export function getCreditCost(feature: FeatureKey, quantity: number = 1): number {
  const baseCost = CREDIT_COSTS[feature] || 1;
  return Math.ceil(baseCost * quantity);
}

/**
 * Get credit cost for bulk operations
 * @param feature - The feature key
 * @param items - Array of items or count
 * @returns Total credit cost
 */
export function getBulkCreditCost(feature: FeatureKey, items: number | any[]): number {
  const count = Array.isArray(items) ? items.length : items;
  
  // Special handling for per-100 operations
  if (feature === 'keyword_clustering' || feature === 'technical_audit' || feature === 'bulk_url_analyzer') {
    return Math.ceil((CREDIT_COSTS[feature] || 0) * (count / 100));
  }
  
  return getCreditCost(feature, count);
}

/**
 * Feature categories for organization
 */
export const FEATURE_CATEGORIES = {
  research: [
    'keyword_ideas',
    'keyword_research',
    'keyword_autocomplete',
    'keyword_clustering',
    'answer_the_public',
    'paa_extractor',
  ],
  serp: [
    'serp_overview',
    'serp_analysis',
    'rank_tracking_per_keyword',
    'ai_overview_check',
    'ai_overview_optimization',
  ],
  content: [
    'content_repurpose',
    'ai_content_brief',
    'meta_description_generator',
    'chatgpt_optimization',
  ],
  technical: [
    'technical_audit',
    'crawl_fetch',
    'cwv_check',
    'schema_validation',
    'bulk_url_analyzer',
  ],
  competitive: [
    'competitor_analysis',
    'content_gap_analysis',
    'backlink_lookup',
    'competitor_monitoring',
  ],
  local: [
    'local_seo_audit',
  ],
  reporting: [
    'scheduled_report',
    'automated_reporting',
  ],
} as const;

/**
 * Individual feature pricing (for standalone purchases)
 * Note: Add-ons will be handled separately in pricing system
 */
export const INDIVIDUAL_FEATURE_PRICING = {
  answer_the_public_unlimited: {
    name: 'Answer The Public Unlimited',
    description: 'Unlimited Answer The Public queries with wheel visualization',
    price_monthly: 19,
    feature_key: 'answer_the_public_unlimited',
  },
  ai_content_briefs_unlimited: {
    name: 'AI Content Briefs Unlimited',
    description: 'Unlimited AI-powered content brief generation',
    price_monthly: 29,
    feature_key: 'ai_content_briefs_unlimited',
  },
  bulk_analyzer_pro: {
    name: 'Bulk Analyzer Pro',
    description: 'Analyze up to 10,000 URLs or keywords at once',
    price_monthly: 39,
    feature_key: 'bulk_analyzer_pro',
  },
  technical_crawler_unlimited: {
    name: 'Technical SEO Crawler Unlimited',
    description: 'Unlimited site crawls up to 10,000 pages each',
    price_monthly: 49,
    feature_key: 'technical_crawler_unlimited',
  },
  competitor_intelligence_pro: {
    name: 'Competitor Intelligence Pro',
    description: 'Track unlimited competitors with automated alerts',
    price_monthly: 59,
    feature_key: 'competitor_intelligence_pro',
  },
  api_access: {
    name: 'API Access',
    description: '50,000 API calls per month',
    price_monthly: 99,
    feature_key: 'api_access_50k',
  },
} as const;

/**
 * Credit purchase packages
 * Updated pricing: $10 per 1,000 credits (volume discounts available)
 */
export const CREDIT_PACKAGES = [
  {
    credits: 1000,
    price: 10,
    bonus: 0,
    popular: false,
  },
  {
    credits: 5000,
    price: 45, // Slight discount
    bonus: 0,
    popular: false,
  },
  {
    credits: 10000,
    price: 80, // Better discount
    bonus: 1000, // Bonus credits
    popular: true,
  },
  {
    credits: 25000,
    price: 180, // Best value
    bonus: 5000,
    popular: false,
  },
] as const;
