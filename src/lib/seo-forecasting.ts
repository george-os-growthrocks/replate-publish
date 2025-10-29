/**
 * SEO Trend Forecasting & Seasonality Analysis
 * Predict future search volumes and detect seasonal patterns
 */

import { SEASONALITY_PATTERNS } from './seo-constants';
import type { TrendAnalysis, MonthlySearchVolume, MonthlyForecast } from '@/types/seo-metrics';

/**
 * Analyze trends and forecast future search volumes
 */
export function analyzeTrends(
  monthlyData: MonthlySearchVolume[],
  keyword: string = ''
): TrendAnalysis {
  if (!monthlyData || monthlyData.length === 0) {
    return getDefaultTrendAnalysis();
  }

  // Sort data by date
  const sortedData = [...monthlyData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Detect seasonality
  const seasonalityResult = detectSeasonality(sortedData);
  
  // Calculate growth rate (Year-over-Year)
  const growthRate = calculateGrowthRate(sortedData);
  
  // Generate 3-month forecast
  const forecast = generateForecast(sortedData, 3, growthRate, seasonalityResult.isSeasonal);
  
  // Calculate volatility
  const volatility = calculateVolatility(sortedData);
  
  // Determine seasonality pattern
  const pattern = determineSeasonalityPattern(seasonalityResult.peakMonths, keyword);

  return {
    isSeasonal: seasonalityResult.isSeasonal,
    peakMonths: seasonalityResult.peakMonths,
    lowMonths: seasonalityResult.lowMonths,
    growthRate,
    forecast3Months: forecast,
    seasonalityPattern: pattern,
    confidence: calculateConfidence(sortedData, seasonalityResult.isSeasonal),
    volatility,
  };
}

/**
 * Detect if search volumes show seasonal patterns
 */
function detectSeasonality(data: MonthlySearchVolume[]): {
  isSeasonal: boolean;
  peakMonths: number[];
  lowMonths: number[];
} {
  if (data.length < 12) {
    return { isSeasonal: false, peakMonths: [], lowMonths: [] };
  }

  // Group by month (ignore year) to find patterns
  const monthlyAverages = new Map<number, number[]>();
  
  data.forEach(item => {
    if (!monthlyAverages.has(item.month)) {
      monthlyAverages.set(item.month, []);
    }
    monthlyAverages.get(item.month)!.push(item.searchVolume);
  });

  // Calculate average for each month
  const monthAvgs = Array.from(monthlyAverages.entries()).map(([month, volumes]) => ({
    month,
    avg: volumes.reduce((sum, v) => sum + v, 0) / volumes.length,
  }));

  // Calculate overall average
  const overallAvg = monthAvgs.reduce((sum, m) => sum + m.avg, 0) / monthAvgs.length;
  
  // Find peaks (>20% above average) and lows (<20% below average)
  const threshold = 0.20; // 20%
  const peakMonths = monthAvgs
    .filter(m => m.avg > overallAvg * (1 + threshold))
    .map(m => m.month)
    .sort((a, b) => a - b);
  
  const lowMonths = monthAvgs
    .filter(m => m.avg < overallAvg * (1 - threshold))
    .map(m => m.month)
    .sort((a, b) => a - b);

  // Consider seasonal if we have at least 2 peak months or significant variance
  const variance = calculateMonthlyVariance(monthAvgs.map(m => m.avg));
  const coefficientOfVariation = Math.sqrt(variance) / overallAvg;
  
  const isSeasonal = peakMonths.length >= 2 || coefficientOfVariation > 0.25;

  return {
    isSeasonal,
    peakMonths,
    lowMonths,
  };
}

/**
 * Calculate Year-over-Year growth rate
 */
function calculateGrowthRate(data: MonthlySearchVolume[]): number {
  if (data.length < 13) return 0; // Need at least 13 months for YoY

  // Get most recent 12 months
  const recent12 = data.slice(-12);
  const previous12 = data.slice(-24, -12);

  if (previous12.length < 12) return 0;

  const recentAvg = recent12.reduce((sum, d) => sum + d.searchVolume, 0) / 12;
  const previousAvg = previous12.reduce((sum, d) => sum + d.searchVolume, 0) / 12;

  if (previousAvg === 0) return 0;

  const growthRate = ((recentAvg - previousAvg) / previousAvg) * 100;
  return Math.round(growthRate * 10) / 10; // Round to 1 decimal
}

/**
 * Generate forecast for next N months
 */
function generateForecast(
  data: MonthlySearchVolume[],
  months: number,
  growthRate: number,
  isSeasonal: boolean
): MonthlyForecast[] {
  if (data.length === 0) return [];

  const lastDataPoint = data[data.length - 1];
  const forecast: MonthlyForecast[] = [];
  
  // Calculate moving average for baseline
  const recentData = data.slice(-6); // Last 6 months
  const baseline = recentData.reduce((sum, d) => sum + d.searchVolume, 0) / recentData.length;
  
  // Monthly growth factor
  const monthlyGrowthFactor = 1 + (growthRate / 100 / 12);

  for (let i = 1; i <= months; i++) {
    let month = lastDataPoint.month + i;
    let year = lastDataPoint.year;
    
    // Handle year rollover
    while (month > 12) {
      month -= 12;
      year += 1;
    }

    // Apply growth factor
    let predictedVolume = baseline * Math.pow(monthlyGrowthFactor, i);

    // Apply seasonal adjustment if detected
    if (isSeasonal) {
      const seasonalFactor = getSeasonalFactor(month, data);
      predictedVolume *= seasonalFactor;
    }

    // Determine trend
    const trend: 'up' | 'down' | 'stable' = 
      growthRate > 5 ? 'up' :
      growthRate < -5 ? 'down' : 'stable';

    // Confidence decreases with forecast distance
    const confidence = Math.max(50, 90 - (i * 10));

    forecast.push({
      month,
      year,
      predictedVolume: Math.round(predictedVolume),
      confidence,
      trend,
    });
  }

  return forecast;
}

/**
 * Get seasonal adjustment factor for a specific month
 */
function getSeasonalFactor(month: number, data: MonthlySearchVolume[]): number {
  // Find all data points for this month
  const monthData = data.filter(d => d.month === month);
  
  if (monthData.length === 0) return 1.0;

  // Calculate average for this month
  const monthAvg = monthData.reduce((sum, d) => sum + d.searchVolume, 0) / monthData.length;
  
  // Calculate overall average
  const overallAvg = data.reduce((sum, d) => sum + d.searchVolume, 0) / data.length;
  
  if (overallAvg === 0) return 1.0;

  // Return factor (1.0 = average, >1.0 = above average, <1.0 = below average)
  return monthAvg / overallAvg;
}

/**
 * Calculate volatility of search volumes
 */
function calculateVolatility(data: MonthlySearchVolume[]): number {
  if (data.length < 2) return 0;

  const values = data.map(d => d.searchVolume);
  const variance = calculateMonthlyVariance(values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  if (avg === 0) return 0;

  // Coefficient of variation as volatility measure (0-100)
  const coefficientOfVariation = Math.sqrt(variance) / avg;
  return Math.min(Math.round(coefficientOfVariation * 100), 100);
}

/**
 * Calculate variance of values
 */
function calculateMonthlyVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
}

/**
 * Determine seasonality pattern type
 */
function determineSeasonalityPattern(
  peakMonths: number[],
  keyword: string
): TrendAnalysis['seasonalityPattern'] {
  if (peakMonths.length === 0) return 'stable';

  const lowerKeyword = keyword.toLowerCase();

  // Check for specific keywords
  if (lowerKeyword.includes('news') || lowerKeyword.includes('trend')) {
    return 'trending';
  }

  // Check against known patterns
  const hasHolidayPeak = peakMonths.some(m => (SEASONALITY_PATTERNS.holiday as readonly number[]).includes(m));
  const hasBackToSchoolPeak = peakMonths.some(m => (SEASONALITY_PATTERNS.back_to_school as readonly number[]).includes(m));
  const hasSummerPeak = peakMonths.some(m => (SEASONALITY_PATTERNS.summer as readonly number[]).includes(m));
  const hasNewYearPeak = peakMonths.some(m => (SEASONALITY_PATTERNS.new_year as readonly number[]).includes(m));

  if (hasHolidayPeak) return 'holiday';
  if (hasBackToSchoolPeak) return 'event';
  if (hasSummerPeak || hasNewYearPeak) return 'weather';
  
  return peakMonths.length >= 3 ? 'event' : 'stable';
}

/**
 * Calculate confidence in trend analysis
 */
function calculateConfidence(data: MonthlySearchVolume[], isSeasonal: boolean): number {
  // More data = higher confidence
  const dataPointsScore = Math.min((data.length / 24) * 40, 40); // Max 40 points for 24+ months
  
  // Consistent patterns = higher confidence
  const volatility = calculateVolatility(data);
  const consistencyScore = Math.max(0, 30 - (volatility / 3)); // Max 30 points for low volatility
  
  // Seasonal detection = higher confidence
  const seasonalScore = isSeasonal ? 20 : 10;
  
  // Recent data = higher confidence
  const recencyScore = 10;

  const totalScore = dataPointsScore + consistencyScore + seasonalScore + recencyScore;
  return Math.min(Math.round(totalScore), 100);
}

/**
 * Default trend analysis when insufficient data
 */
function getDefaultTrendAnalysis(): TrendAnalysis {
  return {
    isSeasonal: false,
    peakMonths: [],
    lowMonths: [],
    growthRate: 0,
    forecast3Months: [],
    seasonalityPattern: 'stable',
    confidence: 0,
    volatility: 0,
  };
}

/**
 * Smooth out noise in monthly data using moving average
 */
export function smoothMonthlyData(
  data: MonthlySearchVolume[],
  windowSize: number = 3
): MonthlySearchVolume[] {
  if (data.length < windowSize) return data;

  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const window = data.slice(start, end);
    
    const avgVolume = Math.round(
      window.reduce((sum, d) => sum + d.searchVolume, 0) / window.length
    );

    return {
      ...point,
      searchVolume: avgVolume,
    };
  });
}

/**
 * Detect anomalies in search volume data
 */
export function detectAnomalies(
  data: MonthlySearchVolume[],
  standardDeviations: number = 2
): Array<{ month: number; year: number; volume: number; type: 'spike' | 'drop' }> {
  if (data.length < 6) return [];

  const values = data.map(d => d.searchVolume);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = calculateMonthlyVariance(values);
  const stdDev = Math.sqrt(variance);

  const threshold = stdDev * standardDeviations;
  const anomalies: Array<{ month: number; year: number; volume: number; type: 'spike' | 'drop' }> = [];

  data.forEach(point => {
    const deviation = Math.abs(point.searchVolume - avg);
    if (deviation > threshold) {
      anomalies.push({
        month: point.month,
        year: point.year,
        volume: point.searchVolume,
        type: point.searchVolume > avg ? 'spike' : 'drop',
      });
    }
  });

  return anomalies;
}

/**
 * Compare current trend to historical trends
 */
export function compareTrends(
  currentData: MonthlySearchVolume[],
  historicalData: MonthlySearchVolume[]
): {
  currentAverage: number;
  historicalAverage: number;
  percentChange: number;
  interpretation: string;
} {
  if (currentData.length === 0 || historicalData.length === 0) {
    return {
      currentAverage: 0,
      historicalAverage: 0,
      percentChange: 0,
      interpretation: 'Insufficient data for comparison',
    };
  }

  const currentAverage = Math.round(
    currentData.reduce((sum, d) => sum + d.searchVolume, 0) / currentData.length
  );

  const historicalAverage = Math.round(
    historicalData.reduce((sum, d) => sum + d.searchVolume, 0) / historicalData.length
  );

  const percentChange = historicalAverage > 0
    ? Math.round(((currentAverage - historicalAverage) / historicalAverage) * 100)
    : 0;

  let interpretation = '';
  if (percentChange > 20) {
    interpretation = 'Strong growth - Search interest is significantly increasing';
  } else if (percentChange > 5) {
    interpretation = 'Moderate growth - Positive trend in search interest';
  } else if (percentChange > -5) {
    interpretation = 'Stable - Search interest remains consistent';
  } else if (percentChange > -20) {
    interpretation = 'Moderate decline - Search interest decreasing';
  } else {
    interpretation = 'Significant decline - Search interest dropping rapidly';
  }

  return {
    currentAverage,
    historicalAverage,
    percentChange,
    interpretation,
  };
}
