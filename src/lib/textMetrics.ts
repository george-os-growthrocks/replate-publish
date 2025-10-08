/**
 * Text Metrics Utilities
 * Provides pixel-perfect measurements for SERP preview accuracy
 */

// SERP font stack (matches Google's actual rendering)
const SERP_FONT_DESKTOP = '14px Arial, sans-serif';
const SERP_FONT_MOBILE = '13px Arial, sans-serif';

// Pixel limits based on Google SERP rendering
export const SERP_LIMITS = {
  desktop: {
    title: 580,
    description: 920,
  },
  mobile: {
    title: 520,
    description: 680,
  },
} as const;

// Character targets (approximate)
export const CHAR_TARGETS = {
  metaDescription: {
    min: 120,
    ideal: 155,
    max: 165,
  },
  title: {
    min: 30,
    ideal: 60,
    max: 70,
  },
} as const;

/**
 * Measures pixel width of text using canvas
 * @param text The text to measure
 * @param device Desktop or mobile viewport
 * @returns Pixel width
 */
export function measurePixels(
  text: string,
  device: 'desktop' | 'mobile' = 'desktop'
): number {
  if (typeof document === 'undefined') {
    // SSR fallback: estimate based on average char width
    return estimatePixelWidth(text, device);
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return estimatePixelWidth(text, device);
  }

  context.font = device === 'desktop' ? SERP_FONT_DESKTOP : SERP_FONT_MOBILE;
  const metrics = context.measureText(text);

  return Math.round(metrics.width);
}

/**
 * Estimates pixel width without canvas (SSR-safe)
 * @param text The text to measure
 * @param device Desktop or mobile viewport
 * @returns Estimated pixel width
 */
export function estimatePixelWidth(
  text: string,
  device: 'desktop' | 'mobile' = 'desktop'
): number {
  // Average character widths in Arial
  const avgCharWidth = device === 'desktop' ? 7.5 : 6.5;
  return Math.round(text.length * avgCharWidth);
}

/**
 * Checks if text exceeds SERP display limits
 * @param text The text to check
 * @param type Title or description
 * @param device Desktop or mobile viewport
 * @returns Object with overflow status and truncation point
 */
export function checkSERPOverflow(
  text: string,
  type: 'title' | 'description',
  device: 'desktop' | 'mobile' = 'desktop'
) {
  const pixelWidth = measurePixels(text, device);
  const limit = SERP_LIMITS[device][type];
  const overflows = pixelWidth > limit;

  let truncationPoint = text.length;
  if (overflows) {
    // Binary search for truncation point
    let left = 0;
    let right = text.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const testWidth = measurePixels(text.slice(0, mid), device);
      if (testWidth <= limit) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    truncationPoint = Math.max(0, left - 1);
  }

  return {
    pixelWidth,
    limit,
    overflows,
    truncationPoint,
    displayText: overflows ? text.slice(0, truncationPoint) + '...' : text,
  };
}

/**
 * Validates meta description against SEO best practices
 * @param text The meta description
 * @param keywords Required keywords
 * @param charTarget Target character count
 * @returns Validation result with flags
 */
export function validateMetaDescription(
  text: string,
  keywords: string[] = [],
  charTarget: number = CHAR_TARGETS.metaDescription.ideal
) {
  const charCount = text.trim().length;
  const pixelWidth = measurePixels(text, 'desktop');

  const flags = {
    tooShort: charCount < CHAR_TARGETS.metaDescription.min,
    tooLong: charCount > charTarget,
    overPixels: pixelWidth > SERP_LIMITS.desktop.description,
    missingKeywords: keywords.filter(
      (kw) => !new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(text)
    ),
    hasQuotes: /[\"']/.test(text),
    endsWithPunctuation: /[.!?]$/.test(text.trim()),
  };

  const score = calculateDescriptionScore(text, charCount, flags);

  return {
    charCount,
    pixelWidth,
    flags,
    score,
    isValid: !flags.tooShort && !flags.tooLong && !flags.overPixels,
  };
}

/**
 * Calculates quality score for meta description
 * @param text The meta description
 * @param charCount Character count
 * @param flags Validation flags
 * @returns Score 0-100
 */
function calculateDescriptionScore(
  text: string,
  charCount: number,
  flags: any
): number {
  let score = 100;

  // Length penalties
  if (flags.tooShort) score -= 30;
  if (flags.tooLong) score -= 20;
  if (flags.overPixels) score -= 15;

  // Keyword penalties
  if (flags.missingKeywords?.length > 0) {
    score -= flags.missingKeywords.length * 10;
  }

  // Style penalties
  if (flags.hasQuotes) score -= 5;
  if (!flags.endsWithPunctuation) score -= 5;

  // Bonus for optimal length
  if (
    charCount >= CHAR_TARGETS.metaDescription.min &&
    charCount <= CHAR_TARGETS.metaDescription.ideal
  ) {
    score += 10;
  }

  // Bonus for action words
  if (/\\b(discover|learn|find|get|explore|shop|save)\\b/i.test(text)) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Truncates text to fit within pixel limit
 * @param text The text to truncate
 * @param maxPixels Maximum pixel width
 * @param device Desktop or mobile viewport
 * @returns Truncated text
 */
export function truncateToPixels(
  text: string,
  maxPixels: number,
  device: 'desktop' | 'mobile' = 'desktop'
): string {
  const currentWidth = measurePixels(text, device);

  if (currentWidth <= maxPixels) {
    return text;
  }

  // Binary search for optimal truncation point
  let left = 0;
  let right = text.length;

  while (left < right) {
    const mid = Math.floor((left + right + 1) / 2);
    const testText = text.slice(0, mid) + '...';
    const testWidth = measurePixels(testText, device);

    if (testWidth <= maxPixels) {
      left = mid;
    } else {
      right = mid - 1;
    }
  }

  return text.slice(0, left) + '...';
}

/**
 * Formats number with appropriate unit
 * @param value The number to format
 * @returns Formatted string
 */
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Escapes special regex characters
 * @param str String to escape
 * @returns Escaped string
 */
function escapeRegex(str: string): string {
  return str.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
}

/**
 * Calculates keyword density
 * @param text The text to analyze
 * @param keyword The keyword to count
 * @returns Density as percentage
 */
export function calculateKeywordDensity(text: string, keyword: string): number {
  const words = text.toLowerCase().split(/\\s+/);
  const keywordWords = keyword.toLowerCase().split(/\\s+/);
  const keywordLength = keywordWords.length;

  let count = 0;
  for (let i = 0; i <= words.length - keywordLength; i++) {
    const phrase = words.slice(i, i + keywordLength).join(' ');
    if (phrase === keywordWords.join(' ')) {
      count++;
    }
  }

  return (count / Math.max(words.length, 1)) * 100;
}
