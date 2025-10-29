import { useState, useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { groupByQuery } from "@/lib/cannibalization";
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
import { ChevronDown, ChevronRight, Search, TrendingUp, Target, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSerpAdvanced } from "@/hooks/useDataForSEO";
import { calculateCtrGapOpportunity } from "@/lib/seo-scoring";

// SERP Item interface
interface SerpItem {
  type: string;
  title?: string;
  links?: Array<{ url: string }>;
  rank_group?: number;
  rank_absolute?: number;
}

// CTR Gap Analysis Component
interface CtrGapAnalysisProps {
  query: string;
  impressions: number;
  ctr: number;
  position: number;
}

function CtrGapAnalysis({ query, impressions, ctr, position }: CtrGapAnalysisProps) {
  
  const { data: serpData, isLoading, error } = useSerpAdvanced(
    { keyword: query, location_code: 2840, language_code: "en", device: "desktop" },
    true // enabled
  );


  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm text-foreground">Analyzing CTR opportunity...</span>
        </div>
      </div>
    );
  }

  // Show error if API failed
  if (error) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="text-sm text-red-200">
          ⚠️ SERP Analysis Error: {error.message}
        </div>
        <div className="text-xs text-red-300/70 mt-1">
          Check console for details
        </div>
      </div>
    );
  }

  if (!serpData) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="text-sm text-amber-200">
          ⚠️ No SERP data available for this query
        </div>
      </div>
    );
  }

  if (serpData.error) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="text-sm text-red-200">
          ⚠️ SERP Analysis returned error: {serpData.error}
        </div>
      </div>
    );
  }

  // Extract SERP features from DataForSEO response
  const extractFeatures = () => {
    try {
      const items = (serpData.tasks?.[0]?.result?.[0]?.items || []) as SerpItem[];
      const hasFS = items.some((item: SerpItem) => item.type === "featured_snippet");
      const hasPAA = items.some((item: SerpItem) => item.type === "people_also_ask");
      const adsCount = items.filter((item: SerpItem) => item.type === "paid").length;
      const hasSitelinks = items.some((item: SerpItem) => item.links && item.links.length > 0);
      
      console.log("🎯 SERP Features Extracted:", {
        totalItems: items.length,
        hasFS,
        hasPAA,
        adsCount,
        hasSitelinks,
        itemTypes: items.map((item: SerpItem) => item.type)
      });
      
      return {
        fs: hasFS,
        paa: hasPAA,
        adsTop: adsCount,
        sitelinks: hasSitelinks,
      };
    } catch (err) {
      console.error("❌ Error extracting SERP features:", err);
      return {};
    }
  };

  const features = extractFeatures();
  const gap = calculateCtrGapOpportunity(impressions, ctr, position, features);
  
  console.log("📊 CTR Gap Calculation Result:", {
    inputCtr: ctr,
    expectedCtr: gap.ctrExpected,
    gap: gap.gap,
    potentialExtraClicks: gap.potentialExtraClicks,
    opportunity: gap.opportunity
  });

  // Determine if we should show the opportunity card
  const hasSignificantOpportunity = gap.opportunity !== "low" && gap.potentialExtraClicks >= 10;
  
  // Show card color based on opportunity level
  const cardBgColor = hasSignificantOpportunity 
    ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20"
    : "bg-gradient-to-r from-slate-500/10 to-slate-600/10 border-slate-500/20";

  return (
    <div className={`mt-4 p-4 rounded-lg border ${cardBgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            hasSignificantOpportunity 
              ? "bg-gradient-to-br from-indigo-500 to-purple-500" 
              : "bg-gradient-to-br from-slate-600 to-slate-700"
          }`}>
            {hasSignificantOpportunity ? (
              <Zap className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Target className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {hasSignificantOpportunity ? "CTR Opportunity Detected" : "CTR Analysis"}
            </div>
            <div className="text-xs text-slate-300/70 mt-0.5">
              Expected CTR: {(gap.ctrExpected * 100).toFixed(2)}% vs Actual: {(ctr * 100).toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="text-right">
          {hasSignificantOpportunity ? (
            <>
              <div className="text-2xl font-bold text-foreground">
                +{gap.potentialExtraClicks.toLocaleString()}
              </div>
              <div className="text-xs text-indigo-200/70">potential extra clicks</div>
            </>
          ) : (
            <>
              <div className="text-lg font-medium text-slate-300">
                {gap.potentialExtraClicks > 0 ? `+${gap.potentialExtraClicks}` : gap.potentialExtraClicks}
              </div>
              <div className="text-xs text-slate-400">
                {gap.gap > 0 ? "small opportunity" : "performing well"}
              </div>
            </>
          )}
        </div>
      </div>
      <div className={`mt-3 pt-3 border-t flex flex-wrap gap-2 ${
        hasSignificantOpportunity ? "border-indigo-500/20" : "border-slate-500/20"
      }`}>
        {features.fs && (
          <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-200 border-emerald-500/30">
            ✨ Featured Snippet
          </Badge>
        )}
        {features.paa && (
          <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-200 border-blue-500/30">
            ❓ People Also Ask
          </Badge>
        )}
        {features.adsTop && features.adsTop > 0 && (
          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-200 border-amber-500/30">
            💰 {features.adsTop} Ads
          </Badge>
        )}
        {features.sitelinks && (
          <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-200 border-purple-500/30">
            🔗 Sitelinks
          </Badge>
        )}
      </div>

      {/* Actionable Recommendations */}
      {hasSignificantOpportunity && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold text-emerald-200">🎯 What To Do</h4>
          </div>
          <div className="space-y-2">
            {/* Recommendations based on current status */}
            {(() => {
              const recommendations = [];

              // Title optimization
              recommendations.push({
                icon: "✏️",
                action: "Optimize Your Title Tag",
                details: `Add power words, numbers, or emotional triggers. Keep it under 60 characters. Current position: ${position.toFixed(1)}`
              });

              // Meta description
              recommendations.push({
                icon: "📝",
                action: "Improve Meta Description",
                details: "Include the keyword, add a clear call-to-action, and make it compelling. Aim for 150-160 characters."
              });

              // SERP feature specific recommendations
              if (!features.fs && position <= 5) {
                recommendations.push({
                  icon: "✨",
                  action: "Target Featured Snippet",
                  details: "Add a clear, concise answer paragraph at the top. Use bullet points or numbered lists."
                });
              }

              if (features.fs) {
                recommendations.push({
                  icon: "✨",
                  action: "Protect Featured Snippet",
                  details: "You have a featured snippet! Monitor it and keep your answer format optimized."
                });
              }

              if (!features.sitelinks && position <= 3) {
                recommendations.push({
                  icon: "🔗",
                  action: "Add Sitelinks",
                  details: "Improve site structure and internal linking to trigger sitelinks in Google."
                });
              }

              if (features.paa) {
                recommendations.push({
                  icon: "❓",
                  action: "Answer PAA Questions",
                  details: "Add FAQ schema and answer related 'People Also Ask' questions on your page."
                });
              }

              // Rich results
              recommendations.push({
                icon: "⭐",
                action: "Add Schema Markup",
                details: "Implement structured data (Article, Product, FAQ) to get star ratings and rich results."
              });

              // CTR boosters
              if (ctr * 100 < 3) {
                recommendations.push({
                  icon: "🎨",
                  action: "Make Title More Clickable",
                  details: "Use brackets [like this], add year (2025), or use question format."
                });
              }

              return recommendations.slice(0, 4).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-lg mt-0.5">{rec.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{rec.action}</div>
                    <div className="text-xs text-emerald-200/70 mt-0.5">{rec.details}</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QueriesPage() {
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

  const queries = useMemo(() => {
    if (!rows) return [];
    const grouped = groupByQuery(rows);
    
    if (!searchTerm) return grouped;
    
    return grouped.filter((q) =>
      q.query.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  const toggleRow = (query: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(query)) {
      newExpanded.delete(query);
    } else {
      newExpanded.add(query);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
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
          <h1 className="text-3xl font-bold text-foreground">Search Queries</h1>
          <p className="text-muted-foreground mt-1">
            See which pages rank for each query
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Queries</div>
          <div className="text-2xl font-bold mt-1">{queries.length.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Clicks</div>
          <div className="text-2xl font-bold mt-1">
            {queries.reduce((sum, q) => sum + q.totalClicks, 0).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg CTR</div>
          <div className="text-2xl font-bold mt-1">
            {(
              (queries.reduce((sum, q) => sum + q.avgCtr, 0) / queries.length) *
              100
            ).toFixed(2)}
            %
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Position</div>
          <div className="text-2xl font-bold mt-1">
            {(
              queries.reduce((sum, q) => sum + q.avgPosition, 0) / queries.length
            ).toFixed(1)}
          </div>
        </Card>
      </div>

      {/* Queries Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Top Page</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Position</TableHead>
              <TableHead className="text-right">Pages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.slice(0, 100).map((query) => {
              const isExpanded = expandedRows.has(query.query);
              const topPage = query.pages[0];

              return (
                <>
                  {/* Main Row */}
                  <TableRow
                    key={query.query}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(query.query)}
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
                      {query.query}
                      {query.pages.length > 1 && (
                        <span className="ml-2 text-xs text-amber-500">
                          {query.pages.length} pages
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {topPage?.page || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {query.totalClicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {query.totalImpressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(query.avgCtr * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {query.avgPosition.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {query.pages.length}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Pages */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/30 p-0">
                        <div className="p-4">
                          {/* CTR Gap Analysis */}
                          <CtrGapAnalysis
                            query={query.query}
                            impressions={query.totalImpressions}
                            ctr={query.avgCtr}
                            position={query.avgPosition}
                          />

                          {/* Pages List */}
                          <div className="text-sm font-medium mb-3 mt-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Pages ranking for "{query.query}"
                          </div>
                          <div className="space-y-2">
                            {query.pages.map((page, idx) => (
                              <div
                                key={page.page}
                                className="flex items-center justify-between p-3 rounded-lg bg-background border"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-sm truncate">
                                      {page.page}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="text-right">
                                    <div className="font-medium">
                                      {page.clicks.toLocaleString()}
                                    </div>
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
                                </div>
                              </div>
                            ))}
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

