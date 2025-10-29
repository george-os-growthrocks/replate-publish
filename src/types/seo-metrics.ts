/**
 * TypeScript Interfaces for SEO Metrics
 * Comprehensive type definitions for all SEO calculations
 */

// ==================== TRAFFIC & CTR ====================

export interface TrafficPotentialEstimate {
  position: number;
  searchVolume: number;
  ctr: number;
  estimatedClicks: number;
  device: 'desktop' | 'mobile' | 'combined';
  serpFeatureImpact?: SerpFeatureImpact[];
  brandBoost?: number;
  totalEstimatedTraffic: number;
}

export interface SerpFeatureImpact {
  feature: string;
  impact: number; // -0.25 to +0.20
  explanation: string;
}

// ==================== KEYWORD DIFFICULTY ====================

export interface EnhancedKeywordDifficulty {
  overallScore: number; // 0-100
  breakdown: {
    domainAuthority: number;
    avgBacklinks: number;
    contentQuality: number;
    serpFeatures: number;
    rankVolatility: number;
  };
  interpretation: {
    label: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
    color: string;
    description: string;
  };
  competitionLevel: 'low' | 'medium' | 'high' | 'very_high';
}

// ==================== KEYWORD VALUE & ROI ====================

export interface KeywordValue {
  monthlyValue: number; // in currency
  searchVolume: number;
  cpc: number;
  estimatedClicks: number;
  opportunityScore: number; // 0-200+
  priority: 'high' | 'medium' | 'low';
  roi: {
    potential: number;
    difficulty: number;
    ratio: number; // value/difficulty
  };
}

// ==================== SEARCH INTENT ====================

export interface IntentAnalysis {
  primary: 'informational' | 'commercial' | 'transactional' | 'navigational';
  confidence: number; // 0-100
  buyingStage: 'awareness' | 'consideration' | 'decision';
  urgency: number; // 0-100
  commercialScore: number; // 0-100 (likelihood to convert)
  indicators: {
    transactionalKeywords: string[];
    commercialKeywords: string[];
    informationalKeywords: string[];
  };
  recommendation: string;
}

// ==================== CONTENT GAP ====================

export interface ContentGapAnalysis {
  wordCountGap: {
    current: number;
    topResultsAverage: number;
    recommended: number;
    gap: number;
  };
  topicalDepth: {
    score: number; // 0-100
    topicsNeeded: string[];
    topicsCovered: string[];
    coveragePercentage: number;
  };
  backlinksNeeded: number;
  timeToRank: {
    min: number; // months
    max: number; // months
    realistic: number; // months
  };
  competitiveAdvantages: string[];
  weaknesses: string[];
  recommendations: string[];
}

// ==================== BACKLINK GAP ====================

export interface BacklinkGapAnalysis {
  currentBacklinks: number;
  topResultsAverage: number;
  estimatedBacklinksNeeded: number;
  gap: number;
  gapPercentage: number;
  qualityBreakdown: {
    tier1Needed: number; // DA 70+
    tier2Needed: number; // DA 50-69
    tier3Needed: number; // DA 30-49
    tier4Needed: number; // DA 0-29
  };
  qualityOverQuantity: boolean;
  backlinkGapScore: number; // 0-100 (0 = no gap, 100 = huge gap)
  recommendation: string;
}

// ==================== TREND & SEASONALITY ====================

export interface TrendAnalysis {
  isSeasonal: boolean;
  peakMonths: number[]; // 1-12
  lowMonths: number[];
  growthRate: number; // YoY percentage
  forecast3Months: MonthlyForecast[];
  seasonalityPattern: 'holiday' | 'weather' | 'event' | 'stable' | 'trending';
  confidence: number; // 0-100
  volatility: number; // 0-100
}

export interface MonthlyForecast {
  month: number;
  year: number;
  predictedVolume: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

// ==================== SERP VOLATILITY ====================

export interface VolatilityMetrics {
  volatilityScore: number; // 0-100 (0=stable, 100=chaos)
  rankingChurnRate: number; // percentage
  opportunityWindow: 'open' | 'competitive' | 'locked';
  interpretation: {
    label: 'Stable' | 'Moderate' | 'High';
    color: string;
    description: string;
  };
  explanation: string;
  historicalChanges: number; // number of ranking changes in period
}

// ==================== CONTENT FRESHNESS ====================

export interface FreshnessAnalysis {
  avgTopResultAge: number; // days since last update
  freshnessImportance: 'critical' | 'important' | 'minor';
  updateFrequencyRecommended: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recentContentBonus: number; // 0-0.30 (percentage boost)
  queryType: 'news' | 'trending' | 'evergreen' | 'seasonal';
  recommendation: string;
}

// ==================== TOPIC CLUSTERING ====================

export interface TopicCluster {
  parentTopic: string;
  childKeywords: KeywordClusterMember[];
  totalSearchVolume: number;
  avgDifficulty: number;
  estimatedTraffic: number;
  contentPiecesNeeded: number;
  priorityOrder: string[];
  clusterScore: number; // 0-100 (quality of cluster)
}

export interface KeywordClusterMember {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  similarity: number; // 0-1 (similarity to parent topic)
  priority: number; // 1-N (order to target)
}

// ==================== COMPETITIVE POSITIONING ====================

export interface CompetitivePositioning {
  canOutrank: {
    probability: number; // 0-100
    confidence: 'low' | 'medium' | 'high';
    explanation: string;
  };
  realisticCeiling: {
    position: number; // 1-20
    timeframe: number; // months
    effort: 'low' | 'medium' | 'high' | 'very_high';
  };
  requiredImprovements: Improvement[];
  competitiveStrengths: string[];
  competitiveWeaknesses: string[];
}

export interface Improvement {
  area: 'content' | 'backlinks' | 'technical' | 'authority' | 'freshness';
  current: number;
  target: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

// ==================== CONTENT RECOMMENDATIONS ====================

export interface ContentRecommendations {
  wordCount: {
    min: number;
    ideal: number;
    max: number;
    reasoning: string;
  };
  headingStructure: {
    h2Count: number;
    h3Count: number;
    suggestedTopics: string[];
  };
  keywordDensity: {
    current?: number;
    target: number;
    primaryKeyword: string;
    secondaryKeywords: string[];
  };
  contentFormat: {
    recommended: 'listicle' | 'guide' | 'comparison' | 'tutorial' | 'review';
    reasoning: string;
  };
  mediaRecommendations: {
    images: number;
    videos: number;
    infographics: number;
  };
}

// ==================== OPPORTUNITY MATRIX ====================

export interface OpportunityMatrix {
  quadrant: 'quick_wins' | 'long_term' | 'low_priority' | 'hard_targets';
  coordinates: {
    value: number; // x-axis (0-100)
    difficulty: number; // y-axis (0-100)
  };
  score: number; // overall opportunity score
  recommendation: string;
}

// ==================== COMPOSITE KEYWORD METRICS ====================

export interface ComprehensiveKeywordMetrics {
  keyword: string;
  basicMetrics: {
    searchVolume: number;
    cpc: number;
    competition: number;
  };
  trafficPotential: TrafficPotentialEstimate;
  difficulty: EnhancedKeywordDifficulty;
  value: KeywordValue;
  intent: IntentAnalysis;
  trend: TrendAnalysis;
  volatility: VolatilityMetrics;
  freshness: FreshnessAnalysis;
  contentGap?: ContentGapAnalysis;
  backlinkGap?: BacklinkGapAnalysis;
  positioning?: CompetitivePositioning;
  recommendations: ContentRecommendations;
  opportunityMatrix: OpportunityMatrix;
  lastUpdated: Date;
}

// ==================== SERP ANALYSIS ====================

export interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  description?: string;
  domainAuthority?: number;
  backlinks?: number;
  contentLength?: number;
  lastUpdated?: Date;
  serpFeatures?: string[];
}

export interface SerpAnalysis {
  keyword: string;
  results: SerpResult[];
  avgDomainAuthority: number;
  avgBacklinks: number;
  avgContentLength: number;
  serpFeaturesPresent: string[];
  competitionLevel: 'low' | 'medium' | 'high' | 'very_high';
}

// ==================== HISTORICAL DATA ====================

export interface HistoricalRankingData {
  keyword: string;
  date: Date;
  position: number;
  searchVolume: number;
  url?: string;
}

export interface MonthlySearchVolume {
  month: number; // 1-12
  year: number;
  searchVolume: number;
}

// ==================== UTILITY TYPES ====================

export type DifficultyLevel = 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type IntentType = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type BuyingStage = 'awareness' | 'consideration' | 'decision';
export type OpportunityWindow = 'open' | 'competitive' | 'locked';
export type ContentFormat = 'listicle' | 'guide' | 'comparison' | 'tutorial' | 'review';
export type SeasonalityPattern = 'holiday' | 'weather' | 'event' | 'stable' | 'trending';
export type FreshnessLevel = 'critical' | 'important' | 'minor';
export type UpdateFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// ==================== CALCULATION OPTIONS ====================

export interface SEOCalculationOptions {
  device?: 'desktop' | 'mobile' | 'combined';
  includeBrandBoost?: boolean;
  includeSeasonality?: boolean;
  historicalDataMonths?: number;
  confidenceThreshold?: number;
  customWeights?: Partial<typeof import('../lib/seo-constants').KD_WEIGHTS>;
}
