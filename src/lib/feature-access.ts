/**
 * Feature Access Control System
 * Updated for new pricing structure: Launch, Growth, Agency, Scale
 */

import { SubscriptionPlan } from "@/hooks/useSubscription";

export type PlanName = 'Free' | 'Launch' | 'Growth' | 'Agency' | 'Scale';

export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  creditCost: number;
  requiredPlan: PlanName;
  category: 'research' | 'content' | 'technical' | 'competitive' | 'advanced' | 'reporting';
}

/**
 * Complete feature catalog with plan requirements and updated credit costs
 */
export const FEATURES: FeatureDefinition[] = [
  // Research Features - Launch Plan
  {
    key: 'keyword_research',
    name: 'Keyword Research',
    description: 'Keyword ideas and suggestions',
    creditCost: 5, // per seed
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'keyword_ideas',
    name: 'Keyword Ideas',
    description: 'Generate keyword ideas from seed keywords',
    creditCost: 5, // per seed
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'keyword_autocomplete',
    name: 'Keyword Autocomplete',
    description: 'Get keyword suggestions from Google Autocomplete',
    creditCost: 2, // per seed
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'keyword_clustering',
    name: 'Keyword Clustering',
    description: 'AI-powered keyword similarity grouping',
    creditCost: 2, // per 100 keywords
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'answer_the_public',
    name: 'Answer The Public',
    description: 'Discover questions people ask about topics',
    creditCost: 1, // per keyword
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'paa_extractor',
    name: 'People Also Ask Extractor',
    description: 'Extract PAA questions from SERP',
    creditCost: 1, // per keyword
    requiredPlan: 'Launch',
    category: 'research',
  },

  // SERP & Rankings - Launch Plan
  {
    key: 'serp_overview',
    name: 'SERP Overview',
    description: 'Analyze SERP features and top 10 results',
    creditCost: 2, // per keyword/locale
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'serp_analysis',
    name: 'SERP Analysis',
    description: 'Analyze SERP features and competitors',
    creditCost: 2, // per keyword/locale
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'rank_tracking',
    name: 'Rank Tracking',
    description: 'Track keyword rankings over time',
    creditCost: 0.02, // per keyword check (~0.6/keyword/mo)
    requiredPlan: 'Launch',
    category: 'research',
  },
  {
    key: 'ai_overview_check',
    name: 'AI Overview Checker (Basic)',
    description: 'Check AI Overview rankings',
    creditCost: 1, // per keyword
    requiredPlan: 'Launch',
    category: 'advanced',
  },

  // Content Features
  {
    key: 'content_repurpose',
    name: 'Content Repurposing',
    description: 'Transform content for multiple platforms',
    creditCost: 5,
    requiredPlan: 'Launch',
    category: 'content',
  },
  {
    key: 'meta_description_generator',
    name: 'Meta Generator',
    description: 'Generate optimized meta descriptions and titles',
    creditCost: 0.2, // per URL
    requiredPlan: 'Launch',
    category: 'content',
  },
  {
    key: 'ai_content_brief',
    name: 'AI Content Briefs',
    description: 'Generate AI-powered content briefs',
    creditCost: 10, // per brief
    requiredPlan: 'Growth',
    category: 'content',
  },
  {
    key: 'chatgpt_optimization',
    name: 'ChatGPT Citation Optimization',
    description: 'Optimize content for ChatGPT citations',
    creditCost: 5,
    requiredPlan: 'Growth',
    category: 'content',
  },

  // Technical SEO - Launch Plan
  {
    key: 'technical_audit',
    name: 'Lite Tech Audit',
    description: 'Technical SEO audit (1k URLs per crawl)',
    creditCost: 0.5, // per 100 URLs (ruleset evaluation)
    requiredPlan: 'Launch',
    category: 'technical',
  },
  {
    key: 'site_crawl',
    name: 'Site Crawler',
    description: 'Crawl and analyze site structure',
    creditCost: 0.01, // per URL (100 URLs = 1 credit)
    requiredPlan: 'Launch',
    category: 'technical',
  },
  {
    key: 'crawl_fetch',
    name: 'Crawl Fetch',
    description: 'Fetch URLs during crawl',
    creditCost: 0.01, // per URL
    requiredPlan: 'Launch',
    category: 'technical',
  },
  {
    key: 'cwv_check',
    name: 'Sample CWV',
    description: 'Core Web Vitals check (up to 50 URLs/mo on Launch)',
    creditCost: 0.5, // per URL
    requiredPlan: 'Launch',
    category: 'technical',
  },
  {
    key: 'schema_validation',
    name: 'Schema Validator',
    description: 'Validate structured data markup',
    creditCost: 0.5,
    requiredPlan: 'Launch',
    category: 'technical',
  },
  {
    key: 'bulk_analyzer',
    name: 'Bulk URL Analyzer',
    description: 'Analyze hundreds of URLs at once',
    creditCost: 1, // per 100 URLs
    requiredPlan: 'Growth',
    category: 'technical',
  },

  // Competitive Features - Growth Plan
  {
    key: 'serp_similarity',
    name: 'SERP Similarity',
    description: 'Compare SERP similarities across keywords',
    creditCost: 2, // uses similar cost structure
    requiredPlan: 'Growth',
    category: 'research',
  },
  {
    key: 'competitor_analysis',
    name: 'Competitor Analysis',
    description: 'Analyze competitor SEO strategies',
    creditCost: 3,
    requiredPlan: 'Growth',
    category: 'competitive',
  },
  {
    key: 'content_gap_analysis',
    name: 'Content Gap Analysis',
    description: 'Find content opportunities vs competitors (1 target vs 3 comps)',
    creditCost: 5,
    requiredPlan: 'Growth',
    category: 'competitive',
  },
  {
    key: 'backlink_analysis',
    name: 'Backlink Lookups',
    description: 'Analyze backlink profiles',
    creditCost: 2, // per domain or URL
    requiredPlan: 'Growth',
    category: 'competitive',
  },
  {
    key: 'backlink_lookup',
    name: 'Backlink Lookup',
    description: 'Lookup backlinks for domain or URL',
    creditCost: 2, // per domain or URL
    requiredPlan: 'Growth',
    category: 'competitive',
  },
  {
    key: 'local_seo_audit',
    name: 'Local SEO Audit (light)',
    description: 'Complete local SEO audit and optimization',
    creditCost: 10, // per location
    requiredPlan: 'Growth',
    category: 'advanced',
  },
  {
    key: 'competitor_monitoring',
    name: 'Competitor Monitoring',
    description: 'Automated competitor tracking and alerts',
    creditCost: 0.2, // per domain/day
    requiredPlan: 'Agency',
    category: 'competitive',
  },
  {
    key: 'backlink_monitoring',
    name: 'Backlink Monitoring',
    description: 'Continuous backlink profile monitoring',
    creditCost: 0.2, // per domain/day
    requiredPlan: 'Agency',
    category: 'competitive',
  },

  // Advanced Features - Agency Plan
  {
    key: 'ai_overview_optimization',
    name: 'AI Overview Optimization',
    description: 'Optimize for AI Overview appearance',
    creditCost: 2, // per keyword
    requiredPlan: 'Agency',
    category: 'advanced',
  },
  {
    key: 'citation_optimization',
    name: 'Citation Optimization',
    description: 'Optimize for AI citation visibility',
    creditCost: 5,
    requiredPlan: 'Agency',
    category: 'advanced',
  },

  // Reporting - Growth & Agency
  {
    key: 'scheduled_reporting',
    name: 'Scheduled Reports',
    description: 'Generate and schedule SEO reports',
    creditCost: 5, // per report
    requiredPlan: 'Growth',
    category: 'reporting',
  },
  {
    key: 'automated_reporting',
    name: 'Automated Reports',
    description: 'Generate and schedule SEO reports',
    creditCost: 5, // per report
    requiredPlan: 'Growth',
    category: 'reporting',
  },
  {
    key: 'white_label_reports',
    name: 'White-Label Reports',
    description: 'Branded reports for clients',
    creditCost: 5, // per report render
    requiredPlan: 'Agency',
    category: 'reporting',
  },
  {
    key: 'api_access',
    name: 'API Access',
    description: 'API access for integrations (read)',
    creditCost: 0, // Feature access, not credit-based
    requiredPlan: 'Agency',
    category: 'advanced',
  },
  {
    key: 'automations',
    name: 'Automations',
    description: 'Automated workflows and triggers',
    creditCost: 0, // Feature access, not credit-based
    requiredPlan: 'Agency',
    category: 'advanced',
  },
];

/**
 * Plan hierarchy for feature access comparison
 */
const PLAN_HIERARCHY: Record<PlanName, number> = {
  'Free': 0,
  'Launch': 1,
  'Growth': 2,
  'Agency': 3,
  'Scale': 4,
};

/**
 * Check if a user's plan has access to a feature
 */
export function hasFeatureAccess(
  userPlan: PlanName | null | undefined,
  requiredPlan: PlanName
): boolean {
  if (!userPlan) return false;
  
  const userLevel = PLAN_HIERARCHY[userPlan] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? 999;
  
  return userLevel >= requiredLevel;
}

/**
 * Get all features available for a plan
 */
export function getFeaturesForPlan(planName: PlanName): FeatureDefinition[] {
  return FEATURES.filter(feature => 
    hasFeatureAccess(planName, feature.requiredPlan)
  );
}

/**
 * Get features by category for a plan
 */
export function getFeaturesByCategoryForPlan(
  planName: PlanName,
  category?: FeatureDefinition['category']
): FeatureDefinition[] {
  const features = getFeaturesForPlan(planName);
  
  if (category) {
    return features.filter(f => f.category === category);
  }
  
  return features;
}

/**
 * Get feature definition by key
 */
export function getFeatureByKey(key: string): FeatureDefinition | undefined {
  return FEATURES.find(f => f.key === key);
}

/**
 * Check if subscription status allows feature access (trial/active)
 */
export function isSubscriptionActive(
  status: string | null | undefined
): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Get plan name from subscription plan object
 * Handles legacy plan names: Starter -> Launch, Professional/Pro -> Growth
 */
export function getPlanName(
  subscriptionPlan: { name: string } | null | undefined
): PlanName {
  if (!subscriptionPlan) return 'Free';
  
  const name = subscriptionPlan.name;
  
  // Legacy plan name mappings
  if (name === 'Starter') return 'Launch';
  if (name === 'Professional' || name === 'Pro') return 'Growth';
  if (name === 'Enterprise') return 'Scale';
  
  return (name as PlanName) || 'Free';
}
