import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageSpeedRequest {
  url: string;
  strategy?: 'mobile' | 'desktop';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, strategy = 'mobile' }: PageSpeedRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call PageSpeed Insights API
    const PSI_API_KEY = Deno.env.get('GOOGLE_API_KEY') || '';
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${PSI_API_KEY}&category=PERFORMANCE`;

    console.log('Calling PageSpeed Insights API for:', url);

    const response = await fetch(psiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PSI API Error:', errorText);
      throw new Error(`PageSpeed API returned ${response.status}`);
    }

    const psiData = await response.json();

    // Extract Core Web Vitals
    const lighthouseMetrics = psiData.lighthouseResult?.audits || {};
    const fieldData = psiData.loadingExperience?.metrics || {};

    const cwvScores = {
      // Field Data (Real User Metrics) - preferred
      lcp: fieldData.LARGEST_CONTENTFUL_PAINT_MS?.percentile || 
           lighthouseMetrics['largest-contentful-paint']?.numericValue || 0,
      fid: fieldData.FIRST_INPUT_DELAY_MS?.percentile || 
           lighthouseMetrics['max-potential-fid']?.numericValue || 0,
      cls: fieldData.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || 
           lighthouseMetrics['cumulative-layout-shift']?.numericValue || 0,
      
      // Lab Data (Lighthouse Metrics)
      fcp: lighthouseMetrics['first-contentful-paint']?.numericValue || 0,
      ttfb: lighthouseMetrics['server-response-time']?.numericValue || 0,
      speedIndex: lighthouseMetrics['speed-index']?.numericValue || 0,
      tti: lighthouseMetrics['interactive']?.numericValue || 0,
      tbt: lighthouseMetrics['total-blocking-time']?.numericValue || 0,
      
      // Overall Performance Score
      performanceScore: psiData.lighthouseResult?.categories?.performance?.score * 100 || 0,
      
      // Opportunities for improvement
      opportunities: psiData.lighthouseResult?.audits ? 
        Object.entries(psiData.lighthouseResult.audits)
          .filter(([key, audit]: [string, any]) => 
            audit.score !== null && 
            audit.score < 0.9 && 
            audit.details?.overallSavingsMs > 100
          )
          .map(([key, audit]: [string, any]) => ({
            title: audit.title,
            description: audit.description,
            savingsMs: audit.details?.overallSavingsMs || 0,
          }))
          .sort((a, b) => b.savingsMs - a.savingsMs)
          .slice(0, 5) : [],
    };

    return new Response(
      JSON.stringify({
        success: true,
        url,
        strategy,
        scores: cwvScores,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PageSpeed Function Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze page speed',
        details: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

