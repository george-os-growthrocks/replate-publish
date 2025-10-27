import { useState, useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { groupByPage } from "@/lib/cannibalization";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Search, FileText, Gauge, Link2, Loader2, CheckCircle2, AlertCircle, Award, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnPageInstant, useBacklinksLive } from "@/hooks/useDataForSEO";
import { analyzeContentQuality } from "@/lib/seo-algorithms";

// Component to show OnPage and Backlinks data for a specific page
interface PageMetricsProps {
  pageUrl: string;
}

function PageMetrics({ pageUrl }: PageMetricsProps) {
  const { data: onPageData, isLoading: onPageLoading } = useOnPageInstant(
    { type: "instant", url: pageUrl },
    !!pageUrl
  );

  const { data: backlinksData, isLoading: backlinksLoading } = useBacklinksLive(
    { target: pageUrl, mode: "as_is", limit: 100 },
    !!pageUrl
  );

  const onPageResult = onPageData?.tasks?.[0]?.result?.[0];
  const backlinksResult = backlinksData?.tasks?.[0]?.result?.[0];

  if (onPageLoading || backlinksLoading) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-white/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading page metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* OnPage Metrics */}
      {onPageResult && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-4 w-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">On-Page SEO</h4>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">Status Code</div>
              <div className={`text-lg font-bold ${
                onPageResult.status_code === 200 ? "text-emerald-400" : "text-red-400"
              }`}>
                {onPageResult.status_code || "-"}
              </div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">Meta Title</div>
              <div className="text-sm font-medium mt-1">
                {onPageResult.meta?.title ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">Meta Description</div>
              <div className="text-sm font-medium mt-1">
                {onPageResult.meta?.description ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">H1 Tag</div>
              <div className="text-sm font-medium mt-1">
                {onPageResult.meta?.htags?.h1?.length > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Quality Score */}
      {onPageResult && (
        (() => {
          // Extract content metrics from OnPage data
          const contentLength = onPageResult.meta?.content?.text_length || 0;
          const headingCount = Object.values(onPageResult.meta?.htags || {}).flat().length || 0;
          const imageCount = onPageResult.meta?.images?.length || 0;
          const internalLinksCount = onPageResult.meta?.internal_links_count || 0;
          const externalLinksCount = onPageResult.meta?.external_links_count || 0;
          
          // Estimate keyword density (simplified)
          const keywordDensity = 0.015; // Default 1.5%
          
          // Calculate content quality score
          const qualityAnalysis = analyzeContentQuality({
            wordCount: Math.floor(contentLength / 6), // Rough estimate: chars / 6 = words
            headingCount,
            imageCount,
            videoCount: 0,
            internalLinks: internalLinksCount,
            externalLinks: externalLinksCount,
            keywordDensity,
            readabilityScore: 60, // Default
          });

          const scoreColor = qualityAnalysis.overallScore >= 80 
            ? 'text-emerald-400' 
            : qualityAnalysis.overallScore >= 60 
              ? 'text-amber-400' 
              : 'text-red-400';

          return (
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  <h4 className="text-sm font-semibold text-white">Content Quality Score</h4>
                </div>
                <div className={`text-3xl font-bold ${scoreColor}`}>
                  {qualityAnalysis.overallScore}/100
                </div>
              </div>
              
              {/* Score Breakdown */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                  <div className="text-xs text-muted-foreground">Length</div>
                  <div className="text-sm font-bold">{qualityAnalysis.breakdown.length}/100</div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                  <div className="text-xs text-muted-foreground">Keywords</div>
                  <div className="text-sm font-bold">{qualityAnalysis.breakdown.keywords}/100</div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                  <div className="text-xs text-muted-foreground">Readability</div>
                  <div className="text-sm font-bold">{qualityAnalysis.breakdown.readability}/100</div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                  <div className="text-xs text-muted-foreground">Media</div>
                  <div className="text-sm font-bold">{qualityAnalysis.breakdown.media}/100</div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                  <div className="text-xs text-muted-foreground">Links</div>
                  <div className="text-sm font-bold">{qualityAnalysis.breakdown.links}/100</div>
                </div>
              </div>

              {/* Recommendations */}
              {qualityAnalysis.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Improvement Recommendations:
                  </div>
                  <div className="space-y-1">
                    {qualityAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}

      {/* Backlinks Metrics */}
      {backlinksResult && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Backlinks</h4>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">Total Backlinks</div>
              <div className="text-lg font-bold text-emerald-400">
                {backlinksResult.total_count?.toLocaleString() || "0"}
              </div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">Referring Domains</div>
              <div className="text-lg font-bold text-blue-400">
                {backlinksResult.referring_domains || "0"}
              </div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">Dofollow Links</div>
              <div className="text-lg font-bold">
                {backlinksResult.dofollow || "0"}
              </div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded border border-white/5">
              <div className="text-xs text-muted-foreground">Nofollow Links</div>
              <div className="text-lg font-bold text-muted-foreground">
                {backlinksResult.nofollow || "0"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error States */}
      {!onPageResult && !onPageLoading && (
        <div className="text-xs text-muted-foreground">
          ⚠️ On-Page data unavailable
        </div>
      )}
      {!backlinksResult && !backlinksLoading && (
        <div className="text-xs text-muted-foreground">
          ⚠️ Backlinks data unavailable
        </div>
      )}
    </div>
  );
}

export default function PagesPage() {
  const { propertyUrl, dateRange, country, device } = useFilters();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
    device,
  });

  const pages = useMemo(() => {
    if (!rows) return [];
    const grouped = groupByPage(rows);
    
    if (!searchTerm) return grouped;
    
    return grouped.filter((p) =>
      p.page.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  const toggleRow = (page: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(page)) {
      newExpanded.delete(page);
    } else {
      newExpanded.add(page);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pages</h1>
          <p className="text-muted-foreground mt-1">
            Analyze page performance with AI-powered content quality scoring, on-page metrics, and backlink analysis
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Pages</div>
          <div className="text-2xl font-bold mt-1">{pages.length.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Clicks</div>
          <div className="text-2xl font-bold mt-1">
            {pages.reduce((sum, p) => sum + p.totalClicks, 0).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Keywords/Page</div>
          <div className="text-2xl font-bold mt-1">
            {(pages.reduce((sum, p) => sum + p.queries.length, 0) / pages.length).toFixed(0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Position</div>
          <div className="text-2xl font-bold mt-1">
            {(pages.reduce((sum, p) => sum + p.avgPosition, 0) / pages.length).toFixed(1)}
          </div>
        </Card>
      </div>

      {/* Pages Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Page</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Award className="h-3 w-3" />
                  Score
                </div>
              </TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Position</TableHead>
              <TableHead className="text-right">Keywords</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.slice(0, 100).map((page) => {
              const isExpanded = expandedRows.has(page.page);

              // Calculate Performance Score (0-100)
              const positionScore = Math.max(0, 100 - (page.avgPosition * 5)); // Better position = higher score
              const ctrScore = Math.min(100, (page.avgCtr * 100) * 5); // Higher CTR = higher score
              const clickScore = Math.min(100, (page.totalClicks / 10) * 2); // More clicks = higher score
              const performanceScore = Math.round((positionScore * 0.4) + (ctrScore * 0.4) + (clickScore * 0.2));

              const scoreColor = performanceScore >= 70 
                ? 'text-emerald-400' 
                : performanceScore >= 50 
                  ? 'text-amber-400' 
                  : 'text-red-400';

              return (
                <>
                  {/* Main Row */}
                  <TableRow
                    key={page.page}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(page.page)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium max-w-md truncate">
                      {page.page}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`text-xl font-bold ${scoreColor}`}>
                        {performanceScore}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {page.totalClicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {page.totalImpressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(page.avgCtr * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {page.avgPosition.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {page.queries.length}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Keywords */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/30 p-0">
                        <div className="p-4">
                          {/* Page Metrics - OnPage & Backlinks 
                          Note: Disabled due to API reliability issues
                          <PageMetrics pageUrl={page.page} />
                          */}

                          {/* Keywords Section */}
                          <div className="text-sm font-medium mb-3 mt-6 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Top keywords for this page
                          </div>
                          <div className="space-y-2">
                            {page.queries.slice(0, 20).map((query, idx) => (
                              <div
                                key={query.query}
                                className="flex items-center justify-between p-3 rounded-lg bg-background border"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-sm">
                                      {query.query}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="text-right">
                                    <div className="font-medium">
                                      {query.clicks.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      clicks
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      {(query.ctr * 100).toFixed(2)}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      CTR
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      {query.position.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      position
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {page.queries.length > 20 && (
                              <div className="text-sm text-muted-foreground text-center py-2">
                                And {page.queries.length - 20} more keywords...
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

