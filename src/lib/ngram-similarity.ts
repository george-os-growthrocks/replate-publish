/**
 * N-gram Similarity Calculation
 * Used for keyword clustering and semantic similarity analysis
 */

/**
 * Calculate n-grams from a string
 */
function getNGrams(text: string, n: number): string[] {
  const normalized = text.toLowerCase().trim();
  const grams: string[] = [];
  
  for (let i = 0; i <= normalized.length - n; i++) {
    grams.push(normalized.substring(i, i + n));
  }
  
  return grams;
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate n-gram similarity between two strings
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculateNGramSimilarity(str1: string, str2: string, n: number = 2): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const grams1 = new Set(getNGrams(str1, n));
  const grams2 = new Set(getNGrams(str2, n));
  
  return jaccardSimilarity(grams1, grams2);
}

/**
 * Calculate combined similarity using multiple n-gram sizes
 * More robust than single n-gram size
 */
export function calculateCombinedSimilarity(str1: string, str2: string): number {
  const bigram = calculateNGramSimilarity(str1, str2, 2);
  const trigram = calculateNGramSimilarity(str1, str2, 3);
  const fourgram = calculateNGramSimilarity(str1, str2, 4);
  
  // Weighted average (bigrams are more important for short strings)
  return (bigram * 0.5 + trigram * 0.3 + fourgram * 0.2);
}

/**
 * Classify keyword intent based on patterns
 */
export function classifyKeywordIntent(keyword: string): 'informational' | 'navigational' | 'transactional' | 'commercial' {
  const lowerKeyword = keyword.toLowerCase();
  
  // Transactional intent patterns
  const transactionalPatterns = [
    'buy', 'purchase', 'order', 'shop', 'cart', 'checkout',
    'discount', 'coupon', 'deal', 'price', 'cheap', 'affordable',
    'subscribe', 'download', 'free trial'
  ];
  
  // Commercial intent patterns
  const commercialPatterns = [
    'best', 'top', 'review', 'comparison', 'vs', 'versus',
    'alternative', 'compare', 'recommended', 'rating'
  ];
  
  // Navigational intent patterns
  const navigationalPatterns = [
    'login', 'sign in', 'account', 'dashboard', 'portal',
    'official', 'website', 'homepage'
  ];
  
  // Check for transactional
  if (transactionalPatterns.some(pattern => lowerKeyword.includes(pattern))) {
    return 'transactional';
  }
  
  // Check for commercial
  if (commercialPatterns.some(pattern => lowerKeyword.includes(pattern))) {
    return 'commercial';
  }
  
  // Check for navigational
  if (navigationalPatterns.some(pattern => lowerKeyword.includes(pattern))) {
    return 'navigational';
  }
  
  // Default to informational
  return 'informational';
}

/**
 * Group keywords by similarity
 * Returns clusters of similar keywords
 */
export interface KeywordCluster {
  mainKeyword: string;
  similarKeywords: string[];
  intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  averageSimilarity: number;
}

export function clusterKeywords(
  keywords: string[],
  similarityThreshold: number = 0.5
): KeywordCluster[] {
  if (keywords.length === 0) return [];
  
  const clusters: KeywordCluster[] = [];
  const used = new Set<string>();
  
  for (const keyword of keywords) {
    if (used.has(keyword)) continue;
    
    const similarKeywords: string[] = [];
    let totalSimilarity = 0;
    
    for (const otherKeyword of keywords) {
      if (keyword === otherKeyword || used.has(otherKeyword)) continue;
      
      const similarity = calculateCombinedSimilarity(keyword, otherKeyword);
      if (similarity >= similarityThreshold) {
        similarKeywords.push(otherKeyword);
        totalSimilarity += similarity;
        used.add(otherKeyword);
      }
    }
    
    used.add(keyword);
    
    clusters.push({
      mainKeyword: keyword,
      similarKeywords,
      intent: classifyKeywordIntent(keyword),
      averageSimilarity: similarKeywords.length > 0 ? totalSimilarity / similarKeywords.length : 1
    });
  }
  
  // Sort by cluster size (largest first)
  return clusters.sort((a, b) => b.similarKeywords.length - a.similarKeywords.length);
}

export default {
  calculateNGramSimilarity,
  calculateCombinedSimilarity,
  classifyKeywordIntent,
  clusterKeywords
};

