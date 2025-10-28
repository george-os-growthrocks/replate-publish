import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Search, ArrowRight, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface KeywordStats {
  keyword: string;
  count: number;
  density: number;
}

export default function KeywordDensityChecker() {
  const [text, setText] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [keywords, setKeywords] = useState<KeywordStats[]>([]);

  const analyzeText = () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    // Calculate word and character count
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const totalWords = words.length;
    setWordCount(totalWords);
    setCharCount(text.length);

    // Count single words
    const wordFrequency: { [key: string]: number } = {};
    words.forEach((word) => {
      if (word.length > 2) { // Ignore short words
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });

    // Count 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (words[i].length > 2 && words[i + 1].length > 2) {
        wordFrequency[phrase] = (wordFrequency[phrase] || 0) + 1;
      }
    }

    // Count 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (words[i].length > 2 && words[i + 1].length > 2 && words[i + 2].length > 2) {
        wordFrequency[phrase] = (wordFrequency[phrase] || 0) + 1;
      }
    }

    // Calculate density and sort
    const keywordStats: KeywordStats[] = Object.entries(wordFrequency)
      .map(([keyword, count]) => ({
        keyword,
        count,
        density: (count / totalWords) * 100
      }))
      .filter(stat => stat.count > 1) // Only show keywords that appear more than once
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 keywords

    setKeywords(keywordStats);
    setAnalyzed(true);
    toast.success("Text analyzed successfully!");
  };

  const getDensityColor = (density: number) => {
    if (density >= 3) return "text-destructive";
    if (density >= 2) return "text-yellow-600";
    return "text-success";
  };

  const getDensityLabel = (density: number) => {
    if (density >= 3) return "Too High";
    if (density >= 2) return "Moderate";
    if (density >= 1) return "Good";
    return "Low";
  };

  const siteUrl = "https://anotherseoguru.com";
  const pageUrl = `${siteUrl}/free-tools/keyword-density-checker`;

  return (
    <>
      <Helmet>
        <title>Free Keyword Density Checker - Analyze Keyword Usage & SEO | AnotherSEOGuru</title>
        <meta
          name="description"
          content="Check keyword density and frequency in your content. Analyze single keywords and phrases to optimize for SEO without keyword stuffing. Free tool."
        />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Free Keyword Density Checker - Optimize Content for SEO" />
        <meta property="og:description" content="Analyze keyword usage and density in your content. Find the perfect balance for SEO." />
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
                Free <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Keyword Density Checker</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Analyze keyword density and frequency in your content. Check single words and multi-word phrases to optimize for SEO without keyword stuffing.
              </p>
            </div>

            <div className="max-w-6xl mx-auto space-y-6">
              {/* Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Paste Your Content
                  </CardTitle>
                  <CardDescription>
                    Enter the text you want to analyze for keyword density
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste your article, blog post, or any text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {charCount} characters • {wordCount} words
                    </div>
                    <Button onClick={analyzeText} className="gradient-primary">
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Keywords
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {analyzed && (
                <>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{wordCount}</p>
                          <p className="text-sm text-muted-foreground mt-1">Total Words</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{charCount}</p>
                          <p className="text-sm text-muted-foreground mt-1">Characters</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{keywords.length}</p>
                          <p className="text-sm text-muted-foreground mt-1">Unique Keywords</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">
                            {keywords[0] ? keywords[0].density.toFixed(2) : "0"}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Top Density</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Keyword Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Keyword Analysis</CardTitle>
                      <CardDescription>
                        Top keywords and phrases sorted by frequency
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Rank</TableHead>
                              <TableHead>Keyword/Phrase</TableHead>
                              <TableHead className="text-right">Count</TableHead>
                              <TableHead className="text-right">Density</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {keywords.slice(0, 30).map((keyword, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell className="font-mono text-sm">{keyword.keyword}</TableCell>
                                <TableCell className="text-right">{keyword.count}</TableCell>
                                <TableCell className={`text-right font-semibold ${getDensityColor(keyword.density)}`}>
                                  {keyword.density.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant={keyword.density >= 3 ? "destructive" : keyword.density >= 2 ? "secondary" : "default"}
                                    className="text-xs"
                                  >
                                    {getDensityLabel(keyword.density)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardHeader>
                      <CardTitle>SEO Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-success rounded-full mt-1.5 flex-shrink-0"></span>
                        <p><strong className="text-foreground">Optimal keyword density:</strong> 1-2% for primary keywords</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0"></span>
                        <p><strong className="text-foreground">Watch for over-optimization:</strong> Density above 3% may be considered keyword stuffing</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></span>
                        <p><strong className="text-foreground">Use semantic keywords:</strong> Include related terms and synonyms naturally</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-secondary rounded-full mt-1.5 flex-shrink-0"></span>
                        <p><strong className="text-foreground">Focus on user intent:</strong> Write for humans first, search engines second</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* CTA */}
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    Need AI-Powered Content Optimization?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                    Get real-time keyword suggestions and AI-powered content optimization with AnotherSEOGuru.
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

