import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Search, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface HeadingAnalysis {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  issues: string[];
  recommendations: string[];
}

export default function HeadingAnalyzer() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<HeadingAnalysis | null>(null);

  const analyzeHeadings = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL format
    try {
      new URL(url.trim());
    } catch (e) {
      toast.error("Please enter a valid URL (including http:// or https://)");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Analyzing URL:", url.trim());
      
      // Call the edge function to analyze headings
      const { data, error } = await supabase.functions.invoke("analyze-headings", {
        body: { url: url.trim() }
      });

      console.log("Response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to analyze page");
      }

      if (!data) {
        throw new Error("No data returned from analysis");
      }

      const realAnalysis: HeadingAnalysis = {
        h1Count: data.h1Count || 0,
        h2Count: data.h2Count || 0,
        h3Count: data.h3Count || 0,
        h4Count: data.h4Count || 0,
        h5Count: data.h5Count || 0,
        h6Count: data.h6Count || 0,
        h1Tags: data.h1Tags || [],
        h2Tags: data.h2Tags || [],
        h3Tags: data.h3Tags || [],
        issues: data.issues || [],
        recommendations: data.recommendations || []
      };

      console.log("Analysis result:", realAnalysis);
      setAnalysis(realAnalysis);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error("Error analyzing headings:", error);
      toast.error(error.message || "Failed to analyze page. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalHeadings = analysis 
    ? analysis.h1Count + analysis.h2Count + analysis.h3Count + analysis.h4Count + analysis.h5Count + analysis.h6Count
    : 0;

  return (
    <>
      <Helmet>
        <title>Free Heading Analyzer - Check H1, H2, H3 Tags for SEO | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Analyze heading tags (H1-H6) on any webpage for SEO. Check heading structure, find issues, and get optimization recommendations. Free tool, instant results." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/heading-analyzer" />
        <meta property="og:title" content="Free SEO Heading Analyzer - Check H1-H6 Tags" />
        <meta property="og:description" content="Instantly analyze heading tags on any webpage. Find SEO issues and get optimization tips." />
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
                Free <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Heading Analyzer</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Analyze heading tags (H1-H6) on any webpage. Check your heading structure, find SEO issues, and get optimization recommendations instantly.
              </p>
            </div>

            {/* Analyzer Tool */}
            <Card className="max-w-2xl mx-auto mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Enter URL to Analyze
                </CardTitle>
                <CardDescription>
                  We'll check all heading tags and provide SEO recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && analyzeHeadings()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={analyzeHeadings} 
                    disabled={isLoading}
                    className="gradient-primary"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {analysis && (
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Heading Structure Overview</CardTitle>
                    <CardDescription>Found {totalHeadings} heading tags on this page</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-3xl font-bold text-foreground mb-1">{analysis.h1Count}</div>
                        <div className="text-sm text-muted-foreground">H1</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-3xl font-bold text-foreground mb-1">{analysis.h2Count}</div>
                        <div className="text-sm text-muted-foreground">H2</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-3xl font-bold text-foreground mb-1">{analysis.h3Count}</div>
                        <div className="text-sm text-muted-foreground">H3</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-3xl font-bold text-foreground mb-1">{analysis.h4Count}</div>
                        <div className="text-sm text-muted-foreground">H4</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-3xl font-bold text-foreground mb-1">{analysis.h5Count}</div>
                        <div className="text-sm text-muted-foreground">H5</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <div className="text-3xl font-bold text-foreground mb-1">{analysis.h6Count}</div>
                        <div className="text-sm text-muted-foreground">H6</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                {analysis.issues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        Issues Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.issues.map((issue, index) => (
                          <li key={index}>
                            <Alert variant="destructive">
                              <AlertDescription>{issue}</AlertDescription>
                            </Alert>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-sm text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* H1 Tags */}
                {analysis.h1Tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>H1 Tags Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.h1Tags.map((tag, index) => (
                          <li key={index} className="p-3 rounded-lg bg-muted">
                            <span className="text-sm font-medium text-foreground">{tag}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* H2 Tags */}
                {analysis.h2Tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>H2 Tags Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.h2Tags.map((tag, index) => (
                          <li key={index} className="p-3 rounded-lg bg-muted">
                            <span className="text-sm text-muted-foreground">{tag}</span>
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
                      Want Automated Heading Analysis?
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                      Get real-time heading analysis, automated content structure recommendations, and track heading optimization over time with AnotherSEOGuru.
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

            {/* Best Practices */}
            {!analysis && (
              <div className="max-w-5xl mx-auto mt-16">
                <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
                  Heading Tag Best Practices
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📌 One H1 Per Page</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Use exactly one H1 tag per page as your main heading. It should describe the page's primary topic.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🔢 Logical Hierarchy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Follow a logical structure: H1 → H2 → H3. Don't skip heading levels (like H1 → H3).
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🎯 Include Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Naturally include target keywords in your headings, especially H1 and H2 tags.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

