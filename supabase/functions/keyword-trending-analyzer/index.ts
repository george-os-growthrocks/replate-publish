import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type MonthBucket = { month: string; volume: number };
type Intent = 'I' | 'C' | 'T' | 'B';
type TrendShape = 'linear' | 'exponential' | 's_curve' | 'damped';

type KeywordRow = {
  id: string;
  keyword: string;
  intents: Intent[];
  kd: number | null;
  avgVolume: number | null;
  growthRatePct: number | null;
  series: MonthBucket[];
  branded: boolean;
  trendShape?: TrendShape;
  rmse?: number;
  rSquared?: number;
};

type Filters = {
  windowMonths: 3 | 6 | 12;
  trendShapes?: TrendShape[];
  minVolume?: number;
  intents?: Intent[];
  sortBy?: 'kd' | 'volume' | 'growth';
  sortDir?: 'asc' | 'desc';
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { projectId, filters, q, country = 'us' } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const f: Filters = filters || { windowMonths: 3 };

    console.log(`[Keyword Trending] Analyzing for project ${projectId}`);

    // Fetch keywords from serp_keywords table
    let query = supabase
      .from('serp_keywords')
      .select('keyword, search_volume, keyword_difficulty, cpc')
      .eq('project_id', projectId);

    if (q) {
      query = query.ilike('keyword', `%${q}%`);
    }

    if (f.minVolume) {
      query = query.gte('search_volume', f.minVolume);
    }

    query = query.order('search_volume', { ascending: false }).limit(200);

    const { data: keywords, error: kwError } = await query;

    if (kwError || !keywords) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch keywords" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Keywords] Found ${keywords.length} keywords`);

    // Build keyword rows with time series
    const rows: KeywordRow[] = [];

    for (const kw of keywords) {
      // Generate synthetic time series for demo (in production, fetch from DataForSEO or Google Trends)
      const series = generateTimeSeries(f.windowMonths, kw.search_volume || 0);

      // Classify trend shape
      const { shape, rmse, rSquared } = classifyTrend(series);

      // Calculate growth rate
      const growthRate = calculateGrowthRate(series);

      // Detect branded keywords
      const branded = /\b(nike|adidas|apple|google|amazon)\b/i.test(kw.keyword);

      // Classify intents (simplified)
      const intents = classifyIntents(kw.keyword);

      const row: KeywordRow = {
        id: crypto.randomUUID(),
        keyword: kw.keyword,
        intents,
        kd: kw.keyword_difficulty,
        avgVolume: kw.search_volume,
        growthRatePct: growthRate,
        series,
        branded,
        trendShape: shape,
        rmse,
        rSquared
      };

      rows.push(row);
    }

    // Apply filters
    let filtered = rows;

    if (f.trendShapes && f.trendShapes.length > 0) {
      filtered = filtered.filter(r => f.trendShapes!.includes(r.trendShape!));
    }

    if (f.intents && f.intents.length > 0) {
      filtered = filtered.filter(r => r.intents.some(i => f.intents!.includes(i)));
    }

    // Sort
    if (f.sortBy) {
      filtered.sort((a, b) => {
        let aVal = 0, bVal = 0;

        if (f.sortBy === 'kd') {
          aVal = a.kd || 0;
          bVal = b.kd || 0;
        } else if (f.sortBy === 'volume') {
          aVal = a.avgVolume || 0;
          bVal = b.avgVolume || 0;
        } else if (f.sortBy === 'growth') {
          aVal = a.growthRatePct || 0;
          bVal = b.growthRatePct || 0;
        }

        return f.sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    // Store analysis results
    for (const row of filtered.slice(0, 50)) {
      await supabase.from('keyword_trending_analysis').upsert({
        project_id: projectId,
        keyword: row.keyword,
        country,
        intents: row.intents,
        keyword_difficulty: row.kd,
        avg_volume: row.avgVolume,
        growth_rate_pct: row.growthRatePct,
        time_series: row.series,
        window_months: f.windowMonths,
        trend_shape: row.trendShape,
        rmse: row.rmse,
        r_squared: row.rSquared,
        branded: row.branded
      });
    }

    return new Response(
      JSON.stringify({
        keywords: filtered,
        meta: {
          total: filtered.length,
          windowMonths: f.windowMonths,
          filters: f
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateTimeSeries(months: number, baseVolume: number): MonthBucket[] {
  const series: MonthBucket[] = [];
  const now = new Date();

  // Generate synthetic growth pattern
  const growthType = Math.random();
  let pattern: 'linear' | 'exponential' | 's_curve' | 'damped';

  if (growthType < 0.3) pattern = 'linear';
  else if (growthType < 0.5) pattern = 'exponential';
  else if (growthType < 0.7) pattern = 's_curve';
  else pattern = 'damped';

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    let volume = baseVolume;
    const t = (months - i - 1) / months;

    if (pattern === 'linear') {
      volume = baseVolume * (0.7 + t * 0.6);
    } else if (pattern === 'exponential') {
      volume = baseVolume * (0.5 + Math.exp(t * 2) / Math.exp(2));
    } else if (pattern === 's_curve') {
      volume = baseVolume * (1 / (1 + Math.exp(-10 * (t - 0.5))));
    } else if (pattern === 'damped') {
      if (t < 0.6) {
        volume = baseVolume * (0.5 + t * 1.5);
      } else {
        volume = baseVolume * (1.4 - (t - 0.6) * 1.5);
      }
    }

    volume = Math.round(volume * (0.9 + Math.random() * 0.2));

    series.push({ month: monthStr, volume });
  }

  return series;
}

function classifyTrend(series: MonthBucket[]): { shape: TrendShape; rmse: number; rSquared: number } {
  const volumes = series.map(s => s.volume);
  const n = volumes.length;

  if (n < 3) {
    return { shape: 'linear', rmse: 0, rSquared: 0 };
  }

  // Calculate basic statistics
  const first = volumes[0];
  const last = volumes[n - 1];
  const mid = volumes[Math.floor(n / 2)];
  const max = Math.max(...volumes);
  const maxIdx = volumes.indexOf(max);

  // Determine trend shape heuristically
  let shape: TrendShape = 'linear';

  // Exponential: accelerating growth
  if (last > first && mid > first) {
    const firstHalfGrowth = (mid - first) / Math.max(first, 1);
    const secondHalfGrowth = (last - mid) / Math.max(mid, 1);
    if (secondHalfGrowth > firstHalfGrowth * 1.3) {
      shape = 'exponential';
    }
  }

  // S-curve: slow start, rapid middle, saturation
  if (mid > (first + last) / 2) {
    shape = 's_curve';
  }

  // Damped: peak then decline
  if (maxIdx < n - 1 && last < max * 0.85) {
    shape = 'damped';
  }

  // Calculate RMSE and R²
  const rmse = calculateRMSE(volumes, shape);
  const rSquared = calculateRSquared(volumes, shape);

  return { shape, rmse, rSquared };
}

function calculateRMSE(values: number[], shape: TrendShape): number {
  // Simplified RMSE calculation
  const predicted = fitModel(values, shape);
  const errors = values.map((v, i) => Math.pow(v - predicted[i], 2));
  const mse = errors.reduce((a, b) => a + b, 0) / errors.length;
  return Math.sqrt(mse);
}

function calculateRSquared(values: number[], shape: TrendShape): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const ssTot = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);

  const predicted = fitModel(values, shape);
  const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - predicted[i], 2), 0);

  return 1 - (ssRes / ssTot);
}

function fitModel(values: number[], shape: TrendShape): number[] {
  const n = values.length;
  const result: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let pred = values[0];

    if (shape === 'linear') {
      pred = values[0] + (values[n - 1] - values[0]) * t;
    } else if (shape === 'exponential') {
      const r = Math.log(values[n - 1] / values[0]);
      pred = values[0] * Math.exp(r * t);
    } else if (shape === 's_curve') {
      const L = Math.max(...values) * 1.1;
      pred = L / (1 + Math.exp(-10 * (t - 0.5)));
    } else if (shape === 'damped') {
      const maxIdx = values.indexOf(Math.max(...values));
      const tPeak = maxIdx / (n - 1);
      if (t <= tPeak) {
        pred = values[0] + (values[maxIdx] - values[0]) * (t / tPeak);
      } else {
        pred = values[maxIdx] * Math.exp(-3 * (t - tPeak));
      }
    }

    result.push(pred);
  }

  return result;
}

function calculateGrowthRate(series: MonthBucket[]): number {
  if (series.length < 2) return 0;

  const first = series[0].volume;
  const last = series[series.length - 1].volume;

  if (first === 0) return 0;

  const growth = ((last - first) / first) * 100;

  // Cap at ±999%
  return Math.max(-999, Math.min(999, Math.round(growth)));
}

function classifyIntents(keyword: string): Intent[] {
  const intents: Intent[] = [];

  // Informational signals
  if (/\b(how|what|why|when|where|guide|tutorial|learn)\b/i.test(keyword)) {
    intents.push('I');
  }

  // Commercial signals
  if (/\b(best|top|review|compare|vs|alternative)\b/i.test(keyword)) {
    intents.push('C');
  }

  // Transactional signals
  if (/\b(buy|price|cheap|discount|deal|shop|order)\b/i.test(keyword)) {
    intents.push('T');
  }

  // Branded signals
  if (/\b(nike|adidas|apple|google|amazon|samsung)\b/i.test(keyword)) {
    intents.push('B');
  }

  // Default to informational if no signals
  if (intents.length === 0) {
    intents.push('I');
  }

  return intents;
}