/**
 * SEO Math & Scoring Utilities
 * Based on DataForSEO integration patterns
 */

// Baseline CTR by position (industry S-curve)
const BASELINE_CTR = [
  0.28,  // Position 1
  0.15,  // Position 2
  0.11,  // Position 3
  0.08,  // Position 4
  0.06,  // Position 5
  0.05,  // Position 6
  0.04,  // Position 7
  0.035, // Position 8
  0.03,  // Position 9
  0.025, // Position 10
];

export interface SerpFeatures {
  fs?: boolean; // Featured snippet
  paa?: boolean; // People Also Ask
  adsTop?: number; // Number of top ads
  sitelinks?: boolean; // Sitelinks
}

/**
 * Calculate expected CTR based on position and SERP features
 */
export function calculateExpectedCtr(
  position: number,
  features: SerpFeatures = {}
): number {
  const pos = Math.min(Math.max(1, Math.round(position)), 10);
  let baseCtr = BASELINE_CTR[pos - 1] ?? 0.02;

  // Adjust for SERP features
  if (features.fs) baseCtr *= 1.20; // Featured snippet benefit
  if (features.paa) baseCtr *= 0.94; // PAAs push down
  if ((features.adsTop ?? 0) >= 3) baseCtr *= 0.85; // Heavy ads
  if (features.sitelinks) baseCtr *= 1.08; // Sitelinks boost

  return Math.max(0.005, Math.min(0.60, baseCtr));
}

export interface CtrGapResult {
  ctrExpected: number;
  gap: number;
  potentialExtraClicks: number;
  opportunity: "high" | "medium" | "low";
}

/**
 * Calculate CTR gap opportunity
 */
export function calculateCtrGapOpportunity(
  impressions: number,
  ctrObserved: number,
  position: number,
  features: SerpFeatures = {}
): CtrGapResult {
  const ctrExpected = calculateExpectedCtr(position, features);
  const gap = Math.max(0, ctrExpected - ctrObserved);
  const potentialExtraClicks = Math.round(impressions * gap);

  let opportunity: "high" | "medium" | "low" = "low";
  if (potentialExtraClicks > 100) opportunity = "high";
  else if (potentialExtraClicks > 20) opportunity = "medium";

  return {
    ctrExpected,
    gap,
    potentialExtraClicks,
    opportunity,
  };
}

export type KeywordIntent = "info" | "comm" | "nav";

/**
 * Calculate keyword value score (volume × CPC × intent)
 */
export function calculateKeywordValue(
  volume: number,
  cpc: number,
  intent: KeywordIntent = "info"
): number {
  const intentMultiplier = intent === "comm" ? 1.0 : intent === "nav" ? 0.7 : 0.5;
  return volume * cpc * intentMultiplier;
}

export interface PageMetrics {
  position: number;
  impressions: number;
  clicks?: number;
}

/**
 * Calculate cannibalization score
 * Higher score = worse cannibalization
 */
export function calculateCannibalizationScore(pages: PageMetrics[]): number {
  if (pages.length <= 1) return 0;

  const n = pages.length;
  const imprTotal = pages.reduce((a, b) => a + b.impressions, 0) || 1;

  // Calculate weighted average position
  const weightedPos = pages.reduce(
    (a, b) => a + b.position * (b.impressions / imprTotal),
    0
  );

  // Calculate variance in positions
  const variance = pages.reduce(
    (a, b) =>
      a + Math.pow(b.position - weightedPos, 2) * (b.impressions / imprTotal),
    0
  );

  // More pages and higher variance => worse
  return parseFloat(((n - 1) * (1 + variance / 10)).toFixed(2));
}

/**
 * Calculate internal link opportunity score
 */
export function calculateLinkOpportunityScore(
  donorAuthority: number, // 0..1, normalized from backlinks.rank or ref.domains
  topicalOverlap: number, // 0..1, TF-IDF or keyword intersection
  targetNeed: number // 0..1, normalized from CTR gap
): number {
  return parseFloat(
    (0.5 * donorAuthority + 0.3 * topicalOverlap + 0.2 * targetNeed).toFixed(3)
  );
}

/**
 * Calculate priority score for actions
 * Formula: (Impact × Value) / Effort × Confidence
 */
export function calculatePriorityScore(
  impact: number, // 0..1
  value: number, // 0..1
  effort: number, // 0.2..1 (lower is better)
  confidence: number = 0.9 // 0..1
): number {
  const effortSafe = Math.max(0.2, effort);
  return parseFloat((((impact * value) / effortSafe) * confidence).toFixed(3));
}

/**
 * Normalize a value to 0..1 range
 */
export function normalize(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate topical overlap score from content analysis
 */
export function calculateTopicalOverlap(
  sourceKeywords: string[],
  targetKeywords: string[]
): number {
  if (sourceKeywords.length === 0 || targetKeywords.length === 0) return 0;

  const sourceSet = new Set(sourceKeywords.map(k => k.toLowerCase()));
  const targetSet = new Set(targetKeywords.map(k => k.toLowerCase()));

  let matches = 0;
  for (const keyword of sourceSet) {
    if (targetSet.has(keyword)) matches++;
  }

  // Jaccard similarity
  const union = new Set([...sourceSet, ...targetSet]);
  return matches / union.size;
}

/**
 * Estimate traffic value
 */
export function estimateTrafficValue(
  clicks: number,
  cpc: number,
  conversionRate: number = 0.02
): number {
  return clicks * cpc * conversionRate;
}

/**
 * Calculate page authority score from backlink metrics
 */
export function calculatePageAuthority(
  refDomains: number,
  backlinks: number,
  doFollowRatio: number = 1
): number {
  // Logarithmic scale for ref domains (diminishing returns)
  const domainScore = Math.log10(refDomains + 1) / Math.log10(1000); // normalized to 0-1 assuming 1000 is excellent
  
  // Linear scale for backlinks with diminishing weight
  const backlinksScore = Math.min(1, backlinks / 10000);
  
  // Combine with weights
  const score = (domainScore * 0.6 + backlinksScore * 0.3) * doFollowRatio;
  
  return Math.min(1, score);
}

