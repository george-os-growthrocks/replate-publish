/**
 * N-gram Similarity Utilities
 * For detecting duplicate or near-duplicate variants
 */

/**
 * Generates character n-grams from text
 * @param text The input text
 * @param n N-gram size (default: 3)
 * @returns Set of n-grams
 */
export function generateNGrams(text: string, n: number = 3): Set<string> {
  const normalized = text.toLowerCase().replace(/\\s+/g, ' ').trim();
  const ngrams = new Set<string>();

  if (normalized.length < n) {
    ngrams.add(normalized);
    return ngrams;
  }

  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.slice(i, i + n));
  }

  return ngrams;
}

/**
 * Calculates Jaccard similarity between two sets
 * @param set1 First set
 * @param set2 Second set
 * @returns Similarity score 0-1
 */
export function jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Calculates cosine similarity between two texts using character n-grams
 * @param text1 First text
 * @param text2 Second text
 * @param n N-gram size (default: 3)
 * @returns Similarity score 0-1
 */
export function cosineSimilarity(
  text1: string,
  text2: string,
  n: number = 3
): number {
  const ngrams1 = generateNGrams(text1, n);
  const ngrams2 = generateNGrams(text2, n);

  // Create frequency vectors
  const allNgrams = new Set([...ngrams1, ...ngrams2]);
  const vector1: number[] = [];
  const vector2: number[] = [];

  for (const ngram of allNgrams) {
    vector1.push(ngrams1.has(ngram) ? 1 : 0);
    vector2.push(ngrams2.has(ngram) ? 1 : 0);
  }

  // Calculate cosine similarity
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculates Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns Edit distance
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create matrix
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculates normalized edit distance (0-1 scale)
 * @param str1 First string
 * @param str2 Second string
 * @returns Normalized distance 0-1
 */
export function normalizedEditDistance(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 0;

  return distance / maxLength;
}

/**
 * Finds duplicates in array of texts using similarity threshold
 * @param texts Array of texts
 * @param threshold Similarity threshold (default: 0.92)
 * @param method Similarity method (default: 'cosine')
 * @returns Array of duplicate groups
 */
export function findDuplicates(
  texts: string[],
  threshold: number = 0.92,
  method: 'cosine' | 'jaccard' | 'levenshtein' = 'cosine'
): number[][] {
  const duplicateGroups: number[][] = [];
  const processed = new Set<number>();

  for (let i = 0; i < texts.length; i++) {
    if (processed.has(i)) continue;

    const group: number[] = [i];

    for (let j = i + 1; j < texts.length; j++) {
      if (processed.has(j)) continue;

      let similarity: number;

      if (method === 'cosine') {
        similarity = cosineSimilarity(texts[i], texts[j]);
      } else if (method === 'jaccard') {
        const ngrams1 = generateNGrams(texts[i]);
        const ngrams2 = generateNGrams(texts[j]);
        similarity = jaccardSimilarity(ngrams1, ngrams2);
      } else {
        similarity = 1 - normalizedEditDistance(texts[i], texts[j]);
      }

      if (similarity >= threshold) {
        group.push(j);
        processed.add(j);
      }
    }

    if (group.length > 1) {
      duplicateGroups.push(group);
      group.forEach((idx) => processed.add(idx));
    }
  }

  return duplicateGroups;
}

/**
 * Deduplicates array of texts, keeping the first occurrence
 * @param texts Array of texts
 * @param threshold Similarity threshold (default: 0.92)
 * @returns Deduplicated array
 */
export function deduplicateTexts(
  texts: string[],
  threshold: number = 0.92
): string[] {
  const duplicateGroups = findDuplicates(texts, threshold);
  const indicesToRemove = new Set<number>();

  for (const group of duplicateGroups) {
    // Keep first, remove rest
    for (let i = 1; i < group.length; i++) {
      indicesToRemove.add(group[i]);
    }
  }

  return texts.filter((_, index) => !indicesToRemove.has(index));
}

/**
 * Finds the most similar text to a given text from an array
 * @param target Target text
 * @param candidates Array of candidate texts
 * @returns Index and similarity of most similar text
 */
export function findMostSimilar(
  target: string,
  candidates: string[]
): { index: number; similarity: number } | null {
  if (candidates.length === 0) return null;

  let maxSimilarity = -1;
  let maxIndex = -1;

  for (let i = 0; i < candidates.length; i++) {
    const similarity = cosineSimilarity(target, candidates[i]);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      maxIndex = i;
    }
  }

  return {
    index: maxIndex,
    similarity: maxSimilarity,
  };
}

/**
 * Calculates semantic similarity score
 * Combines multiple similarity metrics for better accuracy
 * @param text1 First text
 * @param text2 Second text
 * @returns Combined similarity score 0-1
 */
export function semanticSimilarity(text1: string, text2: string): number {
  const cosine = cosineSimilarity(text1, text2, 3);
  const ngrams1 = generateNGrams(text1, 3);
  const ngrams2 = generateNGrams(text2, 3);
  const jaccard = jaccardSimilarity(ngrams1, ngrams2);
  const normalized = 1 - normalizedEditDistance(text1, text2);

  // Weighted average (cosine is most reliable for text)
  return cosine * 0.5 + jaccard * 0.3 + normalized * 0.2;
}

/**
 * Groups similar texts into clusters
 * @param texts Array of texts
 * @param threshold Similarity threshold (default: 0.85)
 * @returns Array of clusters
 */
export function clusterSimilarTexts(
  texts: string[],
  threshold: number = 0.85
): string[][] {
  const clusters: string[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < texts.length; i++) {
    if (assigned.has(i)) continue;

    const cluster: string[] = [texts[i]];
    assigned.add(i);

    for (let j = i + 1; j < texts.length; j++) {
      if (assigned.has(j)) continue;

      const similarity = semanticSimilarity(texts[i], texts[j]);
      if (similarity >= threshold) {
        cluster.push(texts[j]);
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}
