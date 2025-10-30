/**
 * Overage Policy Management
 * Handles credit usage thresholds and overage events
 */

export type OverageThreshold = 70 | 90 | 100 | 110;

export interface OverageStatus {
  creditsUsed: number;
  creditsTotal: number;
  percentageUsed: number;
  threshold: OverageThreshold | null;
  shouldWarn: boolean;
  shouldPause: boolean;
}

/**
 * Calculate overage status based on credit usage
 */
export function calculateOverageStatus(
  creditsUsed: number,
  creditsTotal: number
): OverageStatus {
  if (creditsTotal === 0) {
    return {
      creditsUsed,
      creditsTotal,
      percentageUsed: 0,
      threshold: null,
      shouldWarn: false,
      shouldPause: false,
    };
  }

  const percentageUsed = (creditsUsed / creditsTotal) * 100;

  let threshold: OverageThreshold | null = null;
  let shouldWarn = false;
  let shouldPause = false;

  if (percentageUsed >= 110) {
    threshold = 110;
    shouldPause = true;
    shouldWarn = true;
  } else if (percentageUsed >= 100) {
    threshold = 100;
    shouldWarn = true;
  } else if (percentageUsed >= 90) {
    threshold = 90;
    shouldWarn = true;
  } else if (percentageUsed >= 70) {
    threshold = 70;
    shouldWarn = true;
  }

  return {
    creditsUsed,
    creditsTotal,
    percentageUsed: Math.round(percentageUsed * 100) / 100,
    threshold,
    shouldWarn,
    shouldPause,
  };
}

/**
 * Get threshold message for display
 */
export function getThresholdMessage(threshold: OverageThreshold | null): string {
  switch (threshold) {
    case 70:
      return 'You\'ve used 70% of your monthly credits. Consider upgrading or purchasing more credits.';
    case 90:
      return 'Warning: You\'ve used 90% of your monthly credits. Upgrade now to avoid interruption.';
    case 100:
      return 'You\'ve reached 100% of your monthly credits. Some features may be limited.';
    case 110:
      return 'Critical: You\'ve exceeded your credit limit. Usage has been paused. Please top up or upgrade.';
    default:
      return '';
  }
}

/**
 * Check if usage should be blocked based on overage status
 */
export function shouldBlockUsage(status: OverageStatus): boolean {
  return status.shouldPause && status.threshold === 110;
}

/**
 * Get usage meter thresholds for a plan
 */
export interface UsageMeterLimits {
  maxTrackedKeywordsDaily: number;
  maxCrawlUrlsMonthly: number;
  maxReportsMonthly: number;
}

export function checkUsageMeterLimits(
  current: {
    trackedKeywords?: number;
    crawledUrls?: number;
    reports?: number;
  },
  limits: UsageMeterLimits
): {
  trackedKeywords: { used: number; limit: number; percentage: number; exceeded: boolean };
  crawledUrls: { used: number; limit: number; percentage: number; exceeded: boolean };
  reports: { used: number; limit: number; percentage: number; exceeded: boolean };
} {
  const trackedKeywordsUsed = current.trackedKeywords || 0;
  const crawledUrlsUsed = current.crawledUrls || 0;
  const reportsUsed = current.reports || 0;

  return {
    trackedKeywords: {
      used: trackedKeywordsUsed,
      limit: limits.maxTrackedKeywordsDaily,
      percentage: limits.maxTrackedKeywordsDaily > 0
        ? (trackedKeywordsUsed / limits.maxTrackedKeywordsDaily) * 100
        : 0,
      exceeded: trackedKeywordsUsed >= limits.maxTrackedKeywordsDaily,
    },
    crawledUrls: {
      used: crawledUrlsUsed,
      limit: limits.maxCrawlUrlsMonthly,
      percentage: limits.maxCrawlUrlsMonthly > 0
        ? (crawledUrlsUsed / limits.maxCrawlUrlsMonthly) * 100
        : 0,
      exceeded: crawledUrlsUsed >= limits.maxCrawlUrlsMonthly,
    },
    reports: {
      used: reportsUsed,
      limit: limits.maxReportsMonthly,
      percentage: limits.maxReportsMonthly > 0
        ? (reportsUsed / limits.maxReportsMonthly) * 100
        : 0,
      exceeded: reportsUsed >= limits.maxReportsMonthly,
    },
  };
}

