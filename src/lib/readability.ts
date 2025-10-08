/**
 * Readability Analysis Utilities
 * Implements Flesch Reading Ease and other readability metrics
 */

/**
 * Calculates Flesch Reading Ease score
 * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 * Score: 0-100 (higher = easier to read)
 * @param text The text to analyze
 * @returns Flesch Reading Ease score
 */
export function calculateFleschReadingEase(text: string): number {
  const stats = getTextStatistics(text);

  if (stats.sentences === 0 || stats.words === 0) {
    return 0;
  }

  const avgWordsPerSentence = stats.words / stats.sentences;
  const avgSyllablesPerWord = stats.syllables / stats.words;

  const score =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Gets interpretation of Flesch Reading Ease score
 * @param score Flesch score
 * @returns Interpretation object
 */
export function interpretFleschScore(score: number) {
  if (score >= 90)
    return {
      level: 'Very Easy',
      grade: '5th grade',
      color: 'green',
      description: 'Easy to read for everyone',
    };
  if (score >= 80)
    return {
      level: 'Easy',
      grade: '6th grade',
      color: 'green',
      description: 'Conversational English',
    };
  if (score >= 70)
    return {
      level: 'Fairly Easy',
      grade: '7th grade',
      color: 'green',
      description: 'Easy for most readers',
    };
  if (score >= 60)
    return {
      level: 'Standard',
      grade: '8th-9th grade',
      color: 'blue',
      description: 'Plain English',
    };
  if (score >= 50)
    return {
      level: 'Fairly Difficult',
      grade: '10th-12th grade',
      color: 'yellow',
      description: 'Some college education',
    };
  if (score >= 30)
    return {
      level: 'Difficult',
      grade: 'College',
      color: 'orange',
      description: 'College level',
    };
  return {
    level: 'Very Difficult',
    grade: 'College graduate',
    color: 'red',
    description: 'Professional/academic',
  };
}

/**
 * Calculates text statistics
 * @param text The text to analyze
 * @returns Statistics object
 */
export function getTextStatistics(text: string) {
  const cleanText = text.trim();

  // Count sentences
  const sentences = (cleanText.match(/[.!?]+/g) || ['']).length;

  // Count words
  const words = cleanText.split(/\\s+/).filter((w) => w.length > 0).length;

  // Count syllables
  const syllables = cleanText
    .split(/\\s+/)
    .reduce((sum, word) => sum + countSyllables(word), 0);

  // Count characters (excluding spaces)
  const characters = cleanText.replace(/\\s+/g, '').length;

  return {
    sentences,
    words,
    syllables,
    characters,
    avgWordsPerSentence: words / Math.max(sentences, 1),
    avgSyllablesPerWord: syllables / Math.max(words, 1),
    avgWordLength: characters / Math.max(words, 1),
  };
}

/**
 * Counts syllables in a word
 * @param word The word to count
 * @returns Number of syllables
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');

  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;

  // Remove silent e
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }

  return Math.max(count, 1);
}

/**
 * Detects passive voice ratio
 * @param text The text to analyze
 * @returns Passive voice percentage
 */
export function detectPassiveVoice(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  let passiveCount = 0;

  // Simple passive voice detection (to be + past participle)
  const passivePattern =
    /\\b(am|is|are|was|were|be|been|being)\\s+\\w+ed\\b/gi;

  for (const sentence of sentences) {
    if (passivePattern.test(sentence)) {
      passiveCount++;
    }
  }

  return (passiveCount / Math.max(sentences.length, 1)) * 100;
}

/**
 * Analyzes sentence length distribution
 * @param text The text to analyze
 * @returns Distribution analysis
 */
export function analyzeSentenceLength(text: string) {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const lengths = sentences.map((s) => s.split(/\\s+/).length);

  if (lengths.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      distribution: { short: 0, medium: 0, long: 0 },
    };
  }

  const sorted = [...lengths].sort((a, b) => a - b);
  const sum = lengths.reduce((a, b) => a + b, 0);

  const distribution = {
    short: lengths.filter((l) => l <= 10).length,
    medium: lengths.filter((l) => l > 10 && l <= 20).length,
    long: lengths.filter((l) => l > 20).length,
  };

  return {
    min: Math.min(...lengths),
    max: Math.max(...lengths),
    avg: Math.round((sum / lengths.length) * 10) / 10,
    median: sorted[Math.floor(sorted.length / 2)],
    distribution,
  };
}

/**
 * Checks for common readability issues
 * @param text The text to analyze
 * @returns Array of issues found
 */
export function checkReadabilityIssues(text: string): string[] {
  const issues: string[] = [];

  // Check sentence length
  const sentenceAnalysis = analyzeSentenceLength(text);
  if (sentenceAnalysis.avg > 25) {
    issues.push('Average sentence length is too long (>25 words)');
  }

  // Check passive voice
  const passiveRatio = detectPassiveVoice(text);
  if (passiveRatio > 30) {
    issues.push(`High passive voice usage (${Math.round(passiveRatio)}%)`);
  }

  // Check word complexity
  const stats = getTextStatistics(text);
  if (stats.avgSyllablesPerWord > 2) {
    issues.push('High average syllables per word (complex vocabulary)');
  }

  // Check paragraph length (if applicable)
  const words = text.split(/\\s+/).length;
  if (words > 200) {
    issues.push('Text may be too long for a meta description');
  }

  // Check for jargon indicators
  if (/\\b(utilize|leverage|synergy|paradigm|optimize)\\b/i.test(text)) {
    issues.push('Consider using simpler alternatives to business jargon');
  }

  return issues;
}

/**
 * Suggests improvements for readability
 * @param text The text to analyze
 * @returns Array of suggestions
 */
export function suggestReadabilityImprovements(text: string): string[] {
  const suggestions: string[] = [];
  const issues = checkReadabilityIssues(text);

  if (issues.length === 0) {
    return ['Text readability is good!'];
  }

  if (issues.some((i) => i.includes('sentence length'))) {
    suggestions.push('Break long sentences into shorter ones');
    suggestions.push('Aim for 15-20 words per sentence');
  }

  if (issues.some((i) => i.includes('passive voice'))) {
    suggestions.push('Convert passive voice to active voice');
    suggestions.push('Use strong action verbs');
  }

  if (issues.some((i) => i.includes('syllables'))) {
    suggestions.push('Use simpler, shorter words where possible');
    suggestions.push('Replace complex terms with everyday language');
  }

  if (issues.some((i) => i.includes('jargon'))) {
    suggestions.push('Replace jargon with plain language');
  }

  return suggestions;
}

/**
 * Calculates overall content quality score
 * @param text The text to analyze
 * @returns Quality score 0-100
 */
export function calculateContentQuality(text: string): number {
  let score = 100;

  const fleschScore = calculateFleschReadingEase(text);
  const passiveRatio = detectPassiveVoice(text);
  const sentenceAnalysis = analyzeSentenceLength(text);
  const issues = checkReadabilityIssues(text);

  // Flesch score penalty/bonus
  if (fleschScore < 50) score -= 20;
  else if (fleschScore >= 60 && fleschScore <= 80) score += 10;

  // Passive voice penalty
  if (passiveRatio > 30) score -= 15;
  else if (passiveRatio < 10) score += 5;

  // Sentence length penalty
  if (sentenceAnalysis.avg > 25) score -= 10;
  else if (sentenceAnalysis.avg >= 15 && sentenceAnalysis.avg <= 20) {
    score += 5;
  }

  // Issues penalty
  score -= issues.length * 5;

  return Math.max(0, Math.min(100, score));
}
