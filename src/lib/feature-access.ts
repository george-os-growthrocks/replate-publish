/**
 * Feature Access Control System
 * Defines which features are available for each subscription plan
 */

import { SubscriptionPlan } from "@/hooks/useSubscription";

export type PlanName = 'Free' | 'Starter' | 'Pro' | 'Agency' | 'Enterprise';

export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  creditCost: number;
  requiredPlan: PlanName;
  category: 'research' | 'content' | 'technical' | 'competitive' | 'advanced' | 'reporting';
}

/**
 * Complete feature catalog with plan requirements
 */
export const FEATURES: FeatureDefinition[] = [
  // Research Features
  {
    key: 'keyword_research',
    name: 'Keyword Research',
    description: 'Basic keyword research and suggestions',
    creditCost: 1,
    requiredPlan: 'Starter',
    category: 'research',
  },
  {
    key: 'keyword_autocomplete',
    name: 'Keyword Autocomplete',
    description: 'Get keyword suggestions from Google Autocomplete',
    creditCost: 1,
    requiredPlan: 'Starter',
    category: 'research',
  },
  {
    key: 'keyword_clustering',
    name: 'Keyword Clustering',
    description: 'AI-powered keyword similarity grouping',
    creditCost: 5,
    requiredPlan: 'Starter',
    category: 'research',
  },
  {
    key: 'answer_the_public',
    name: 'Answer The Public',
    description: 'Discover questions people ask about topics',
    creditCost: 2,
    requiredPlan: 'Starter',
    category: 'research',
  },
  {
    key: 'paa_extractor',
    name: 'People Also Ask Extractor',
    description: 'Extract PAA questions from SERP',
    creditCost: 1,
    requiredPlan: 'Starter',
    category: 'research',
  },

  // Content Features
  {
    key: 'content_repurpose',
    name: 'Content Repurposing',
    description: 'Transform content for multiple platforms',
    creditCost: 5,
    requiredPlan: 'Starter',
    category: 'content',
  },
  {
    key: 'ai_content_brief',
    name: 'AI Content Briefs',
    description: 'Generate AI-powered content briefs',
    creditCost: 5,
    requiredPlan: 'Pro',
    category: 'content',
  },
  {
    key: 'meta_description_generator',
    name: 'Meta Description Generator',
    description: 'Generate optimized meta descriptions',
    creditCost: 1,
    requiredPlan: 'Starter',
    category: 'content',
  },
  {
    key: 'chatgpt_optimization',
    name: 'ChatGPT Citation Optimization',
    description: 'Optimize content for ChatGPT citations',
    creditCost: 5,
    requiredPlan: 'Pro',
    category: 'content',
  },

  // SERP & Rankings
  {
    key: 'serp_analysis',
    name: 'SERP Analysis',
    description: 'Analyze SERP features and competitors',
    creditCost: 2,
    requiredPlan: 'Starter',
    category: 'research',
  },
  {
    key: 'serp_similarity',
    name: 'SERP Similarity Analysis',
    description: 'Compare SERP similarities across keywords',
    creditCost: 3,
    requiredPlan: 'Pro',
    category: 'research',
  },
  {
    key: 'rank_tracking',
    name: 'Rank Tracking',
    description: 'Track keyword rankings over time',
    creditCost: 0.1, // per keyword
    requiredPlan: 'Starter',
    category: 'research',
  },

  // Competitive Features
  {
    key: 'competitor_analysis',
    name: 'Competitor Analysis',
    description: 'Analyze competitor SEO strategies',
    creditCost: 3,
    requiredPlan: 'Pro',
    category: 'competitive',
  },
  {
    key: 'content_gap_analysis',
    name: 'Content Gap Analysis',
    description: 'Find content opportunities vs competitors',
    creditCost: 10,
    requiredPlan: 'Pro',
    category: 'competitive',
  },
  {
    key: 'backlink_analysis',
    name: 'Backlink Analysis',
    description: 'Analyze backlink profiles',
    creditCost: 3,
    requiredPlan: 'Pro',
    category: 'competitive',
  },
  {
    key: 'competitor_monitoring',
    name: 'Competitor Monitoring',
    description: 'Automated competitor tracking and alerts',
    creditCost: 1, // per competitor
    requiredPlan: 'Pro',
    category: 'competitive',
  },

  // Technical SEO
  {
    key: 'technical_audit',
    name: 'Technical SEO Audit',
    description: 'Complete technical SEO site audit',
    creditCost: 10,
    requiredPlan: 'Starter',
    category: 'technical',
  },
  {
    key: 'site_crawl',
    name: 'Site Crawler',
    description: 'Crawl and analyze site structure',
    creditCost: 0.1, // per page
    requiredPlan: 'Starter',
    category: 'technical',
  },
  {
    key: 'cwv_check',
    name: 'Core Web Vitals Checker',
    description: 'Check Core Web Vitals scores',
    creditCost: 1,
    requiredPlan: 'Starter',
    category: 'technical',
  },
  {
    key: 'schema_validation',
    name: 'Schema Validator',
    description: 'Validate structured data markup',
    creditCost: 0.5,
    requiredPlan: 'Starter',
    category: 'technical',
  },

  // Advanced Features
  {
    key: 'ai_overview_check',
    name: 'AI Overview Checker',
    description: 'Check AI Overview rankings',
    creditCost: 2,
    requiredPlan: 'Starter',
    category: 'advanced',
  },
  {
    key: 'ai_overview_optimization',
    name: 'AI Overview Optimization',
    description: 'Optimize for AI Overview appearance',
    creditCost: 5,
    requiredPlan: 'Pro',
    category: 'advanced',
  },
  {
    key: 'citation_optimization',
    name: 'Citation Optimization',
    description: 'Optimize for AI citation visibility',
    creditCost: 5,
    requiredPlan: 'Pro',
    category: 'advanced',
  },
  {
    key: 'bulk_analyzer',
    name: 'Bulk URL Analyzer',
    description: 'Analyze hundreds of URLs at once',
    creditCost: 0.5, // per URL
    requiredPlan: 'Pro',
    category: 'advanced',
  },
  {
    key: 'local_seo_audit',
    name: 'Local SEO Audit',
    description: 'Complete local SEO audit and optimization',
    creditCost: 5,
    requiredPlan: 'Pro',
    category: 'advanced',
  },

  // Reporting
  {
    key: 'automated_reporting',
    name: 'Automated Reports',
    description: 'Generate and schedule SEO reports',
    creditCost: 3,
    requiredPlan: 'Agency',
    category: 'reporting',
  },
  {
    key: 'white_label_reports',
    name: 'White-Label Reports',
    description: 'Branded reports for clients',
    creditCost: 0,
    requiredPlan: 'Agency',
    category: 'reporting',
  },
  {
    key: 'api_access',
    name: 'API Access',
    description: 'API access for integrations',
    creditCost: 0,
    requiredPlan: 'Agency',
    category: 'advanced',
  },
];

/**
 * Plan hierarchy for feature access comparison
 */
const PLAN_HIERARCHY: Record<PlanName, number> = {
  'Free': 0,
  'Starter': 1,
  'Pro': 2,
  'Agency': 3,
  'Enterprise': 4,
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
 */
export function getPlanName(
  subscriptionPlan: { name: string } | null | undefined
): PlanName {
  if (!subscriptionPlan) return 'Free';
  
  const name = subscriptionPlan.name;
  if (name === 'Professional') return 'Pro';
  
  return (name as PlanName) || 'Free';
}

