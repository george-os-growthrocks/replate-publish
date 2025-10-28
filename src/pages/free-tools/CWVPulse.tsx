import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, Zap, TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { RelatedToolsSection } from "@/components/free-tools/RelatedToolsSection";
import { getRelatedTools } from "@/lib/free-tools-data";
import { supabase } from "@/integrations/supabase/client";

interface CWVScore {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms) / INP
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  performanceScore: number; // Overall score 0-100
}

export default function CWVPulse() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState<CWVScore | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const FREE_LIMIT = 5;

  const getScoreColor = (metric: keyof CWVScore, value: number) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
      performanceScore: { good: 90, poor: 50 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return "text-muted-foreground";
    if (value <= threshold.good) return "text-green-500";
    if (value <= threshold.poor) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (metric: keyof CWVScore, value: number) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
      performanceScore: { good: 90, poor: 50 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return "Unknown";
    if (value <= threshold.good) return "Good";
    if (value <= threshold.poor) return "Needs Improvement";
    return "Poor";
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL (include https://)");
      return;
    }

    if (usageCount >= FREE_LIMIT) {
      toast.error(`Free limit reached (${FREE_LIMIT} per day). Sign up for unlimited checks.`);
      return;
    }

    setIsAnalyzing(true);

    try {
      console.log('Analyzing:', url);
      
      const { data, error } = await supabase.functions.invoke('pagespeed-insights', {
        body: { url, strategy: 'mobile' }
      });

      if (error) {
        console.error('CWV Error:', error);
        throw new Error('Failed to analyze page speed');
      }

      if (!data?.scores) {
        throw new Error('No score data received');
      }

      console.log('CWV Results:', data.scores);

      setScores(data.scores);
      setUsageCount(prev => prev + 1);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error('CWV Analysis Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze URL. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Core Web Vitals Checker (CWV Pulse) - Free Tool | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Check your Core Web Vitals (LCP, INP, CLS) scores. Get PageSpeed Insights data with actionable recommendations." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto max-w-4xl text-center">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                Core Web Vitals
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                CWV Pulse: Core Web Vitals Checker
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Check your LCP, INP, and CLS scores in seconds. Turn metrics into business outcomes.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  PageSpeed API
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {FREE_LIMIT} Checks/Day
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Desktop & Mobile
                </div>
              </div>
            </div>
          </section>

          {/* Tool */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-5xl">
              {/* Usage Counter */}
              <div className="mb-6 text-center">
                <Badge variant={usageCount >= FREE_LIMIT ? "destructive" : "secondary"}>
                  {usageCount}/{FREE_LIMIT} checks used today
                </Badge>
              </div>

              {/* Input */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Enter Your URL</CardTitle>
                  <CardDescription>
                    We'll analyze Core Web Vitals using Google's PageSpeed Insights API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing || usageCount >= FREE_LIMIT}
                      className="gradient-primary min-w-[140px]"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Gauge className="w-4 h-4 mr-2" /> Analyze</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {scores && (
                <>
                  {/* Core Metrics */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Largest Contentful Paint
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-4xl font-bold mb-2 ${getScoreColor('lcp', scores.lcp)}`}>
                          {(scores.lcp / 1000).toFixed(2)}s
                        </div>
                        <Badge variant={
                          scores.lcp <= 2500 ? "default" : 
                          scores.lcp <= 4000 ? "secondary" : "destructive"
                        }>
                          {getScoreLabel('lcp', scores.lcp)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          Good: {'<'}2.5s | Poor: {'>'}4.0s
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          First Input Delay
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-4xl font-bold mb-2 ${getScoreColor('fid', scores.fid)}`}>
                          {scores.fid.toFixed(0)}ms
                        </div>
                        <Badge variant={
                          scores.fid <= 100 ? "default" : 
                          scores.fid <= 300 ? "secondary" : "destructive"
                        }>
                          {getScoreLabel('fid', scores.fid)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          Good: {'<'}100ms | Poor: {'>'}300ms
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Cumulative Layout Shift
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-4xl font-bold mb-2 ${getScoreColor('cls', scores.cls)}`}>
                          {scores.cls.toFixed(3)}
                        </div>
                        <Badge variant={
                          scores.cls <= 0.1 ? "default" : 
                          scores.cls <= 0.25 ? "secondary" : "destructive"
                        }>
                          {getScoreLabel('cls', scores.cls)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          Good: {'<'}0.1 | Poor: {'>'}0.25
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Overall Performance Score */}
                  <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-center">Overall Performance Score</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${getScoreColor('performanceScore', scores.performanceScore)}`}>
                        {scores.performanceScore.toFixed(0)}
                      </div>
                      <Badge variant={
                        scores.performanceScore >= 90 ? "default" : 
                        scores.performanceScore >= 50 ? "secondary" : "destructive"
                      } className="text-lg px-4 py-1">
                        {getScoreLabel('performanceScore', scores.performanceScore)}
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Additional Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">First Contentful Paint</div>
                        <div className={`text-2xl font-bold ${getScoreColor('fcp', scores.fcp)}`}>
                          {(scores.fcp / 1000).toFixed(2)}s
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Time to First Byte</div>
                        <div className={`text-2xl font-bold ${getScoreColor('ttfb', scores.ttfb)}`}>
                          {scores.ttfb.toFixed(0)}ms
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Quick Wins
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {scores.lcp > 2500 && (
                        <div className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Optimize your largest image with lazy loading and WebP format</span>
                        </div>
                      )}
                      {scores.fid > 100 && (
                        <div className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Reduce JavaScript execution time and defer non-critical scripts</span>
                        </div>
                      )}
                      {scores.cls > 0.1 && (
                        <div className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Add explicit width/height attributes to images and embeds</span>
                        </div>
                      )}
                      {scores.ttfb > 800 && (
                        <div className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Enable server-side caching and use a CDN</span>
                        </div>
                      )}
                      {scores.performanceScore < 90 && (
                        <div className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Consider upgrading to our Pro plan for detailed optimization reports</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </section>

          <RelatedToolsSection tools={getRelatedTools("cwv-pulse")} />
        </main>

        <Footer />
      </div>
    </>
  );
}

