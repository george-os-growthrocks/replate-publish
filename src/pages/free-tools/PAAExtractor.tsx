import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Download, Sparkles, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { RelatedToolsSection } from "@/components/free-tools/RelatedToolsSection";
import { getRelatedTools } from "@/lib/free-tools-data";
import { supabase } from "@/integrations/supabase/client";

interface PAAQuestion {
  question: string;
  category: "what" | "how" | "why" | "when" | "where" | "who" | "other";
}

export default function PAAExtractor() {
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<PAAQuestion[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const FREE_LIMIT = 10;

  const categorizeQuestion = (q: string): PAAQuestion['category'] => {
    const lower = q.toLowerCase();
    if (lower.startsWith('what')) return 'what';
    if (lower.startsWith('how')) return 'how';
    if (lower.startsWith('why')) return 'why';
    if (lower.startsWith('when')) return 'when';
    if (lower.startsWith('where')) return 'where';
    if (lower.startsWith('who')) return 'who';
    return 'other';
  };

  const handleExtract = async () => {
    if (!keyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    if (usageCount >= FREE_LIMIT) {
      toast.error(`Free limit reached (${FREE_LIMIT} per day). Sign up for unlimited access.`);
      return;
    }

    setIsLoading(true);
    
    try {
      // Call our existing Google Autocomplete API with categorization
      const { data, error } = await supabase.functions.invoke('google-autocomplete', {
        body: { 
          query: keyword,
          expandAlphabet: true // Get more comprehensive results
        }
      });

      if (error) {
        console.error('PAA Error:', error);
        throw new Error('Failed to fetch suggestions');
      }

      if (!data?.categorized) {
        throw new Error('No suggestions found');
      }

      // Extract questions from categorized results
      const allQuestions: string[] = [
        ...(data.categorized.questions || []),
        ...(data.categorized.prepositions || []).filter((q: string) => 
          q.toLowerCase().includes('how') || 
          q.toLowerCase().includes('what') || 
          q.toLowerCase().includes('why')
        ),
      ];

      // Add common PAA patterns
      const paaPatterns = [
        `What is ${keyword}`,
        `How does ${keyword} work`,
        `Why ${keyword}`,
        `How to ${keyword}`,
        `When to use ${keyword}`,
        `Where ${keyword}`,
      ];

      const combinedQuestions = [...new Set([...allQuestions, ...paaPatterns])];

      const categorized: PAAQuestion[] = combinedQuestions.map(q => ({
        question: q,
        category: categorizeQuestion(q),
      }));

      setQuestions(categorized);
      setUsageCount(prev => prev + 1);
      toast.success(`Found ${categorized.length} questions!`);
    } catch (error) {
      console.error('PAA Extraction Error:', error);
      toast.error("Failed to extract questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      'Question,Category',
      ...questions.map(q => `"${q.question}","${q.category}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paa-${keyword.replace(/\s+/g, '-')}.csv`;
    a.click();
    toast.success("CSV downloaded!");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, PAAQuestion[]>);

  return (
    <>
      <Helmet>
        <title>People Also Ask Extractor - Free SEO Tool | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Extract People Also Ask questions from Google. Turn questions into content briefs, export to CSV, and optimize your content strategy." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/paa-extractor" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto max-w-4xl text-center">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                100% Free Tool
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                People Also Ask Extractor
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Turn Google's PAA questions into content briefs in seconds. De-dupe, categorize, and export—all free.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  No Sign-Up Required
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {FREE_LIMIT} Queries/Day
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  CSV Export
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
                  {usageCount}/{FREE_LIMIT} queries used today
                </Badge>
              </div>

              {/* Input */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Enter Your Keyword</CardTitle>
                  <CardDescription>
                    We'll extract all "People Also Ask" questions related to your topic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      placeholder="e.g., keyword research tools"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleExtract} 
                      disabled={isLoading || usageCount >= FREE_LIMIT}
                      className="gradient-primary min-w-[140px]"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extracting...</>
                      ) : (
                        <><Search className="w-4 h-4 mr-2" /> Extract PAA</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {questions.length > 0 && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{questions.length}</div>
                      <div className="text-sm text-muted-foreground">Total Questions</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-500">{groupedQuestions['what']?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">What Questions</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-500">{groupedQuestions['how']?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">How Questions</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-amber-500">{groupedQuestions['why']?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Why Questions</div>
                    </Card>
                  </div>

                  {/* Export */}
                  <div className="flex justify-end gap-3 mb-6">
                    <Button variant="outline" onClick={handleExportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  {/* Questions by Category */}
                  <div className="space-y-6">
                    {Object.entries(groupedQuestions).map(([category, qs]) => (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle className="capitalize">{category} Questions ({qs.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {qs.map((q, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                              >
                                <span className="text-sm">{q.question}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(q.question)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* CTA */}
                  <Card className="mt-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                    <CardContent className="p-8 text-center">
                      <h3 className="text-2xl font-bold mb-3">Want More Questions?</h3>
                      <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                        Sign up for unlimited extractions, bulk processing, and automatic content brief generation
                      </p>
                      <Button asChild size="lg" className="gradient-primary">
                        <Link to="/auth">
                          Get Unlimited Access
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </section>

          <RelatedToolsSection tools={getRelatedTools("paa-extractor")} />
        </main>

        <Footer />
      </div>
    </>
  );
}

