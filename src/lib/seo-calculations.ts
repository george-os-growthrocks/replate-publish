/**
 * SEO Calculations Engine
 * Advanced SEO math and logic for keyword analysis
 */

import {
  CTR_BY_POSITION_DESKTOP,
  CTR_BY_POSITION_MOBILE,
  SERP_FEATURES_CTR_IMPACT,
  KD_WEIGHTS,
  KD_DIFFICULTY_RANGES,
  INTENT_KEYWORDS,
  BUYING_STAGE_KEYWORDS,
  CONTENT_QUALITY_BENCHMARKS,
  BACKLINK_QUALITY_TIERS,
  VOLATILITY_THRESHOLDS,
  FRESHNESS_IMPACT,
  TIME_TO_RANK_ESTIMATES,
  OPPORTUNITY_SCORE_RANGES,
  BRAND_CTR_BOOST,
  COMPETITION_WEIGHTS,
} from './seo-constants';

import type {
  TrafficPotentialEstimate,
  SerpFeatureImpact,
  EnhancedKeywordDifficulty,
  KeywordValue,
  IntentAnalysis,
  ContentGapAnalysis,
  BacklinkGapAnalysis,
  TrendAnalysis,
  VolatilityMetrics,
  FreshnessAnalysis,
  TopicCluster,
  CompetitivePositioning,
  ContentRecommendations,
  OpportunityMatrix,
  SerpResult,
  MonthlySearchVolume,
  SEOCalculationOptions,
} from '@/types/seo-metrics';

// ==================== 1. ENHANCED TRAFFIC POTENTIAL ====================

/**
 * Calculate traffic potential with industry-standard CTR curves
 * Includes SERP features impact, device type, and brand boost
 */
export function calculateTrafficPotential(
  position: number,
  searchVolume: number,
  serpFeatures: string[] = [],
  options: SEOCalculationOptions = {}
): TrafficPotentialEstimate {
  const device = options.device || 'desktop';
  const includeBrandBoost = options.includeBrandBoost || false;

  // Get base CTR for position
  const ctrTable = device === 'mobile' ? CTR_BY_POSITION_MOBILE : CTR_BY_POSITION_DESKTOP;
  let baseCtr = ctrTable[Math.min(position, 20) as keyof typeof ctrTable] || 0.01;

  // Calculate SERP features impact
  const serpImpacts: SerpFeatureImpact[] = [];
  let totalSerpImpact = 0;

  serpFeatures.forEach(feature => {
    const featureKey = feature.toLowerCase().replace(/\s+/g, '_');
    const impact = SERP_FEATURES_CTR_IMPACT[featureKey as keyof typeof SERP_FEATURES_CTR_IMPACT];
    
    if (impact !== undefined) {
      serpImpacts.push({
        feature,
        impact,
        explanation: impact > 0 ? `+${(impact * 100).toFixed(0)}% if you own it` : `${(impact * 100).toFixed(0)}% CTR reduction`
      });
      totalSerpImpact += impact;
    }
  });

  // Apply SERP features impact
  let adjustedCtr = baseCtr * (1 + totalSerpImpact);

  // Apply brand boost if applicable
  let brandBoost = 0;
  if (includeBrandBoost) {
    brandBoost = BRAND_CTR_BOOST;
    adjustedCtr *= (1 + brandBoost);
  }

  // Ensure CTR doesn't exceed realistic limits
  adjustedCtr = Math.min(adjustedCtr, 0.50); // Max 50% CTR
  adjustedCtr = Math.max(adjustedCtr, 0); // Min 0% CTR

  const estimatedClicks = Math.round(searchVolume * adjustedCtr);

  return {
    position,
    searchVolume,
    ctr: adjustedCtr,
    estimatedClicks,
    device,
    serpFeatureImpact: serpImpacts.length > 0 ? serpImpacts : undefined,
    brandBoost: includeBrandBoost ? brandBoost : undefined,
    totalEstimatedTraffic: estimatedClicks,
  };
}

// ==================== 2. ENHANCED KEYWORD DIFFICULTY ====================

/**
 * Calculate composite keyword difficulty score
 * Factors: Domain Authority, Backlinks, Content Quality, SERP Features, Volatility
 */
export function calculateEnhancedDifficulty(
  serpResults: SerpResult[],
  baseKD?: number
): EnhancedKeywordDifficulty {
  // Calculate average metrics from SERP results
  const avgDA = serpResults.reduce((sum, r) => sum + (r.domainAuthority || 50), 0) / Math.max(serpResults.length, 1);
  const avgBacklinks = serpResults.reduce((sum, r) => sum + (r.backlinks || 0), 0) / Math.max(serpResults.length, 1);
  const avgContentLength = serpResults.reduce((sum, r) => sum + (r.contentLength || 1500), 0) / Math.max(serpResults.length, 1);
  
  // Count SERP features
  const allSerpFeatures = new Set(serpResults.flatMap(r => r.serpFeatures || []));
  const serpFeaturesCount = allSerpFeatures.size;

  // Normalize scores to 0-100
  const daScore = Math.min((avgDA / 100) * 100, 100);
  const backlinksScore = Math.min((Math.log10(avgBacklinks + 1) / 5) * 100, 100);
  const contentScore = Math.min((avgContentLength / 3000) * 100, 100);
  const serpScore = Math.min((serpFeaturesCount / 8) * 100, 100);
  const volatilityScore = baseKD || 50; // Use provided KD or default

  // Calculate weighted difficulty
  const overallScore = Math.round(
    (daScore * KD_WEIGHTS.domain_authority) +
    (backlinksScore * KD_WEIGHTS.avg_backlinks) +
    (contentScore * KD_WEIGHTS.content_quality) +
    (serpScore * KD_WEIGHTS.serp_features) +
    (volatilityScore * KD_WEIGHTS.rank_volatility)
  );

  // Determine interpretation
  let interpretation: EnhancedKeywordDifficulty['interpretation'];
  let competitionLevel: EnhancedKeywordDifficulty['competitionLevel'];

  if (overallScore <= 20) {
    interpretation = { label: 'Very Easy', color: 'emerald', description: 'Low competition, great opportunity' };
    competitionLevel = 'low';
  } else if (overallScore <= 40) {
    interpretation = { label: 'Easy', color: 'green', description: 'Moderate competition, good target' };
    competitionLevel = 'low';
  } else if (overallScore <= 60) {
    interpretation = { label: 'Medium', color: 'yellow', description: 'Competitive, requires effort' };
    competitionLevel = 'medium';
  } else if (overallScore <= 80) {
    interpretation = { label: 'Hard', color: 'orange', description: 'Very competitive, significant effort needed' };
    competitionLevel = 'high';
  } else {
    interpretation = { label: 'Very Hard', color: 'red', description: 'Extremely competitive, long-term strategy' };
    competitionLevel = 'very_high';
  }

  return {
    overallScore,
    breakdown: {
      domainAuthority: daScore,
      avgBacklinks: backlinksScore,
      contentQuality: contentScore,
      serpFeatures: serpScore,
      rankVolatility: volatilityScore,
    },
    interpretation,
    competitionLevel,
  };
}

// ==================== 3. KEYWORD VALUE & ROI SCORING ====================

/**
 * Calculate keyword value and opportunity score
 * Factors: Search Volume, CPC, Estimated CTR, Difficulty
 */
export function calculateKeywordValue(
  searchVolume: number,
  cpc: number,
  difficulty: number
): KeywordValue {
  // Estimate clicks at position 1 (31.6% CTR)
  const estimatedClicks = Math.round(searchVolume * 0.316);
  
  // Calculate monthly value if ranked #1
  const monthlyValue = estimatedClicks * cpc;
  
  // Calculate opportunity score (higher value, lower difficulty = better)
  // Formula: (monthlyValue / (difficulty + 1)) to avoid division by zero
  const opportunityScore = monthlyValue / Math.max(difficulty + 1, 1);
  
  // Determine priority
  let priority: 'high' | 'medium' | 'low';
  if (opportunityScore >= OPPORTUNITY_SCORE_RANGES.high.min) {
    priority = 'high';
  } else if (opportunityScore >= OPPORTUNITY_SCORE_RANGES.medium.min) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    monthlyValue,
    searchVolume,
    cpc,
    estimatedClicks,
    opportunityScore,
    priority,
    roi: {
      potential: monthlyValue,
      difficulty,
      ratio: opportunityScore,
    },
  };
}

// ==================== 4. SEARCH INTENT ANALYSIS ====================

/**
 * Analyze search intent with multi-dimensional scoring
 * Classifies intent and buying stage
 */
export function analyzeSearchIntent(
  keyword: string,
  cpc: number = 0,
  serpFeatures: string[] = []
): IntentAnalysis {
  const lowerKeyword = keyword.toLowerCase();
  
  // Count keyword indicators
  const transactionalCount = INTENT_KEYWORDS.transactional.filter(word => 
    lowerKeyword.includes(word)
  ).length;
  
  const commercialCount = INTENT_KEYWORDS.commercial.filter(word => 
    lowerKeyword.includes(word)
  ).length;
  
  const informationalCount = INTENT_KEYWORDS.informational.filter(word => 
    lowerKeyword.includes(word)
  ).length;
  
  const navigationalCount = INTENT_KEYWORDS.navigational.filter(word => 
    lowerKeyword.includes(word)
  ).length;

  // Determine primary intent
  const scores = {
    transactional: transactionalCount * 3 + (cpc > 2 ? 2 : 0),
    commercial: commercialCount * 2 + (cpc > 1 ? 1 : 0),
    informational: informationalCount * 2,
    navigational: navigationalCount * 3,
  };

  let primary: IntentAnalysis['primary'] = 'informational';
  let maxScore = scores.informational;

  if (scores.transactional > maxScore) {
    primary = 'transactional';
    maxScore = scores.transactional;
  }
  if (scores.commercial > maxScore) {
    primary = 'commercial';
    maxScore = scores.commercial;
  }
  if (scores.navigational > maxScore) {
    primary = 'navigational';
    maxScore = scores.navigational;
  }

  // Calculate confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(Math.round((maxScore / totalScore) * 100), 100) : 50;

  // Determine buying stage
  let buyingStage: IntentAnalysis['buyingStage'] = 'awareness';
  
  if (BUYING_STAGE_KEYWORDS.decision.some(word => lowerKeyword.includes(word))) {
    buyingStage = 'decision';
  } else if (BUYING_STAGE_KEYWORDS.consideration.some(word => lowerKeyword.includes(word))) {
    buyingStage = 'consideration';
  }

  // Calculate commercial score (likelihood to convert)
  const commercialScore = Math.min(
    Math.round((scores.transactional * 40 + scores.commercial * 30 + cpc * 10) / 2),
    100
  );

  // Calculate urgency
  const urgencyWords = ['now', 'today', 'urgent', 'fast', 'quick', 'immediately'];
  const urgency = urgencyWords.some(word => lowerKeyword.includes(word)) ? 80 : 
                  primary === 'transactional' ? 60 : 30;

  // Generate recommendation
  let recommendation = '';
  if (primary === 'transactional') {
    recommendation = 'Create product/sales pages with clear CTAs and pricing';
  } else if (primary === 'commercial') {
    recommendation = 'Create comparison content, reviews, or buying guides';
  } else if (primary === 'informational') {
    recommendation = 'Create educational content, tutorials, or guides';
  } else {
    recommendation = 'Optimize brand pages and improve site navigation';
  }

  return {
    primary,
    confidence,
    buyingStage,
    urgency,
    commercialScore,
    indicators: {
      transactionalKeywords: INTENT_KEYWORDS.transactional.filter(word => lowerKeyword.includes(word)),
      commercialKeywords: INTENT_KEYWORDS.commercial.filter(word => lowerKeyword.includes(word)),
      informationalKeywords: INTENT_KEYWORDS.informational.filter(word => lowerKeyword.includes(word)),
    },
    recommendation,
  };
}

// ==================== 5. CONTENT GAP ANALYSIS ====================

/**
 * Analyze content gaps vs top-ranking competitors
 */
export function analyzeContentGap(
  currentContentLength: number,
  serpResults: SerpResult[],
  difficulty: number,
  intent: IntentAnalysis['primary']
): ContentGapAnalysis {
  // Calculate average word count of top results
  const topResultsAverage = Math.round(
    serpResults.reduce((sum, r) => sum + (r.contentLength || 1500), 0) / Math.max(serpResults.length, 1)
  );

  // Get recommended word count based on intent
  const benchmark = CONTENT_QUALITY_BENCHMARKS.word_count[intent] || 
                    CONTENT_QUALITY_BENCHMARKS.word_count.informational;
  
  const recommended = Math.max(topResultsAverage, benchmark.ideal);
  const gap = recommended - currentContentLength;

  // Estimate time to rank based on difficulty
  let timeToRank: ContentGapAnalysis['timeToRank'];
  if (difficulty <= 20) {
    timeToRank = { min: 1, max: 3, realistic: 2 };
  } else if (difficulty <= 40) {
    timeToRank = { min: 2, max: 4, realistic: 3 };
  } else if (difficulty <= 60) {
    timeToRank = { min: 3, max: 6, realistic: 4.5 };
  } else if (difficulty <= 80) {
    timeToRank = { min: 6, max: 12, realistic: 9 };
  } else {
    timeToRank = { min: 12, max: 24, realistic: 18 };
  }

  // Calculate backlinks needed (rough estimate)
  const avgBacklinks = serpResults.reduce((sum, r) => sum + (r.backlinks || 0), 0) / Math.max(serpResults.length, 1);
  const backlinksNeeded = Math.round(avgBacklinks * 0.7); // Aim for 70% of average

  // Generate recommendations
  const recommendations: string[] = [
    `Write at least ${recommended.toLocaleString()} words of comprehensive content`,
    `Include ${Math.round(recommended / 200)} H2 headings covering key subtopics`,
    `Acquire approximately ${backlinksNeeded} quality backlinks`,
    `Update content every ${intent === 'informational' ? 'quarter' : 'month'} to stay fresh`,
  ];

  if (gap > 1000) {
    recommendations.push('Significant content expansion needed - consider breaking into multiple pieces');
  }

  return {
    wordCountGap: {
      current: currentContentLength,
      topResultsAverage,
      recommended,
      gap,
    },
    topicalDepth: {
      score: currentContentLength >= recommended ? 85 : Math.round((currentContentLength / recommended) * 85),
      topicsNeeded: [], // Would need NLP analysis
      topicsCovered: [],
      coveragePercentage: Math.min(Math.round((currentContentLength / recommended) * 100), 100),
    },
    backlinksNeeded,
    timeToRank,
    competitiveAdvantages: [],
    weaknesses: gap > 500 ? ['Content length below average'] : [],
    recommendations,
  };
}

// ==================== 6. BACKLINK GAP CALCULATOR ====================

/**
 * Calculate backlink gap vs competitors
 */
export function calculateBacklinkGap(
  currentBacklinks: number,
  serpResults: SerpResult[]
): BacklinkGapAnalysis {
  const topResultsAverage = Math.round(
    serpResults.reduce((sum, r) => sum + (r.backlinks || 0), 0) / Math.max(serpResults.length, 1)
  );

  const estimatedNeeded = Math.max(0, Math.round(topResultsAverage * 0.7));
  const gap = estimatedNeeded - currentBacklinks;
  const gapPercentage = currentBacklinks > 0 
    ? Math.round((gap / currentBacklinks) * 100) 
    : 100;

  // Calculate quality breakdown
  const qualityBreakdown = {
    tier1Needed: Math.round(estimatedNeeded * 0.20), // 20% high authority
    tier2Needed: Math.round(estimatedNeeded * 0.30), // 30% medium authority
    tier3Needed: Math.round(estimatedNeeded * 0.30), // 30% low authority
    tier4Needed: Math.round(estimatedNeeded * 0.20), // 20% very low authority
  };

  // Quality over quantity if gap is large
  const qualityOverQuantity = gap > 100;

  // Gap score (0-100, higher = bigger gap)
  const backlinkGapScore = Math.min(Math.round((gap / Math.max(estimatedNeeded, 1)) * 100), 100);

  let recommendation = '';
  if (gap <= 0) {
    recommendation = 'You have sufficient backlinks. Focus on maintaining and improving quality.';
  } else if (gap < 20) {
    recommendation = `Acquire ${gap} more backlinks, focusing on high-quality sources (DA 50+).`;
  } else if (gap < 100) {
    recommendation = `Build ${gap} backlinks gradually. Prioritize ${qualityBreakdown.tier1Needed} high-authority links.`;
  } else {
    recommendation = `Large backlink gap. Focus on quality over quantity. Start with ${qualityBreakdown.tier1Needed} tier-1 links.`;
  }

  return {
    currentBacklinks,
    topResultsAverage,
    estimatedBacklinksNeeded: estimatedNeeded,
    gap: Math.max(0, gap),
    gapPercentage,
    qualityBreakdown,
    qualityOverQuantity,
    backlinkGapScore,
    recommendation,
  };
}

// ==================== 7. SERP VOLATILITY ANALYSIS ====================

/**
 * Calculate SERP volatility and ranking stability
 */
export function calculateSerpVolatility(
  historicalChanges: number,
  periodDays: number = 90
): VolatilityMetrics {
  // Calculate volatility score (0-100)
  const changesPerWeek = (historicalChanges / periodDays) * 7;
  const volatilityScore = Math.min(Math.round(changesPerWeek * 20), 100);

  // Calculate churn rate
  const rankingChurnRate = Math.min(Math.round((historicalChanges / 10) * 10), 100);

  // Determine opportunity window
  let opportunityWindow: VolatilityMetrics['opportunityWindow'];
  let interpretation: VolatilityMetrics['interpretation'];
  let explanation: string;

  if (volatilityScore <= VOLATILITY_THRESHOLDS.stable.max) {
    opportunityWindow = 'locked';
    interpretation = {
      label: 'Stable',
      color: 'emerald',
      description: 'Rankings are stable - established players dominate'
    };
    explanation = 'Low volatility indicates entrenched competitors. Ranking here requires significant authority and effort.';
  } else if (volatilityScore <= VOLATILITY_THRESHOLDS.moderate.max!) {
    opportunityWindow = 'competitive';
    interpretation = {
      label: 'Moderate',
      color: 'yellow',
      description: 'Some ranking movement - competitive but possible'
    };
    explanation = 'Moderate volatility shows active competition. Quality content and backlinks can break through.';
  } else {
    opportunityWindow = 'open';
    interpretation = {
      label: 'High',
      color: 'red',
      description: 'High volatility - opportunity to rank quickly'
    };
    explanation = 'High volatility means weak competition or new SERP. Great opportunity for quick rankings!';
  }

  return {
    volatilityScore,
    rankingChurnRate,
    opportunityWindow,
    interpretation,
    explanation,
    historicalChanges,
  };
}

// ==================== 8. CONTENT FRESHNESS ANALYSIS ====================

/**
 * Analyze content freshness requirements
 */
export function analyzeFreshness(
  keyword: string,
  serpResults: SerpResult[]
): FreshnessAnalysis {
  const now = new Date();
  
  // Calculate average age of top results
  const avgAge = Math.round(
    serpResults
      .filter(r => r.lastUpdated)
      .reduce((sum, r) => {
        const age = r.lastUpdated 
          ? Math.floor((now.getTime() - r.lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
          : 365;
        return sum + age;
      }, 0) / Math.max(serpResults.filter(r => r.lastUpdated).length, 1)
  );

  // Determine query type
  const lowerKeyword = keyword.toLowerCase();
  let queryType: FreshnessAnalysis['queryType'];
  let freshnessImportance: FreshnessAnalysis['freshnessImportance'];
  let updateFrequency: FreshnessAnalysis['updateFrequency'];
  let recentContentBonus: number;

  if (lowerKeyword.includes('news') || lowerKeyword.includes('today') || lowerKeyword.includes('2024') || lowerKeyword.includes('2025')) {
    queryType = 'news';
    freshnessImportance = 'critical';
    updateFrequency = 'daily';
    recentContentBonus = FRESHNESS_IMPACT.news.boost;
  } else if (lowerKeyword.includes('trending') || lowerKeyword.includes('latest') || lowerKeyword.includes('new')) {
    queryType = 'trending';
    freshnessImportance = 'critical';
    updateFrequency = 'weekly';
    recentContentBonus = FRESHNESS_IMPACT.trending.boost;
  } else if (lowerKeyword.includes('2024') || avgAge < 90) {
    queryType = 'seasonal';
    freshnessImportance = 'important';
    updateFrequency = 'monthly';
    recentContentBonus = FRESHNESS_IMPACT.seasonal.boost;
  } else {
    queryType = 'evergreen';
    freshnessImportance = 'minor';
    updateFrequency = 'quarterly';
    recentContentBonus = FRESHNESS_IMPACT.evergreen.boost;
  }

  const recommendation = freshnessImportance === 'critical'
    ? `Update content ${updateFrequency} to maintain rankings. Fresh content is critical for this query.`
    : freshnessImportance === 'important'
    ? `Update content ${updateFrequency}. Freshness provides a moderate ranking boost.`
    : `Update content ${updateFrequency} or when significant changes occur. Evergreen content is more important than freshness.`;

  return {
    avgTopResultAge: avgAge,
    freshnessImportance,
    updateFrequencyRecommended: updateFrequency,
    recentContentBonus,
    queryType,
    recommendation,
  };
}

// ==================== 9. TOPIC CLUSTERING ====================

/**
 * Create topic clusters from related keywords
 */
export function createTopicCluster(
  parentTopic: string,
  relatedKeywords: Array<{ keyword: string; searchVolume: number; difficulty: number }>
): TopicCluster {
  // Simple similarity calculation (would use NLP in production)
  const parentWords = new Set(parentTopic.toLowerCase().split(/\s+/));
  
  const childKeywords = relatedKeywords
    .map(kw => {
      const kwWords = new Set(kw.keyword.toLowerCase().split(/\s+/));
      const intersection = new Set([...parentWords].filter(x => kwWords.has(x)));
      const similarity = intersection.size / Math.max(parentWords.size, kwWords.size);
      
      return {
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        difficulty: kw.difficulty,
        similarity,
        priority: 0, // Will be set below
      };
    })
    .filter(kw => kw.similarity >= 0.3) // 30% similarity threshold
    .sort((a, b) => {
      // Sort by opportunity (high volume, low difficulty, high similarity)
      const aScore = (a.searchVolume / (a.difficulty + 1)) * a.similarity;
      const bScore = (b.searchVolume / (b.difficulty + 1)) * b.similarity;
      return bScore - aScore;
    })
    .map((kw, index) => ({
      ...kw,
      priority: index + 1,
    }));

  const totalSearchVolume = childKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0);
  const avgDifficulty = childKeywords.reduce((sum, kw) => sum + kw.difficulty, 0) / Math.max(childKeywords.length, 1);
  const estimatedTraffic = Math.round(totalSearchVolume * 0.15); // Assume 15% CTR across cluster
  
  // Estimate content pieces needed (1 piece per 3-5 keywords)
  const contentPiecesNeeded = Math.ceil(childKeywords.length / 4);

  // Cluster quality score
  const clusterScore = Math.min(
    Math.round((childKeywords.length * 10) + (totalSearchVolume / 100)),
    100
  );

  const priorityOrder = childKeywords
    .slice(0, 10)
    .map(kw => kw.keyword);

  return {
    parentTopic,
    childKeywords,
    totalSearchVolume,
    avgDifficulty,
    estimatedTraffic,
    contentPiecesNeeded,
    priorityOrder,
    clusterScore,
  };
}

// ==================== 10. COMPETITIVE POSITIONING ====================

/**
 * Analyze competitive positioning and ranking probability
 */
export function analyzeCompetitivePositioning(
  yourDomain: string,
  yourDA: number,
  yourBacklinks: number,
  serpResults: SerpResult[],
  difficulty: number
): CompetitivePositioning {
  const avgCompetitorDA = serpResults.reduce((sum, r) => sum + (r.domainAuthority || 50), 0) / Math.max(serpResults.length, 1);
  const avgCompetitorBacklinks = serpResults.reduce((sum, r) => sum + (r.backlinks || 0), 0) / Math.max(serpResults.length, 1);

  // Calculate probability to outrank
  const daRatio = yourDA / Math.max(avgCompetitorDA, 1);
  const backlinkRatio = yourBacklinks / Math.max(avgCompetitorBacklinks, 1);
  const difficultyFactor = (100 - difficulty) / 100;

  const probability = Math.min(
    Math.round(((daRatio * 40) + (backlinkRatio * 30) + (difficultyFactor * 30))),
    100
  );

  const confidence: 'low' | 'medium' | 'high' = 
    probability >= 70 ? 'high' :
    probability >= 40 ? 'medium' : 'low';

  const explanation = 
    probability >= 70 ? 'Strong indicators suggest you can rank well with proper optimization.' :
    probability >= 40 ? 'Moderate chance to rank. Focus on content quality and targeted backlinks.' :
    'Low probability. This is a long-term target requiring significant authority building.';

  // Realistic ceiling
  const realisticPosition = probability >= 70 ? 3 : probability >= 50 ? 5 : probability >= 30 ? 10 : 15;
  const timeframe = difficulty <= 40 ? 3 : difficulty <= 60 ? 6 : difficulty <= 80 ? 12 : 18;
  const effort = difficulty <= 40 ? 'low' : difficulty <= 60 ? 'medium' : difficulty <= 80 ? 'high' : 'very_high';

  // Required improvements
  const requiredImprovements: CompetitivePositioning['requiredImprovements'] = [];

  if (yourDA < avgCompetitorDA * 0.8) {
    requiredImprovements.push({
      area: 'authority',
      current: yourDA,
      target: Math.round(avgCompetitorDA * 0.9),
      priority: 'high',
      description: `Increase domain authority to ${Math.round(avgCompetitorDA * 0.9)}+`,
    });
  }

  if (yourBacklinks < avgCompetitorBacklinks * 0.7) {
    requiredImprovements.push({
      area: 'backlinks',
      current: yourBacklinks,
      target: Math.round(avgCompetitorBacklinks * 0.7),
      priority: 'high',
      description: `Acquire ${Math.round(avgCompetitorBacklinks * 0.7 - yourBacklinks)} quality backlinks`,
    });
  }

  return {
    canOutrank: {
      probability,
      confidence,
      explanation,
    },
    realisticCeiling: {
      position: realisticPosition,
      timeframe,
      effort,
    },
    requiredImprovements,
    competitiveStrengths: yourDA >= avgCompetitorDA ? ['Domain authority matches or exceeds competitors'] : [],
    competitiveWeaknesses: yourBacklinks < avgCompetitorBacklinks * 0.5 ? ['Significant backlink gap'] : [],
  };
}

// ==================== CONTENT RECOMMENDATIONS ====================

/**
 * Generate content recommendations based on intent and competition
 */
export function generateContentRecommendations(
  intent: IntentAnalysis['primary'],
  avgCompetitorLength: number,
  keyword: string
): ContentRecommendations {
  const benchmark = CONTENT_QUALITY_BENCHMARKS.word_count[intent] ||
                    CONTENT_QUALITY_BENCHMARKS.word_count.informational;

  const recommended = Math.max(avgCompetitorLength, benchmark.ideal);

  // Determine content format based on intent and keyword
  let contentFormat: ContentRecommendations['contentFormat'];
  const lowerKeyword = keyword.toLowerCase();

  if (lowerKeyword.includes('best') || lowerKeyword.includes('top')) {
    contentFormat = {
      recommended: 'listicle',
      reasoning: 'List format works well for "best" and "top" queries'
    };
  } else if (lowerKeyword.includes('vs') || lowerKeyword.includes('compare')) {
    contentFormat = {
      recommended: 'comparison',
      reasoning: 'Comparison table format ideal for versus queries'
    };
  } else if (lowerKeyword.includes('how to') || lowerKeyword.includes('tutorial')) {
    contentFormat = {
      recommended: 'tutorial',
      reasoning: 'Step-by-step tutorial format for how-to queries'
    };
  } else if (lowerKeyword.includes('review')) {
    contentFormat = {
      recommended: 'review',
      reasoning: 'In-depth review format for product/service reviews'
    };
  } else {
    contentFormat = {
      recommended: 'guide',
      reasoning: 'Comprehensive guide format for informational queries'
    };
  }

  return {
    wordCount: {
      min: benchmark.min,
      ideal: recommended,
      max: benchmark.max,
      reasoning: `Based on ${intent} intent and competitor average of ${avgCompetitorLength} words`
    },
    headingStructure: {
      h2Count: Math.round(recommended / 250),
      h3Count: Math.round(recommended / 150),
      suggestedTopics: []
    },
    keywordDensity: {
      target: CONTENT_QUALITY_BENCHMARKS.keyword_density.ideal,
      primaryKeyword: keyword,
      secondaryKeywords: []
    },
    contentFormat,
    mediaRecommendations: {
      images: Math.round(recommended / 500),
      videos: intent === 'informational' ? 1 : 0,
      infographics: intent === 'commercial' ? 1 : 0
    }
  };
}

// ==================== OPPORTUNITY MATRIX ====================

/**
 * Calculate opportunity matrix quadrant and score
 */
export function calculateOpportunityMatrix(
  value: number,
  difficulty: number
): OpportunityMatrix {
  // Normalize value to 0-100 scale (assuming max value around $1000)
  const normalizedValue = Math.min((value / 1000) * 100, 100);

  let quadrant: OpportunityMatrix['quadrant'];
  let recommendation: string;

  if (normalizedValue >= 50 && difficulty <= 50) {
    quadrant = 'quick_wins';
    recommendation = 'High priority target - High value with low difficulty. Start here!';
  } else if (normalizedValue >= 50 && difficulty > 50) {
    quadrant = 'long_term';
    recommendation = 'Long-term investment - High value but competitive. Plan sustained effort.';
  } else if (normalizedValue < 50 && difficulty <= 50) {
    quadrant = 'low_priority';
    recommendation = 'Low priority - Easy to rank but limited value. Consider if aligned with strategy.';
  } else {
    quadrant = 'hard_targets';
    recommendation = 'Avoid - Low value and high difficulty. Better opportunities exist.';
  }

  // Calculate overall opportunity score
  const score = Math.round((normalizedValue * 0.6) + ((100 - difficulty) * 0.4));

  return {
    quadrant,
    coordinates: {
      value: normalizedValue,
      difficulty
    },
    score,
    recommendation
  };
}
