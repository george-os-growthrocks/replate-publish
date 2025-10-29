import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Target, Star, TrendingUp, ExternalLink, Zap, Shield, Award, AlertCircle, Lightbulb, BarChart3, Globe } from "lucide-react";
import { useSerpAdvanced } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { optimizeForSerpFeature } from "@/lib/seo-algorithms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useCredits } from "@/hooks/useCreditManager";
import { FeatureDebugPanel, DebugLog } from "@/components/debug/FeatureDebugPanel";

export default function SerpAnalysisPage() {
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [locationCode, setLocationCode] = useState(2300); // Greece default
  const [languageCode, setLanguageCode] = useState("el"); // Greek default
  const { checkCredits, consumeCredits } = useCredits();
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (level: DebugLog['level'], message: string) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    console.log(`[${level.toUpperCase()}] ${message}`);
    setDebugLogs(prev => [...prev, log]);
  };

  const { data: serpData, isLoading, error } = useSerpAdvanced(
    { keyword: searchKeyword, location_code: locationCode, language_code: languageCode, device: "desktop" },
    !!searchKeyword
  );

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    // Check credits before SERP analysis
    const hasCredits = await checkCredits('serp_analysis');
    if (!hasCredits) {
      addDebugLog('warn', '⚠️ Insufficient credits for SERP analysis');
      return;
    }

    addDebugLog('info', `🔍 Starting SERP analysis for keyword: "${keyword.trim()}"`);
    addDebugLog('info', `Location: ${locationCode}, Language: ${languageCode}`);
    setSearchKeyword(keyword.trim());
  };

  // Consume credits after successful SERP analysis
  useEffect(() => {
    if (serpData && searchKeyword) {
      addDebugLog('success', `✅ SERP data received for "${searchKeyword}"`);
      const resultCount = serpData?.tasks?.[0]?.result?.[0]?.items_count || 0;
      addDebugLog('info', `Found ${resultCount} SERP items`);
      consumeCredits({
        feature: 'serp_analysis',
        credits: 3,
        metadata: {
          keyword: searchKeyword,
          location: locationCode
        }
      });
    }
  }, [serpData, searchKeyword]);

  const serpResult = serpData?.tasks?.[0]?.result?.[0];
  const serpItems = serpResult?.items || [];
  const organicResults = serpItems.filter((item: any) => item.type === "organic");
  const featuredSnippet = serpItems.find((item: any) => item.type === "featured_snippet");
  const paaItems = serpItems.filter((item: any) => item.type === "people_also_ask");
  const relatedSearches = serpItems.filter((item: any) => item.type === "related_searches");

  // Advanced SERP Feature Detection
  const serpFeatures = useMemo(() => {
    if (serpItems.length === 0) return null;

    const features = {
      featured_snippet: serpItems.some((item: any) => item.type === "featured_snippet"),
      people_also_ask: serpItems.some((item: any) => item.type === "people_also_ask"),
      local_pack: serpItems.some((item: any) => item.type === "local_pack" || item.type === "map"),
      knowledge_graph: serpItems.some((item: any) => item.type === "knowledge_graph"),
      image_pack: serpItems.some((item: any) => item.type === "images"),
      video_carousel: serpItems.some((item: any) => item.type === "video"),
      shopping_results: serpItems.some((item: any) => item.type === "shopping" || item.type === "paid_shopping"),
      top_stories: serpItems.some((item: any) => item.type === "top_stories"),
      reviews: serpItems.some((item: any) => item.type === "reviews" || item.type === "google_reviews"),
      sitelinks: organicResults.some((item: any) => item.links && item.links.length > 0),
      paid_ads: serpItems.filter((item: any) => item.type === "paid").length,
    };

    const featureCount = Object.values(features).filter((v) => v === true || (typeof v === 'number' && v > 0)).length;
    
    return { ...features, count: featureCount };
  }, [serpItems, organicResults]);

  // Ranking Difficulty Analysis
  const rankingDifficulty = useMemo(() => {
    if (organicResults.length === 0) return null;

    const topDomains = organicResults.slice(0, 10).map((r: any) => r.domain);
    const uniqueDomains = new Set(topDomains).size;
    const diversityScore = (uniqueDomains / 10) * 100;

    // Check for strong domains (simple heuristic)
    const strongDomains = topDomains.filter((d: string) => 
      d.includes('wikipedia') || d.includes('youtube') || d.includes('amazon')
    ).length;

    const hasFS = serpFeatures?.featured_snippet || false;
    const hasPAA = serpFeatures?.people_also_ask || false;
    const serpComplexity = serpFeatures?.count || 0;

    let difficulty = 50; // base

    // Increase difficulty for strong domains
    difficulty += strongDomains * 10;

    // Increase for low diversity (same domains dominating)
    if (diversityScore < 50) difficulty += 15;

    // Increase for complex SERP
    difficulty += serpComplexity * 3;

    // Decrease if no featured snippet (easier to rank)
    if (!hasFS) difficulty -= 10;

    difficulty = Math.max(0, Math.min(100, difficulty));

    const level = difficulty >= 70 ? 'Very High' : difficulty >= 50 ? 'High' : difficulty >= 30 ? 'Medium' : 'Low';

    return { score: Math.round(difficulty), level, diversityScore: Math.round(diversityScore), strongDomains };
  }, [organicResults, serpFeatures]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">SERP Analysis</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered SERP feature detection, ranking difficulty analysis, and optimization strategies for any keyword
        </p>
      </div>

      {/* Location Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Target Market:</span>
          </div>
          <Select value={locationCode.toString()} onValueChange={(val) => setLocationCode(Number(val))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2300">🇬🇷 Greece</SelectItem>
              <SelectItem value="2840">🇺🇸 United States</SelectItem>
              <SelectItem value="2826">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="2276">🇩🇪 Germany</SelectItem>
              <SelectItem value="2250">🇫🇷 France</SelectItem>
              <SelectItem value="2380">🇮🇹 Italy</SelectItem>
              <SelectItem value="2724">🇪🇸 Spain</SelectItem>
            </SelectContent>
          </Select>
          <Select value={languageCode} onValueChange={setLanguageCode}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="el">Greek (Ελληνικά)</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Search Input */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <Input
            placeholder='Enter keyword to analyze (e.g., "κτημα γαμου")'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Analyze SERP
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <div className="text-red-200">
            ⚠️ Error: {error.message}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && searchKeyword && serpItems.length > 0 && serpFeatures && rankingDifficulty && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Organic Results</div>
              <div className="text-2xl font-bold mt-1 text-emerald-400">{organicResults.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">SERP Features</div>
              <div className="text-2xl font-bold mt-1 text-blue-400">{serpFeatures.count}</div>
            </Card>
            <Card className={`p-4 ${rankingDifficulty.score >= 70 ? 'bg-red-500/5 border-red-500/20' : rankingDifficulty.score >= 50 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
              <div className={`text-sm flex items-center gap-1 ${rankingDifficulty.score >= 70 ? 'text-red-200' : rankingDifficulty.score >= 50 ? 'text-amber-200' : 'text-emerald-200'}`}>
                <Shield className="h-3 w-3" />
                Difficulty
              </div>
              <div className={`text-2xl font-bold mt-1 ${rankingDifficulty.score >= 70 ? 'text-red-400' : rankingDifficulty.score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {rankingDifficulty.score}/100
              </div>
              <div className={`text-xs mt-1 ${rankingDifficulty.score >= 70 ? 'text-red-300/70' : rankingDifficulty.score >= 50 ? 'text-amber-300/70' : 'text-emerald-300/70'}`}>
                {rankingDifficulty.level}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Domain Diversity</div>
              <div className="text-2xl font-bold mt-1">{rankingDifficulty.diversityScore}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {rankingDifficulty.diversityScore >= 70 ? 'Highly diverse' : rankingDifficulty.diversityScore >= 50 ? 'Moderate' : 'Low diversity'}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Authority Domains</div>
              <div className="text-2xl font-bold mt-1 text-purple-400">{rankingDifficulty.strongDomains}</div>
              <div className="text-xs text-muted-foreground mt-1">in top 10</div>
            </Card>
          </div>

          {/* Ranking Difficulty Analysis */}
          <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-purple-200">Ranking Difficulty Breakdown</h3>
              </div>
              <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                {rankingDifficulty.level} Competition
              </Badge>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Difficulty</span>
                  <span className="font-bold">{rankingDifficulty.score}/100</span>
                </div>
                <Progress value={rankingDifficulty.score} className="h-2 bg-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-950/50 p-3 rounded border border-white/5">
                  <div className="text-xs text-muted-foreground">SERP Complexity</div>
                  <div className="text-lg font-bold">{serpFeatures.count} features</div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded border border-white/5">
                  <div className="text-xs text-muted-foreground">Strong Competitors</div>
                  <div className="text-lg font-bold">{rankingDifficulty.strongDomains} domains</div>
                </div>
              </div>
            </div>
          </Card>

          {/* SERP Features Detection */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Detected SERP Features
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {serpFeatures.featured_snippet && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-200">Featured Snippet</span>
                  </div>
                </div>
              )}
              {serpFeatures.people_also_ask && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-200">People Also Ask</span>
                  </div>
                </div>
              )}
              {serpFeatures.local_pack && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-200">Local Pack</span>
                  </div>
                </div>
              )}
              {serpFeatures.knowledge_graph && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-200">Knowledge Graph</span>
                  </div>
                </div>
              )}
              {serpFeatures.image_pack && (
                <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">🖼️</span>
                    <span className="text-sm font-medium text-pink-200">Image Pack</span>
                  </div>
                </div>
              )}
              {serpFeatures.video_carousel && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">🎥</span>
                    <span className="text-sm font-medium text-red-200">Video Carousel</span>
                  </div>
                </div>
              )}
              {serpFeatures.shopping_results && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">🛒</span>
                    <span className="text-sm font-medium text-green-200">Shopping Results</span>
                  </div>
                </div>
              )}
              {serpFeatures.top_stories && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400">📰</span>
                    <span className="text-sm font-medium text-orange-200">Top Stories</span>
                  </div>
                </div>
              )}
              {serpFeatures.reviews && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-200">Reviews</span>
                  </div>
                </div>
              )}
              {serpFeatures.sitelinks && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400">🔗</span>
                    <span className="text-sm font-medium text-indigo-200">Sitelinks</span>
                  </div>
                </div>
              )}
              {serpFeatures.paid_ads > 0 && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400">💰</span>
                    <span className="text-sm font-medium text-rose-200">{serpFeatures.paid_ads} Paid Ads</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Featured Snippet */}
          {featuredSnippet && (
            <Card className="p-6 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold">Featured Snippet</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Domain</div>
                  <div className="font-medium text-lg">{featuredSnippet.domain}</div>
                </div>
                {featuredSnippet.title && (
                  <div>
                    <div className="text-sm text-muted-foreground">Title</div>
                    <div className="font-medium">{featuredSnippet.title}</div>
                  </div>
                )}
                {featuredSnippet.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Snippet Text</div>
                    <div className="text-sm">{featuredSnippet.description}</div>
                  </div>
                )}
                {featuredSnippet.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={featuredSnippet.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Page
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* SERP Feature Optimization Recommendations */}
          <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-emerald-200">🎯 Optimization Opportunities</h3>
            </div>
            <div className="space-y-4">
              {serpFeatures.featured_snippet && (() => {
                const fsOptimization = optimizeForSerpFeature({
                  feature: "featured_snippet",
                  currentPosition: 1,
                  hasFeature: true
                });
                return (
                  <div className="bg-slate-950/50 p-4 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      <span className="font-semibold text-foreground">Featured Snippet Strategy</span>
                      <Badge variant="outline" className="text-amber-300 border-amber-500/30 ml-auto">
                        {fsOptimization.estimatedImpact}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {fsOptimization.strategies.slice(0, 3).map((strategy, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span className="text-emerald-100">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {serpFeatures.people_also_ask && (() => {
                const paaOptimization = optimizeForSerpFeature({
                  feature: "people_also_ask",
                  currentPosition: 1,
                  hasFeature: true
                });
                return (
                  <div className="bg-slate-950/50 p-4 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-400" />
                      <span className="font-semibold text-foreground">People Also Ask Strategy</span>
                      <Badge variant="outline" className="text-blue-300 border-blue-500/30 ml-auto">
                        {paaOptimization.estimatedImpact}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {paaOptimization.strategies.slice(0, 3).map((strategy, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span className="text-blue-100">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {serpFeatures.local_pack && (() => {
                const localOptimization = optimizeForSerpFeature({
                  feature: "local_pack",
                  currentPosition: 1,
                  hasFeature: true
                });
                return (
                  <div className="bg-slate-950/50 p-4 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-emerald-400" />
                      <span className="font-semibold text-foreground">Local Pack Strategy</span>
                      <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 ml-auto">
                        {localOptimization.estimatedImpact}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {localOptimization.strategies.slice(0, 3).map((strategy, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">•</span>
                          <span className="text-emerald-100">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {!serpFeatures.featured_snippet && organicResults.length > 0 && (
                <div className="bg-slate-950/50 p-4 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-foreground">Target Featured Snippet</span>
                    <Badge variant="outline" className="text-amber-300 border-amber-500/30 ml-auto">
                      High Impact
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span className="text-amber-100">Add a clear, concise answer paragraph (40-60 words) at the top of your content</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span className="text-amber-100">Use bullet points or numbered lists to answer the query</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span className="text-amber-100">Match the format of existing snippets (paragraph, list, or table)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Organic Results */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Organic Results
            </h3>
            <div className="space-y-3">
              {organicResults.slice(0, 20).map((result: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="outline" className="font-mono">
                        #{result.rank_absolute || idx + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {result.title || "No title"}
                        </div>
                        <div className="text-sm text-muted-foreground truncate mt-1">
                          {result.domain}
                        </div>
                      </div>
                    </div>
                  </div>
                  {result.description && (
                    <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {result.description}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    {result.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visit
                        </a>
                      </Button>
                    )}
                    {result.breadcrumb && (
                      <div className="text-xs text-muted-foreground truncate">
                        {result.breadcrumb}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* People Also Ask */}
          {paaItems.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">People Also Ask</h3>
              <div className="space-y-2">
                {paaItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/50 border border-white/5"
                  >
                    <div className="font-medium text-sm">{item.title || item.question}</div>
                    {item.answer && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Related Searches */}
          {relatedSearches.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Related Searches</h3>
              <div className="flex flex-wrap gap-2">
                {relatedSearches.map((item: any, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {item.title || item.query}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && serpItems.length === 0 && searchKeyword && (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No SERP Data Found</h3>
          <p className="text-muted-foreground">
            Unable to fetch SERP results for this keyword
          </p>
        </Card>
      )}

      {/* Initial State */}
      {!searchKeyword && !isLoading && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyze Any Keyword's SERP</h3>
          <p className="text-muted-foreground mb-4">
            Enter a keyword to see real-time search results and SERP features
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            Discover: Featured snippets, PAA questions, organic rankings, and related searches
          </div>
        </Card>
      )}

      {/* Debug Panel */}
      <FeatureDebugPanel
        logs={debugLogs}
        featureName="SERP Analysis"
        onClear={() => setDebugLogs([])}
      />
    </div>
  );
}

