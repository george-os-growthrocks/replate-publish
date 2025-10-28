import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, Check, FileText, Link2, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FeatureGate } from "@/components/FeatureGate";
import { useCredits } from "@/hooks/useCreditManager";

interface MetaVariation {
  text: string;
  length: number;
  style: string;
  hasKeyword: boolean;
  pixelWidth: number;
  ctrPrediction: string;
}

export default function MetaDescriptionGenerator() {
  const [inputMode, setInputMode] = useState<'content' | 'url'>('content');
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [variations, setVariations] = useState<MetaVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { checkCredits, consumeCredits } = useCredits();

  const handleGenerate = async () => {
    if (inputMode === 'content' && !content.trim()) {
      toast.error("Please enter some content");
      return;
    }
    if (inputMode === 'url' && !url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Check credits
    const hasCredits = await checkCredits('meta_description_generator');
    if (!hasCredits) {
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-description-generator', {
        body: {
          content: inputMode === 'content' ? content : null,
          url: inputMode === 'url' ? url : null,
          keyword: keyword || null,
        }
      });

      if (error) throw error;

      if (!data || !data.variations) {
        throw new Error('No variations generated');
      }

      // Consume credits
      await consumeCredits({
        feature: 'meta_description_generator',
        metadata: {
          keyword,
          input_mode: inputMode,
          variations_count: data.variations.length
        }
      });

      setVariations(data.variations);
      toast.success(`Generated ${data.variations.length} meta descriptions!`);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate meta descriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getCTRColor = (prediction: string) => {
    switch (prediction) {
      case 'Excellent': return 'text-green-600 dark:text-green-400';
      case 'Good': return 'text-blue-600 dark:text-blue-400';
      case 'Fair': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-red-600 dark:text-red-400';
    }
  };

  const getCTRBadgeVariant = (prediction: string) => {
    switch (prediction) {
      case 'Excellent': return 'default';
      case 'Good': return 'secondary';
      case 'Fair': return 'outline';
      default: return 'destructive';
    }
  };

  return (
    <>
      <Helmet>
        <title>Free Meta Description Generator - AI-Powered SEO Tool | AnotherSEOGuru</title>
        <meta name="description" content="Generate compelling meta descriptions with AI. Get 5 variations optimized for CTR, with character count and pixel width analysis. Free SEO tool." />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/meta-description-generator" />
      </Helmet>

      <FeatureGate feature="meta_description_generator">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Meta Description Generator</h1>
            <p className="text-muted-foreground">
              Generate AI-powered meta descriptions optimized for click-through rates
            </p>
          </div>

          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generate Meta Descriptions
              </CardTitle>
              <CardDescription>
                Enter your content or URL to generate 5 compelling meta description variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Mode Toggle */}
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'content' | 'url')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Paste Content
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Enter URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content</label>
                    <Textarea
                      placeholder="Paste your page content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Page URL</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/page"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll fetch and analyze the content from this URL
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Target Keyword */}
              <div>
                <label className="text-sm font-medium mb-2 block">Target Keyword (Optional)</label>
                <Input
                  placeholder="e.g., seo tools, meta description generator"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The keyword you want to include in the meta description
                </p>
              </div>

              <Button onClick={handleGenerate} disabled={isLoading} className="gradient-primary w-full">
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate 5 Variations</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {variations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Generated Variations</h2>
              
              {variations.map((variation, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {variation.style}
                          </Badge>
                          <Badge variant={getCTRBadgeVariant(variation.ctrPrediction)}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            CTR: {variation.ctrPrediction}
                          </Badge>
                        </div>
                        <p className="text-lg leading-relaxed">{variation.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(variation.text, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Character Count</p>
                        <p className={`text-sm font-semibold ${
                          variation.length >= 150 && variation.length <= 160
                            ? 'text-green-600 dark:text-green-400'
                            : variation.length > 160
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {variation.length} / 160
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pixel Width</p>
                        <p className={`text-sm font-semibold ${
                          variation.pixelWidth <= 920 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          ~{variation.pixelWidth}px
                        </p>
                        <p className="text-xs text-muted-foreground">Max: 920px</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Keyword</p>
                        <p className={`text-sm font-semibold ${
                          variation.hasKeyword 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {variation.hasKeyword ? '✓ Included' : '✗ Missing'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Meta Description Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><strong>Length:</strong> Keep it between 150-160 characters for optimal display</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><strong>Keywords:</strong> Include your target keyword naturally</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><strong>Call to Action:</strong> Use action words like "discover," "learn," "get"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><strong>Unique:</strong> Each page should have a unique meta description</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span><strong>Compelling:</strong> Make it engaging to increase click-through rates</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    </>
  );
}

