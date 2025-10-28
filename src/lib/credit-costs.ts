/**
 * Credit costs for all features in the platform
 * These values determine how many credits each action consumes
 */

export const CREDIT_COSTS = {
  // Keyword Research
  keyword_research: 1,
  keyword_autocomplete: 1,
  keyword_clustering: 5,
  
  // SERP & Rankings
  serp_analysis: 2,
  serp_similarity: 3,
  rank_tracking_per_keyword: 0.1, // Per keyword per check
  
  // Content Tools
  content_repurpose: 5,
  ai_content_brief: 5,
  meta_description_generator: 1,
  chatgpt_optimization: 5,
  
  // Answer The Public & Research
  answer_the_public: 2,
  paa_extractor: 1,
  
  // Competitor Analysis
  competitor_analysis: 3,
  content_gap_analysis: 10,
  
  // Backlinks & Authority
  backlink_analysis: 3,
  
  // Technical SEO
  technical_audit: 10,
  site_crawl_per_page: 0.1,
  cwv_check: 1,
  schema_validation: 0.5,
  
  // Bulk Operations
  bulk_analyzer_per_url: 0.5,
  bulk_keyword_analysis_per_keyword: 0.1,
  
  // AI Overview & Citations
  ai_overview_check: 2,
  ai_overview_optimization: 5,
  citation_optimization: 5,
  
  // Advanced Features
  local_seo_audit: 5,
  competitor_monitoring_per_competitor: 1,
  automated_reporting: 3,
} as const;

export type FeatureKey = keyof typeof CREDIT_COSTS;

/**
 * Get credit cost for a feature
 */
export function getCreditCost(feature: FeatureKey, quantity: number = 1): number {
  const baseCost = CREDIT_COSTS[feature] || 1;
  return baseCost * quantity;
}

/**
 * Feature categories for organization
 */
export const FEATURE_CATEGORIES = {
  research: [
    'keyword_research',
    'keyword_autocomplete',
    'keyword_clustering',
    'answer_the_public',
    'paa_extractor',
  ],
  content: [
    'content_repurpose',
    'ai_content_brief',
    'meta_description_generator',
    'chatgpt_optimization',
  ],
  technical: [
    'technical_audit',
    'site_crawl_per_page',
    'cwv_check',
    'schema_validation',
  ],
  competitive: [
    'competitor_analysis',
    'content_gap_analysis',
    'backlink_analysis',
  ],
  advanced: [
    'ai_overview_check',
    'citation_optimization',
    'bulk_analyzer_per_url',
  ],
} as const;

/**
 * Individual feature pricing (for standalone purchases)
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
 */
export const CREDIT_PACKAGES = [
  {
    credits: 100,
    price: 10,
    bonus: 0,
    popular: false,
  },
  {
    credits: 500,
    price: 40,
    bonus: 50,
    popular: false,
  },
  {
    credits: 1000,
    price: 70,
    bonus: 150,
    popular: true,
  },
  {
    credits: 5000,
    price: 300,
    bonus: 1000,
    popular: false,
  },
] as const;

