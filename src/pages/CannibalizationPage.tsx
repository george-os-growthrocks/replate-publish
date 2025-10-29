import { useMemo, useState } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { findCannibalClusters } from "@/lib/cannibalization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ExternalLink, Link as LinkIcon, Sparkles, Target, Loader2, TrendingUp, Clock, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateKeywordDifficulty, analyzeCtr } from "@/lib/seo-algorithms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSerpOverview } from "@/hooks/useDataForSEO";
import { VisualContentBrief } from "@/components/cannibalization/VisualContentBrief";

// Component to show SERP competitors for a query
interface SerpCompetitorsProps {
  query: string;
}

function SerpCompetitors({ query }: SerpCompetitorsProps) {
  const { data: serpData, isLoading } = useSerpOverview(
    { keyword: query, location_code: 2840, language_code: "en" },
    !!query
  );

  const competitors = serpData?.tasks?.[0]?.result?.[0]?.items || [];

  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-white/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading SERP competitors...</span>
        </div>
      </div>
    );
  }

  if (!competitors || competitors.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-amber-400" />
        <h4 className="text-sm font-semibold text-foreground">SERP Competitors</h4>
        <Badge variant="outline" className="ml-auto text-xs">
          Top {Math.min(competitors.length, 10)}
        </Badge>
      </div>
      <div className="space-y-2">
        {competitors.slice(0, 10).map((comp: any, idx: number) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded bg-slate-950/50 border border-white/5"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {comp.domain || comp.url || "Unknown"}
                </div>
                {comp.full_domain_metrics && (
                  <div className="text-xs text-muted-foreground">
                    Rank: {comp.full_domain_metrics.organic?.pos || "-"} • 
                    Keywords: {comp.full_domain_metrics.organic?.count?.toLocaleString() || "0"}
                  </div>
                )}
              </div>
            </div>
            {comp.rank_absolute && (
              <Badge variant={comp.rank_absolute <= 3 ? "destructive" : "secondary"}>
                Pos {comp.rank_absolute}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CannibalizationPage() {
  const { propertyUrl, dateRange, country, device } = useFilters();
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [actionChecklist, setActionChecklist] = useState<Set<string>>(new Set());
  const [geminiBrief, setGeminiBrief] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  const generateGeminiBrief = async (cluster: any) => {
    setIsGeneratingBrief(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        toast.error("Authentication required");
        return;
      }

      const { data, error } = await supabase.functions.invoke("gemini-cannibalization", {
        body: {
          data: {
            type: "consolidation",
            query: cluster.query,
            primaryPage: cluster.primaryCandidate,
            supportingPages: cluster.pages
              .filter((p: any) => p.page !== cluster.primaryCandidate)
              .map((p: any) => p.page),
            metrics: cluster.pages.map((p: any) => ({
              page: p.page,
              clicks: p.clicks,
              impressions: p.impressions,
              position: p.position,
            })),
          },
        },
      });

      if (error) throw error;
      
      setGeminiBrief(data?.insight || "Brief generated successfully!");
      toast.success("Content brief generated!");
    } catch (error: any) {
      console.error("Error generating brief:", error);
      toast.error("Failed to generate brief");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
    device,
  });

  // Enhanced clusters with SEO metrics
  const enrichedClusters = useMemo(() => {
    if (!rows) return [];
    const baseClusters = findCannibalClusters(rows, { minPages: 2, minImpressions: 50 });
    
    // Enrich with SEO algorithms
    return baseClusters.map(cluster => {
      // Calculate keyword difficulty
      const difficulty = calculateKeywordDifficulty(
        {
          keyword: cluster.query,
          searchVolume: cluster.totalImpressions,
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
      
      // Calculate average position
      const avgPosition = cluster.pages.reduce((sum, p) => sum + p.position, 0) / cluster.pages.length;
      
      // CTR analysis
      const ctrAnalysis = analyzeCtr({
        currentPosition: Math.round(avgPosition),
        searchVolume: cluster.totalImpressions,
        hasRichSnippet: false,
        hasSitelinks: false,
        serpFeatures: [],
      });
      
      // Calculate consolidation opportunity score
      const consolidationScore = calculateConsolidationScore({
        pageCount: cluster.pages.length,
        totalClicks: cluster.totalClicks,
        totalImpressions: cluster.totalImpressions,
        avgPosition,
        difficulty: difficulty.difficulty,
      });
      
      return {
        ...cluster,
        metrics: {
          difficulty: difficulty.difficulty,
          difficultyLevel: difficulty.competitionLevel,
          estimatedTimeToRank: difficulty.estimatedTimeToRank,
          requiredBacklinks: difficulty.requiredBacklinks,
          avgPosition: Math.round(avgPosition * 10) / 10,
          expectedCtr: ctrAnalysis.expectedCtr,
          potentialClicks: ctrAnalysis.potentialClicks,
          improvementOpportunity: ctrAnalysis.improvementOpportunity,
          consolidationScore,
        },
      };
    }).sort((a, b) => (b.metrics?.consolidationScore || 0) - (a.metrics?.consolidationScore || 0));
  }, [rows]);

  // Helper function to calculate consolidation opportunity score
  function calculateConsolidationScore(params: {
    pageCount: number;
    totalClicks: number;
    totalImpressions: number;
    avgPosition: number;
    difficulty: number;
  }): number {
    const { pageCount, totalClicks, totalImpressions, avgPosition, difficulty } = params;
    
    // More pages = higher consolidation need
    const pageCountScore = Math.min(100, pageCount * 20);
    
    // Higher impressions = more important to fix
    const impressionsScore = Math.min(100, (totalImpressions / 1000) * 25);
    
    // Worse position = bigger opportunity
    const positionScore = Math.max(0, avgPosition / 20 * 50);
    
    // Lower difficulty = easier to consolidate and rank
    const difficultyScore = (100 - difficulty) * 0.15;
    
    return Math.round(pageCountScore * 0.35 + impressionsScore * 0.3 + positionScore * 0.2 + difficultyScore * 0.15);
  }

  const clusters = enrichedClusters;

  const highImpactClusters = clusters.filter((c) => c.totalImpressions > 500);
  const mediumImpactClusters = clusters.filter(
    (c) => c.totalImpressions >= 100 && c.totalImpressions <= 500
  );

  const toggleAction = (action: string) => {
    const newChecklist = new Set(actionChecklist);
    if (newChecklist.has(action)) {
      newChecklist.delete(action);
    } else {
      newChecklist.add(action);
    }
    setActionChecklist(newChecklist);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cannibalization Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Detect keyword cannibalization + content gaps with AI-powered consolidation scoring and competitor analysis
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Clusters</div>
          <div className="text-2xl font-bold mt-1">{clusters.length}</div>
        </Card>
        <Card className="p-4 border-red-500/50">
          <div className="text-sm text-muted-foreground">High Impact</div>
          <div className="text-2xl font-bold mt-1 text-red-500">
            {highImpactClusters.length}
          </div>
        </Card>
        <Card className="p-4 border-amber-500/50">
          <div className="text-sm text-muted-foreground">Medium Impact</div>
          <div className="text-2xl font-bold mt-1 text-amber-500">
            {mediumImpactClusters.length}
          </div>
        </Card>
        <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
          <div className="text-sm text-emerald-200 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Potential Clicks
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">
            +{clusters
              .reduce((sum, c) => sum + (c.metrics?.potentialClicks || 0), 0)
              .toLocaleString()}
          </div>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="text-sm text-blue-200 flex items-center gap-1">
            <Target className="h-3 w-3" />
            Quick Wins
          </div>
          <div className="text-2xl font-bold mt-1 text-blue-400">
            {clusters.filter(c => c.metrics && c.metrics.difficulty < 30 && c.metrics.consolidationScore > 60).length}
          </div>
          <div className="text-xs text-blue-300/70 mt-1">Low difficulty</div>
        </Card>
      </div>

      {/* Clusters */}
      {clusters.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cannibalization Found</h3>
          <p className="text-muted-foreground">
            Your pages are well-optimized with minimal keyword overlap
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster) => {
            const impactLevel =
              cluster.totalImpressions > 500
                ? "high"
                : cluster.totalImpressions > 100
                ? "medium"
                : "low";
            const impactColor =
              impactLevel === "high"
                ? "border-red-500/50 bg-red-500/5"
                : impactLevel === "medium"
                ? "border-amber-500/50 bg-amber-500/5"
                : "";

            return (
              <Card key={cluster.query} className={`p-6 ${impactColor}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{cluster.query}</h3>
                      <Badge
                        variant={
                          impactLevel === "high"
                            ? "destructive"
                            : impactLevel === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {impactLevel.toUpperCase()} IMPACT
                      </Badge>
                      <Badge variant="outline">
                        {cluster.pageCount} pages
                      </Badge>
                      {cluster.metrics && (
                        <Badge className={
                          cluster.metrics.difficultyLevel === 'low' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          cluster.metrics.difficultyLevel === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          cluster.metrics.difficultyLevel === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }>
                          {cluster.metrics.difficultyLevel.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {cluster.rationale}
                    </p>

                    {/* SEO Metrics - Consolidation Opportunity */}
                    {cluster.metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-3 bg-slate-900/30 rounded-lg">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Priority
                          </div>
                          <div className={`text-lg font-bold ${
                            cluster.metrics.consolidationScore > 70 ? 'text-emerald-400' :
                            cluster.metrics.consolidationScore > 50 ? 'text-amber-400' :
                            'text-muted-foreground'
                          }`}>
                            {cluster.metrics.consolidationScore}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Avg Position</div>
                          <div className="text-lg font-bold">#{cluster.metrics.avgPosition}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Potential
                          </div>
                          <div className="text-lg font-bold text-emerald-400">
                            +{cluster.metrics.potentialClicks}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Time
                          </div>
                          <div className="text-lg font-bold">{cluster.metrics.estimatedTimeToRank}mo</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                          <div className="text-lg font-bold">{cluster.metrics.difficulty}/100</div>
                        </div>
                      </div>
                    )}

                    {/* Pages */}
                    <div className="space-y-2 mb-4">
                      {cluster.pages.map((page, idx) => (
                        <div
                          key={page.page}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            page.page === cluster.primaryCandidate
                              ? "border-green-500 bg-green-500/5"
                              : "bg-background"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground">
                              #{idx + 1}
                            </div>
                            {page.page === cluster.primaryCandidate && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                PRIMARY
                              </Badge>
                            )}
                            <span className="text-sm truncate">{page.page}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                              <div className="font-medium">{page.clicks}</div>
                              <div className="text-xs text-muted-foreground">
                                clicks
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {(page.ctr * 100).toFixed(2)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                CTR
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {page.position.toFixed(1)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                position
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-blue-600">
                                {page.score.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                score
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedCluster(cluster)}
                    className="flex-1"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    View Action Plan
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={cluster.primaryCandidate}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Primary
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consolidation Action Plan</DialogTitle>
            <DialogDescription>
              For query: <strong>"{selectedCluster?.query}"</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedCluster && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="font-medium mb-2">Primary Page (Keep This)</div>
                <div className="text-sm break-all">{selectedCluster.primaryCandidate}</div>
              </div>

              <div>
                <div className="font-medium mb-3">Action Checklist:</div>
                <div className="space-y-2">
                  {[
                    "Set canonical tag from supporting pages to primary page",
                    "Add 301 redirects from thin/duplicate pages to primary",
                    "Consolidate unique content from supporting pages into primary",
                    "Update internal links to point to primary page",
                    "Add noindex tag to supporting pages (if keeping live)",
                    "Update meta title/description on primary for better CTR",
                    "Monitor rankings for 2-4 weeks after changes",
                  ].map((action, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                      <Checkbox
                        checked={actionChecklist.has(`${selectedCluster.query}-${idx}`)}
                        onCheckedChange={() =>
                          toggleAction(`${selectedCluster.query}-${idx}`)
                        }
                      />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SERP Competitors */}
              <SerpCompetitors query={selectedCluster.query} />

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Supporting Pages to Consolidate:
                </div>
                <div className="space-y-2">
                  {selectedCluster.pages
                    .filter((p: any) => p.page !== selectedCluster.primaryCandidate)
                    .map((page: any) => (
                      <div key={page.page} className="text-sm break-all">
                        • {page.page}
                      </div>
                    ))}
                </div>
              </div>

              {/* Gemini Brief Button */}
              <Button
                onClick={() => generateGeminiBrief(selectedCluster)}
                disabled={isGeneratingBrief}
                className="w-full"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGeneratingBrief ? "Generating Brief..." : "Generate Content Brief with AI"}
              </Button>

              {/* Show Brief - Beautifully Formatted */}
              {geminiBrief && (
                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-500/30 rounded-xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">AI Content Brief</h3>
                        <p className="text-sm text-purple-300">AI-Generated Action Plan</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Expert Level
                    </Badge>
                  </div>
                  <VisualContentBrief content={geminiBrief} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

