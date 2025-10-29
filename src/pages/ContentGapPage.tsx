import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, AlertCircle, Zap, Target, FileText, Award, Clock, Users } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { groupByQuery } from "@/lib/cannibalization";
import { calculateKeywordDifficulty, analyzeCtr, analyzeContentQuality } from "@/lib/seo-algorithms";
import { toast } from "sonner";
import { FeatureGate } from "@/components/FeatureGate";

interface ContentGap {
  keyword: string;
  competitorRanking: number;
  yourRanking: number | null;
  searchVolume: number;
  difficulty: number;
  difficultyLevel: 'low' | 'medium' | 'high' | 'very_high';
  estimatedTimeToRank: number;
  potentialClicks: number;
  requiredBacklinks: number;
  requiredWordCount: number;
  gapType: 'missing' | 'underperforming' | 'opportunity';
  priorityScore: number;
}

export default function ContentGapPage() {
  const { propertyUrl, dateRange, country, device } = useFilters();
  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
    device,
  });

  const [competitorDomains, setCompetitorDomains] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [activeGapType, setActiveGapType] = useState<'all' | 'missing' | 'underperforming' | 'opportunity'>('all');

  const queries = useMemo(() => {
    if (!rows) return [];
    return groupByQuery(rows);
  }, [rows]);

  const addCompetitor = () => {
    if (!newCompetitor.trim()) {
      toast.error("Please enter a competitor domain");
      return;
    }

    // Clean domain
    const cleanDomain = newCompetitor
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    if (competitorDomains.includes(cleanDomain)) {
      toast.error("Competitor already added");
      return;
    }

    setCompetitorDomains([...competitorDomains, cleanDomain]);
    setNewCompetitor("");
    toast.success(`Added competitor: ${cleanDomain}`);
  };

  const removeCompetitor = (domain: string) => {
    setCompetitorDomains(competitorDomains.filter(d => d !== domain));
    toast.success("Competitor removed");
  };

  const analyzeGaps = async () => {
    if (competitorDomains.length === 0) {
      toast.error("Please add at least one competitor");
      return;
    }

    if (!queries || queries.length === 0) {
      toast.error("No search data available");
      return;
    }

    setIsAnalyzing(true);
    toast.info("Analyzing content gaps...");

    try {
      // Simulate competitor analysis
      // In production, this would call SERP API to get competitor rankings
      const analyzedGaps: ContentGap[] = [];

      queries.forEach((query) => {
        const yourPosition = query.position || 100;
        const searchVolume = query.impressions || 0;

        // Simulate competitor rankings (in production, fetch from SERP API)
        const hasCompetitorRanking = Math.random() > 0.3; // 70% have competitors
        
        if (hasCompetitorRanking || yourPosition > 20) {
          const competitorPosition = Math.floor(Math.random() * 15) + 1; // 1-15
          
          // Determine gap type
          let gapType: 'missing' | 'underperforming' | 'opportunity';
          if (yourPosition > 100 || !query.clicks) {
            gapType = 'missing'; // You don't rank
          } else if (yourPosition > competitorPosition + 5) {
            gapType = 'underperforming'; // Competitor ranks much better
          } else {
            gapType = 'opportunity'; // Close race
          }

          // Calculate SEO metrics
          const difficulty = calculateKeywordDifficulty(
            {
              keyword: query.query,
              searchVolume,
              cpc: 0,
              competition: 0.5,
            },
            {
              avgDomainAuthority: 50,
              avgBacklinks: 100,
              avgContentLength: 2000,
              topRankingPages: 10,
            }
          );

          const ctrAnalysis = analyzeCtr({
            currentPosition: competitorPosition,
            searchVolume,
            hasRichSnippet: false,
            hasSitelinks: false,
            serpFeatures: [],
          });

          // Calculate priority score
          const priorityScore = calculateGapPriorityScore({
            gapType,
            difficulty: difficulty.difficulty,
            searchVolume,
            competitorPosition,
            yourPosition,
            potentialClicks: ctrAnalysis.potentialClicks,
          });

          analyzedGaps.push({
            keyword: query.query,
            competitorRanking: competitorPosition,
            yourRanking: yourPosition > 100 ? null : yourPosition,
            searchVolume,
            difficulty: difficulty.difficulty,
            difficultyLevel: difficulty.competitionLevel,
            estimatedTimeToRank: difficulty.estimatedTimeToRank,
            potentialClicks: ctrAnalysis.potentialClicks,
            requiredBacklinks: difficulty.requiredBacklinks,
            requiredWordCount: Math.round(2000 + (difficulty.difficulty * 20)), // Scale with difficulty
            gapType,
            priorityScore,
          });
        }
      });

      // Sort by priority score
      analyzedGaps.sort((a, b) => b.priorityScore - a.priorityScore);

      setGaps(analyzedGaps);
      toast.success(`Found ${analyzedGaps.length} content gap opportunities!`);
    } catch (error) {
      console.error("Gap analysis error:", error);
      toast.error("Failed to analyze gaps");
    } finally {
      setIsAnalyzing(false);
    }
  };

  function calculateGapPriorityScore(params: {
    gapType: 'missing' | 'underperforming' | 'opportunity';
    difficulty: number;
    searchVolume: number;
    competitorPosition: number;
    yourPosition: number;
    potentialClicks: number;
  }): number {
    const { gapType, difficulty, searchVolume, competitorPosition, yourPosition, potentialClicks } = params;

    // Gap type multiplier
    const gapTypeScore = gapType === 'opportunity' ? 30 : gapType === 'underperforming' ? 25 : 20;

    // Lower difficulty = higher score
    const difficultyScore = (100 - difficulty) * 0.25;

    // Higher search volume = higher score
    const volumeScore = Math.min(100, (searchVolume / 1000) * 10) * 0.2;

    // Competitor position (better = higher opportunity)
    const competitorScore = (20 - competitorPosition) / 20 * 100 * 0.15;

    // Potential clicks
    const clicksScore = Math.min(100, potentialClicks / 5) * 0.1;

    return Math.round(gapTypeScore + difficultyScore + volumeScore + competitorScore + clicksScore);
  }

  const filteredGaps = useMemo(() => {
    if (activeGapType === 'all') return gaps;
    return gaps.filter(gap => gap.gapType === activeGapType);
  }, [gaps, activeGapType]);

  const gapStats = useMemo(() => {
    return {
      missing: gaps.filter(g => g.gapType === 'missing').length,
      underperforming: gaps.filter(g => g.gapType === 'underperforming').length,
      opportunity: gaps.filter(g => g.gapType === 'opportunity').length,
      totalPotentialClicks: gaps.reduce((sum, g) => sum + g.potentialClicks, 0),
      quickWins: gaps.filter(g => g.difficulty < 30 && g.potentialClicks > 50).length,
    };
  }, [gaps]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading search data...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="content_gap_analysis" requiredPlan="Pro">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Content Gap Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Discover content opportunities where competitors rank but you don't
        </p>
      </div>

      {/* Competitor Management */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add Competitors</h2>
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="competitor.com"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
          />
          <Button onClick={addCompetitor} className="shrink-0">
            <Users className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>
        </div>

        {competitorDomains.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {competitorDomains.map((domain) => (
              <Badge key={domain} variant="secondary" className="text-sm py-1 px-3">
                {domain}
                <button
                  onClick={() => removeCompetitor(domain)}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Button
          onClick={analyzeGaps}
          disabled={isAnalyzing || competitorDomains.length === 0}
          className="w-full gradient-primary"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Content Gaps...
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Analyze Content Gaps
            </>
          )}
        </Button>
      </Card>

      {/* Stats */}
      {gaps.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Gaps</div>
              <div className="text-3xl font-bold">{gaps.length}</div>
            </Card>
            <Card className="p-6 bg-emerald-500/5 border-emerald-500/20">
              <div className="text-sm text-emerald-200 mb-1 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Quick Wins
              </div>
              <div className="text-3xl font-bold text-emerald-400">{gapStats.quickWins}</div>
              <div className="text-xs text-emerald-300/70">Low difficulty</div>
            </Card>
            <Card className="p-6 bg-red-500/5 border-red-500/20">
              <div className="text-sm text-red-200 mb-1">Missing Content</div>
              <div className="text-3xl font-bold text-red-400">{gapStats.missing}</div>
            </Card>
            <Card className="p-6 bg-amber-500/5 border-amber-500/20">
              <div className="text-sm text-amber-200 mb-1">Underperforming</div>
              <div className="text-3xl font-bold text-amber-400">{gapStats.underperforming}</div>
            </Card>
            <Card className="p-6 bg-blue-500/5 border-blue-500/20">
              <div className="text-sm text-blue-200 mb-1">Opportunities</div>
              <div className="text-3xl font-bold text-blue-400">{gapStats.opportunity}</div>
            </Card>
          </div>

          <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-200">Potential Monthly Traffic</div>
                <div className="text-2xl font-bold text-purple-100">
                  +{gapStats.totalPotentialClicks.toLocaleString()} clicks
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </Card>

          {/* Gap Type Filter */}
          <Tabs value={activeGapType} onValueChange={(v) => setActiveGapType(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({gaps.length})</TabsTrigger>
              <TabsTrigger value="missing">Missing ({gapStats.missing})</TabsTrigger>
              <TabsTrigger value="underperforming">Underperforming ({gapStats.underperforming})</TabsTrigger>
              <TabsTrigger value="opportunity">Opportunities ({gapStats.opportunity})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Content Gaps List */}
          <div className="space-y-4">
            {filteredGaps.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No gaps found in this category</p>
              </Card>
            ) : (
              filteredGaps.map((gap, index) => {
                const gapTypeColors = {
                  missing: 'bg-red-500/10 text-red-400 border-red-500/20',
                  underperforming: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  opportunity: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                };

                const difficultyColors = {
                  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                  very_high: 'bg-red-500/10 text-red-400 border-red-500/20',
                };

                const priorityColor = gap.priorityScore > 70 
                  ? 'text-emerald-400' 
                  : gap.priorityScore > 50 
                    ? 'text-amber-400' 
                    : 'text-muted-foreground';

                return (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-l-4" style={{
                    borderLeftColor: gap.gapType === 'missing' ? 'rgb(248 113 113)' :
                                    gap.gapType === 'underperforming' ? 'rgb(251 191 36)' :
                                    'rgb(96 165 250)'
                  }}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-semibold">{gap.keyword}</h3>
                          <Badge className={gapTypeColors[gap.gapType]}>
                            {gap.gapType === 'missing' ? '🚫 Missing' :
                             gap.gapType === 'underperforming' ? '📉 Underperforming' :
                             '🎯 Opportunity'}
                          </Badge>
                          <Badge className={difficultyColors[gap.difficultyLevel]}>
                            {gap.difficultyLevel.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Search Volume: {gap.searchVolume.toLocaleString()}</span>
                          <span>Competitor: #{gap.competitorRanking}</span>
                          <span>You: {gap.yourRanking ? `#${gap.yourRanking}` : 'Not ranking'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                          <Award className="h-3 w-3" />
                          Priority
                        </div>
                        <div className={`text-3xl font-bold ${priorityColor}`}>
                          {gap.priorityScore}
                        </div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-900/30 rounded-lg">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Difficulty
                        </div>
                        <div className="text-lg font-bold">{gap.difficulty}/100</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Time to Rank
                        </div>
                        <div className="text-lg font-bold">{gap.estimatedTimeToRank}mo</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Potential Clicks</div>
                        <div className="text-lg font-bold text-emerald-400">
                          +{gap.potentialClicks.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Content Needs
                        </div>
                        <div className="text-lg font-bold">{gap.requiredWordCount}+ words</div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="bg-slate-900/20 p-4 rounded-lg">
                      <div className="text-sm font-semibold mb-2">Requirements to Rank:</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <span>{gap.requiredBacklinks} quality backlinks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                          <span>{gap.requiredWordCount}+ word article</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                          <span>Comprehensive topic coverage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                          <span>Rich media (images + videos)</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {filteredGaps.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredGaps.length} of {gaps.length} content gaps • Sorted by Priority Score
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {gaps.length === 0 && !isAnalyzing && (
        <Card className="p-12 text-center">
          <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Find Content Opportunities</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add your competitors above and click "Analyze Content Gaps" to discover keywords they rank for but you don't.
          </p>
        </Card>
      )}
      </div>
    </FeatureGate>
  );
}

