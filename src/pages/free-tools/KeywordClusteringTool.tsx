import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Layers, Download, Loader2, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Cluster {
  name: string;
  keywords: string[];
  searchIntent: string;
  recommendedContentType: string;
}

const FREE_LIMIT = 100;

export default function KeywordClusteringTool() {
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  const keywordCount = keywords.split("\n").filter(k => k.trim()).length;
  const isOverLimit = keywordCount > FREE_LIMIT;

  const clusterKeywords = async () => {
    const keywordList = keywords.split("\n").filter(k => k.trim());

    if (keywordList.length === 0) {
      toast.error("Please enter at least one keyword");
      return;
    }

    if (keywordList.length > FREE_LIMIT) {
      toast.error(`Free tier limited to ${FREE_LIMIT} keywords. Upgrade for unlimited clustering.`);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("cluster-keywords", {
        body: { keywords: keywordList }
      });

      if (error) throw error;

      setClusters(data.clusters || []);
      toast.success(`Clustered ${keywordList.length} keywords into ${data.clusters.length} groups!`);
    } catch (error: any) {
      console.error("Error clustering keywords:", error);
      toast.error("Failed to cluster keywords. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportClusters = () => {
    const csv = ["Cluster,Keyword,Search Intent,Content Type"];
    
    clusters.forEach(cluster => {
      cluster.keywords.forEach(keyword => {
        csv.push(`"${cluster.name}","${keyword}","${cluster.searchIntent}","${cluster.recommendedContentType}"`);
      });
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keyword-clusters-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  return (
    <>
      <Helmet>
        <title>Free Keyword Clustering Tool - Group Keywords by Topic | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Free keyword clustering tool. Upload up to 100 keywords and get instant topical clusters with search intent analysis. No signup required. Export results to CSV." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/keyword-clustering" />
        <meta property="og:title" content="Free Keyword Clustering Tool - 100 Keywords Free" />
        <meta property="og:description" content="Group keywords into topical clusters instantly. Free for up to 100 keywords." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Free Tool - Up to {FREE_LIMIT} Keywords
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                Free <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Keyword Clustering</span> Tool
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Group keywords into topical clusters automatically. Upload your keywords, get instant clusters with search intent analysis, and export to CSV.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      Enter Keywords
                    </CardTitle>
                    <CardDescription>
                      One keyword per line (max {FREE_LIMIT} keywords)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="seo tools&#10;best seo software&#10;seo tools for beginners&#10;free seo tools&#10;..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={isOverLimit ? "destructive" : "outline"} className="font-mono">
                          {keywordCount} / {FREE_LIMIT}
                        </Badge>
                        {isOverLimit && (
                          <span className="text-xs text-destructive">Over limit</span>
                        )}
                      </div>
                      <Button 
                        onClick={clusterKeywords} 
                        disabled={isLoading || keywordCount === 0 || isOverLimit}
                        className="gradient-primary"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Clustering...
                          </>
                        ) : (
                          <>
                            <Layers className="w-4 h-4 mr-2" />
                            Cluster Keywords
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Paste Your Keywords</h4>
                        <p className="text-sm text-muted-foreground">
                          Add up to 100 keywords, one per line. Can be from keyword research tools, Google Search Console, or competitor analysis.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">AI Analyzes Similarity</h4>
                        <p className="text-sm text-muted-foreground">
                          Our AI uses semantic analysis to group keywords by topic, search intent, and content relevance.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Get Organized Clusters</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive topical clusters with search intent classification and recommended content formats. Export as CSV.
                        </p>
                      </div>
                    </div>

                    {isOverLimit && (
                      <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          You've entered {keywordCount} keywords. Free tier is limited to {FREE_LIMIT}. <Link to="/auth" className="underline font-semibold">Upgrade</Link> for unlimited clustering.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              {clusters.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-success" />
                          {clusters.length} Keyword Clusters
                        </CardTitle>
                        <CardDescription>
                          Keywords grouped by topic and search intent
                        </CardDescription>
                      </div>
                      <Button onClick={exportClusters} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {clusters.map((cluster, index) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground mb-1">
                                {cluster.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {cluster.searchIntent}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {cluster.recommendedContentType}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {cluster.keywords.length} keywords
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cluster.keywords.map((keyword, kidx) => (
                              <span
                                key={kidx}
                                className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="mt-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    Need to Cluster 1000s of Keywords?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                    Upgrade to AnotherSEOGuru for unlimited keyword clustering, advanced filtering, automatic content brief generation, and priority support.
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
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

