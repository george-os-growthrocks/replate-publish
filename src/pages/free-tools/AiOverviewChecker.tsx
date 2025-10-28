import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { RelatedToolsSection } from "@/components/free-tools/RelatedToolsSection";
import { getRelatedTools } from "@/lib/free-tools-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Search, TrendingUp, CheckCircle, XCircle, Loader2, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiOverviewResult {
  keyword: string;
  hasAiOverview: boolean;
  featuredSites: string[];
  recommendations: string[];
  competitorCount: number;
}

export default function AiOverviewChecker() {
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiOverviewResult | null>(null);

  const checkAiOverview = async () => {
    if (!keyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    setIsLoading(true);
    
    try {
      // Call edge function to check SERP for AI Overview
      const { data, error } = await supabase.functions.invoke("check-ai-overview", {
        body: { keyword: keyword.trim() }
      });

      if (error) throw error;

      setResult(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error("Error checking AI Overview:", error);
      toast.error("Failed to analyze keyword. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Free AI Overview Checker - See if Your Keywords Have AI Overviews | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Free tool to check if your target keywords show Google AI Overviews. See which sites are featured and get optimization tips. No signup required." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/ai-overview-checker" />
        <meta property="og:title" content="Free AI Overview Checker Tool" />
        <meta property="og:description" content="Check if your keywords have Google AI Overviews. Get free optimization tips." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Free Tool - No Signup Required
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                Free <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI Overview Checker</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Instantly check if your target keywords show Google AI Overviews. See which competitors are featured and get free optimization tips.
              </p>
            </div>

            {/* Checker Tool */}
            <Card className="max-w-2xl mx-auto mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Check Your Keyword
                </CardTitle>
                <CardDescription>
                  Enter any keyword to see if it triggers a Google AI Overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., best SEO tools 2025"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && checkAiOverview()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={checkAiOverview} 
                    disabled={isLoading}
                    className="gradient-primary"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Check Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {result.hasAiOverview ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-success" />
                          AI Overview Detected!
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-muted-foreground" />
                          No AI Overview Found
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Keyword: <strong className="text-foreground">{result.keyword}</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.hasAiOverview ? (
                      <Alert className="bg-success/10 border-success/20">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <AlertDescription className="text-success">
                          This keyword triggers a Google AI Overview with {result.competitorCount} featured sources.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          This keyword currently doesn't show an AI Overview. It may be a good opportunity to rank traditionally!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Featured Sites */}
                {result.hasAiOverview && result.featuredSites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Sites Featured in AI Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.featuredSites.map((site, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                            <Badge variant="outline" className="font-mono">
                              #{index + 1}
                            </Badge>
                            <span className="text-sm font-medium">{site}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        How to Optimize for AI Overviews
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* CTA */}
                <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                  <CardContent className="pt-6 text-center">
                    <h3 className="text-2xl font-bold mb-3 text-foreground">
                      Want to Track AI Overviews Automatically?
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                      Get daily AI Overview tracking, competitor monitoring, and advanced optimization recommendations with AnotherSEOGuru.
                    </p>
                    <Button asChild size="lg" className="gradient-primary">
                      <Link to="/auth">
                        Start Free 7-Day Trial
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Features Grid */}
            {!result && (
              <div className="max-w-5xl mx-auto mt-16">
                <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
                  Why Check for AI Overviews?
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📊 Understand Visibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        AI Overviews can dominate search results. Know if your keywords show them before you invest time creating content.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🎯 Spot Competitors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        See which sites Google trusts enough to feature in AI Overviews. Analyze their content strategy to compete.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🚀 Optimize Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Get specific tips on how to structure your content to increase chances of being featured in AI Overviews.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>

        <RelatedToolsSection tools={getRelatedTools("ai-overview")} />

        <Footer />
      </div>
    </>
  );
}

