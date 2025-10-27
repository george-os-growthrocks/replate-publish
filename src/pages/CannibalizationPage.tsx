import { useMemo, useState } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { findCannibalClusters } from "@/lib/cannibalization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ExternalLink, Link as LinkIcon, Sparkles, Target, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
        <h4 className="text-sm font-semibold text-white">SERP Competitors</h4>
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

  const clusters = useMemo(() => {
    if (!rows) return [];
    return findCannibalClusters(rows, { minPages: 2, minImpressions: 50 });
  }, [rows]);

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
        <h1 className="text-3xl font-bold">Cannibalization Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Queries ranking on multiple pages - consolidate to improve performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
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
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Impressions</div>
          <div className="text-2xl font-bold mt-1">
            {clusters
              .reduce((sum, c) => sum + c.totalImpressions, 0)
              .toLocaleString()}
          </div>
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
                    <div className="flex items-center gap-3 mb-2">
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
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {cluster.rationale}
                    </p>

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
                {isGeneratingBrief ? "Generating Brief..." : "Generate Content Brief with Gemini"}
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
                        <h3 className="text-xl font-bold text-white">Gemini Content Brief</h3>
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

