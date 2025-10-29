import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Search, Loader2, ExternalLink, TrendingUp, Calendar, Award, Shield, AlertTriangle, Target, Zap, BarChart3 } from "lucide-react";
import { useBacklinksLive, useBacklinksHistory } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FeatureGate } from "@/components/FeatureGate";

export default function BacklinksPage() {
  const [url, setUrl] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [activeTab, setActiveTab] = useState("live");

  const { data: backlinksData, isLoading: backlinksLoading, error: backlinksError } = useBacklinksLive(
    { target: searchUrl, mode: "as_is", limit: 100 },
    !!searchUrl
  );

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

  const { data: historyData, isLoading: historyLoading } = useBacklinksHistory(
    {
      target: searchUrl,
      date_from: threeMonthsAgo.toISOString().split("T")[0],
      date_to: now.toISOString().split("T")[0],
      group_by: "month"
    },
    !!searchUrl && activeTab === "history"
  );

  const handleSearch = () => {
    if (!url.trim()) {
      toast.error("Please enter a domain or URL");
      return;
    }
    setSearchUrl(url.trim());
  };

  const backlinksResult = backlinksData?.tasks?.[0]?.result?.[0];
  const backlinks = backlinksResult?.items || [];
  const historyItems = historyData?.tasks?.[0]?.result?.[0]?.items || [];

  const calculateLinkQuality = (backlink: any): number => {
    let score = 50;
    if (backlink.rank && backlink.rank > 0) {
      const authorityBonus = Math.min(30, Math.floor(backlink.rank / 10));
      score += authorityBonus;
    }
    if (backlink.dofollow) {
      score += 20;
    }
    if (backlink.url_from_https) {
      score += 5;
    }
    if (backlink.anchor && backlink.anchor.length > 3 && 
        !['click here', 'read more', 'here'].includes(backlink.anchor.toLowerCase())) {
      score += 15;
    }
    if (backlink.links_count && backlink.links_count > 10) {
      score -= 10;
    }
    return Math.max(0, Math.min(100, score));
  };

  const enrichedBacklinks = useMemo(() => {
    return backlinks.map((bl: any) => ({
      ...bl,
      qualityScore: calculateLinkQuality(bl),
      authorityLevel: bl.rank && bl.rank > 500 ? 'high' : bl.rank && bl.rank > 100 ? 'medium' : 'low'
    }));
  }, [backlinks]);

  const analytics = useMemo(() => {
    if (enrichedBacklinks.length === 0) return null;

    const highQuality = enrichedBacklinks.filter((bl: any) => bl.qualityScore >= 70).length;
    const mediumQuality = enrichedBacklinks.filter((bl: any) => bl.qualityScore >= 40 && bl.qualityScore < 70).length;
    const lowQuality = enrichedBacklinks.filter((bl: any) => bl.qualityScore < 40).length;
    
    const avgQuality = enrichedBacklinks.reduce((sum: number, bl: any) => sum + bl.qualityScore, 0) / enrichedBacklinks.length;

    const anchorMap = new Map<string, number>();
    enrichedBacklinks.forEach((bl: any) => {
      const anchor = bl.anchor || '(no anchor)';
      anchorMap.set(anchor, (anchorMap.get(anchor) || 0) + 1);
    });
    const topAnchors = Array.from(anchorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const domainMap = new Map<string, { count: number; dofollow: number; avgQuality: number; qualities: number[] }>();
    enrichedBacklinks.forEach((bl: any) => {
      const domain = bl.domain_from || 'unknown';
      const existing = domainMap.get(domain) || { count: 0, dofollow: 0, avgQuality: 0, qualities: [] };
      existing.count++;
      if (bl.dofollow) existing.dofollow++;
      existing.qualities.push(bl.qualityScore);
      domainMap.set(domain, existing);
    });

    const topDomains = Array.from(domainMap.entries())
      .map(([domain, data]) => ({
        domain,
        count: data.count,
        dofollow: data.dofollow,
        avgQuality: Math.round(data.qualities.reduce((a, b) => a + b, 0) / data.qualities.length)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      highQuality,
      mediumQuality,
      lowQuality,
      avgQuality: Math.round(avgQuality),
      topAnchors,
      topDomains
    };
  }, [enrichedBacklinks]);

  return (
    <FeatureGate feature="backlink_analysis" requiredPlan="Pro">
      <div className="space-y-6">
        {/* Header */}
        <div>
        <h1 className="text-3xl font-bold text-foreground">Backlinks Analysis</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered backlink quality scoring, authority analysis, and link profile insights with actionable recommendations
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Link2 className="h-5 w-5 text-primary" />
          <Input
            placeholder="Enter domain or URL (e.g., example.com or https://example.com/page)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={backlinksLoading || historyLoading}>
            {backlinksLoading || historyLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Analyze
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {backlinksError && (
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <div className="text-red-200">
            ⚠️ Error: {backlinksError.message}
          </div>
        </Card>
      )}

      {/* Results */}
      {searchUrl && (
        <>
          {/* Stats Cards */}
          {backlinksResult && analytics && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Total Backlinks</div>
                  <div className="text-2xl font-bold mt-1 text-emerald-400">
                    {backlinksResult.total_count?.toLocaleString() || "0"}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Referring Domains</div>
                  <div className="text-2xl font-bold mt-1 text-blue-400">
                    {backlinksResult.referring_domains?.toLocaleString() || "0"}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Dofollow Ratio</div>
                  <div className="text-2xl font-bold mt-1">
                    {backlinksResult.total_count > 0 
                      ? ((backlinksResult.dofollow / backlinksResult.total_count) * 100).toFixed(0) 
                      : "0"}%
                  </div>
                </Card>
                <Card className="p-4 bg-purple-500/5 border-purple-500/20">
                  <div className="text-sm text-purple-200 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Avg Quality
                  </div>
                  <div className="text-2xl font-bold mt-1 text-purple-400">
                    {analytics.avgQuality}/100
                  </div>
                </Card>
                <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
                  <div className="text-sm text-emerald-200 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    High Quality
                  </div>
                  <div className="text-2xl font-bold mt-1 text-emerald-400">
                    {analytics.highQuality}
                  </div>
                  <div className="text-xs text-emerald-300/70 mt-1">
                    {enrichedBacklinks.length > 0 
                      ? ((analytics.highQuality / enrichedBacklinks.length) * 100).toFixed(0) 
                      : 0}% of total
                  </div>
                </Card>
              </div>

              {/* Quality Distribution */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Link Quality Distribution</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {enrichedBacklinks.length} links analyzed
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">High Quality (70-100)</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{analytics.highQuality} links</span>
                    </div>
                    <Progress 
                      value={enrichedBacklinks.length > 0 ? (analytics.highQuality / enrichedBacklinks.length) * 100 : 0} 
                      className="h-2 bg-slate-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium">Medium Quality (40-69)</span>
                      </div>
                      <span className="text-sm font-bold text-amber-400">{analytics.mediumQuality} links</span>
                    </div>
                    <Progress 
                      value={enrichedBacklinks.length > 0 ? (analytics.mediumQuality / enrichedBacklinks.length) * 100 : 0} 
                      className="h-2 bg-slate-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-medium">Low Quality (0-39)</span>
                      </div>
                      <span className="text-sm font-bold text-red-400">{analytics.lowQuality} links</span>
                    </div>
                    <Progress 
                      value={enrichedBacklinks.length > 0 ? (analytics.lowQuality / enrichedBacklinks.length) * 100 : 0} 
                      className="h-2 bg-slate-900"
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="live">Live Backlinks</TabsTrigger>
              <TabsTrigger value="domains">Top Domains</TabsTrigger>
              <TabsTrigger value="anchors">Anchor Text</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Live Backlinks Tab */}
            <TabsContent value="live" className="space-y-4 mt-4">
              {backlinksLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : enrichedBacklinks.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Quality
                          </div>
                        </TableHead>
                        <TableHead>Source Domain</TableHead>
                        <TableHead>Source URL</TableHead>
                        <TableHead>Anchor Text</TableHead>
                        <TableHead className="text-right">Type</TableHead>
                        <TableHead className="text-right">First Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedBacklinks
                        .sort((a: any, b: any) => b.qualityScore - a.qualityScore)
                        .slice(0, 50)
                        .map((backlink: any, idx: number) => {
                          const qualityColor = backlink.qualityScore >= 70 
                            ? 'text-emerald-400' 
                            : backlink.qualityScore >= 40 
                              ? 'text-amber-400' 
                              : 'text-red-400';

                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`text-lg font-bold ${qualityColor}`}>
                                    {backlink.qualityScore}
                                  </div>
                                  {backlink.qualityScore >= 70 && (
                                    <Shield className="h-4 w-4 text-emerald-400" />
                                  )}
                                  {backlink.qualityScore < 40 && (
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {backlink.domain_from || "-"}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                <a
                                  href={backlink.url_from}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  {backlink.url_from?.substring(0, 40)}...
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {backlink.anchor || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={backlink.dofollow ? "default" : "secondary"}>
                                  {backlink.dofollow ? "Dofollow" : "Nofollow"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {backlink.first_seen 
                                  ? new Date(backlink.first_seen).toLocaleDateString()
                                  : "-"
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Backlinks Found</h3>
                  <p className="text-muted-foreground">
                    No backlinks detected for this URL or domain
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Top Domains Tab */}
            <TabsContent value="domains" className="space-y-4 mt-4">
              {analytics && analytics.topDomains.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Award className="h-3 w-3" />
                            Avg Quality
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Total Links</TableHead>
                        <TableHead className="text-right">Dofollow Links</TableHead>
                        <TableHead className="text-right">Dofollow %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.topDomains.map((domain: any, idx: number) => {
                        const qualityColor = domain.avgQuality >= 70 
                          ? 'text-emerald-400' 
                          : domain.avgQuality >= 40 
                            ? 'text-amber-400' 
                            : 'text-red-400';

                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {idx < 3 && <Award className="h-4 w-4 text-amber-400" />}
                                {domain.domain}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`text-xl font-bold ${qualityColor}`}>
                                {domain.avgQuality}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-sm">
                                {domain.count} links
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-emerald-400 font-semibold">
                                {domain.dofollow}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">
                                {((domain.dofollow / domain.count) * 100).toFixed(0)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Domain Data</h3>
                  <p className="text-muted-foreground">
                    Unable to analyze referring domains
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Anchor Text Tab */}
            <TabsContent value="anchors" className="space-y-4 mt-4">
              {analytics && analytics.topAnchors.length > 0 ? (
                <>
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Top 10 Anchor Texts
                    </h3>
                    <div className="space-y-3">
                      {analytics.topAnchors.map(([anchor, count]: [string, number], idx: number) => {
                        const maxCount = analytics.topAnchors[0][1];
                        const percentage = (count / maxCount) * 100;

                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  #{idx + 1}
                                </span>
                                <span className="font-medium truncate max-w-md">
                                  "{anchor}"
                                </span>
                              </div>
                              <Badge variant="outline">
                                {count} {count === 1 ? 'link' : 'links'}
                              </Badge>
                            </div>
                            <Progress value={percentage} className="h-2 bg-slate-900" />
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Anchor Text Recommendations */}
                  <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-blue-400" />
                      <h3 className="font-semibold text-blue-200">Anchor Text Recommendations</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <p className="text-blue-100">
                          <strong>Diversify:</strong> Mix branded, exact match, and natural anchors (70/20/10 ratio)
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <p className="text-blue-100">
                          <strong>Avoid Over-Optimization:</strong> Too many exact match anchors can trigger spam filters
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <p className="text-blue-100">
                          <strong>Natural Variations:</strong> Use LSI keywords and long-tail variations
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Anchor Data</h3>
                  <p className="text-muted-foreground">
                    Unable to analyze anchor text distribution
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              {historyLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : historyItems.length > 0 ? (
                <>
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Backlink Growth Over Time
                    </h3>
                    <div className="space-y-3">
                      {historyItems.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {new Date(item.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.referring_domains || 0} referring domains
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Total Links</div>
                              <div className="text-xl font-bold text-emerald-400">
                                {item.backlinks?.toLocaleString() || "0"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">New Links</div>
                              <div className="text-xl font-bold text-blue-400">
                                +{item.new_backlinks?.toLocaleString() || "0"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Lost Links</div>
                              <div className="text-xl font-bold text-red-400">
                                -{item.lost_backlinks?.toLocaleString() || "0"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Total Gained</div>
                      <div className="text-2xl font-bold mt-1 text-emerald-400">
                        +{historyItems.reduce((sum: number, item: any) => sum + (item.new_backlinks || 0), 0).toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Total Lost</div>
                      <div className="text-2xl font-bold mt-1 text-red-400">
                        -{historyItems.reduce((sum: number, item: any) => sum + (item.lost_backlinks || 0), 0).toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Net Growth</div>
                      <div className="text-2xl font-bold mt-1">
                        {(
                          historyItems.reduce((sum: number, item: any) => sum + (item.new_backlinks || 0), 0) -
                          historyItems.reduce((sum: number, item: any) => sum + (item.lost_backlinks || 0), 0)
                        ).toLocaleString()}
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Historical Data</h3>
                  <p className="text-muted-foreground">
                    Unable to fetch backlink history for this domain
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Initial State */}
      {!searchUrl && (
        <Card className="p-12 text-center">
          <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyze Backlink Profile</h3>
          <p className="text-muted-foreground mb-4">
            Enter a domain or URL to discover backlinks and track growth over time
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            See who's linking to you, anchor text distribution, dofollow vs nofollow, and historical trends
          </div>
        </Card>
      )}

      {/* Debug Panel removed */}
      </div>
    </FeatureGate>
  );
}

