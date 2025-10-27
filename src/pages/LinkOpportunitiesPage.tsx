import { useMemo, useState } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { groupByPage } from "@/lib/cannibalization";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as LinkIcon, Copy, ExternalLink, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface LinkOpportunity {
  fromPage: string;
  toPage: string;
  sharedQueries: string[];
  suggestedAnchors: string[];
  fromPageClicks: number;
  toPagePosition: number;
}

export default function LinkOpportunitiesPage() {
  const { propertyUrl, dateRange, country, device } = useFilters();
  const [copiedAnchor, setCopiedAnchor] = useState<string | null>(null);

  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
    device,
  });

  const linkOpportunities = useMemo((): LinkOpportunity[] => {
    if (!rows) return [];

    const pages = groupByPage(rows);
    
    // Identify authority pages (high clicks)
    const authorityPages = pages
      .filter((p) => p.totalClicks > 50)
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 20);

    // Identify target pages (poor position but some impressions)
    const targetPages = pages.filter(
      (p) => p.avgPosition > 10 && p.totalImpressions > 100
    );

    const opportunities: LinkOpportunity[] = [];

    // Find shared topics (queries) between authority and target pages
    authorityPages.forEach((authorityPage) => {
      targetPages.forEach((targetPage) => {
        if (authorityPage.page === targetPage.page) return;

        // Find shared queries
        const authorityQueries = new Set(
          authorityPage.queries.map((q) => q.query.toLowerCase())
        );
        const sharedQueries = targetPage.queries
          .filter((q) => authorityQueries.has(q.query.toLowerCase()))
          .map((q) => q.query)
          .slice(0, 5); // Top 5 shared queries

        if (sharedQueries.length > 0) {
          // Generate anchor text suggestions from shared queries
          const suggestedAnchors = sharedQueries
            .map((query) => {
              // Convert query to title case for anchor text
              return query
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            })
            .slice(0, 3);

          opportunities.push({
            fromPage: authorityPage.page,
            toPage: targetPage.page,
            sharedQueries,
            suggestedAnchors,
            fromPageClicks: authorityPage.totalClicks,
            toPagePosition: targetPage.avgPosition,
          });
        }
      });
    });

    // Sort by authority (from page clicks) and target need (position)
    return opportunities
      .sort((a, b) => {
        const scoreA = a.fromPageClicks * (a.toPagePosition / 10);
        const scoreB = b.fromPageClicks * (b.toPagePosition / 10);
        return scoreB - scoreA;
      })
      .slice(0, 50); // Top 50 opportunities
  }, [rows]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnchor(text);
    toast.success("Anchor text copied to clipboard!");
    setTimeout(() => setCopiedAnchor(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Link Opportunities</h1>
        <p className="text-muted-foreground mt-1">
          Internal linking suggestions based on shared topics and authority
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Opportunities Found</div>
          <div className="text-2xl font-bold mt-1">{linkOpportunities.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Authority Pages</div>
          <div className="text-2xl font-bold mt-1">
            {new Set(linkOpportunities.map((o) => o.fromPage)).size}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Target Pages</div>
          <div className="text-2xl font-bold mt-1">
            {new Set(linkOpportunities.map((o) => o.toPage)).size}
          </div>
        </Card>
      </div>

      {/* Opportunities */}
      {linkOpportunities.length === 0 ? (
        <Card className="p-12 text-center">
          <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
          <p className="text-muted-foreground">
            No clear internal linking opportunities detected in current data
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {linkOpportunities.map((opp, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="bg-green-500">
                      Authority: {opp.fromPageClicks} clicks
                    </Badge>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      Target Pos: {opp.toPagePosition.toFixed(1)}
                    </Badge>
                    <Badge variant="secondary">
                      {opp.sharedQueries.length} shared topics
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {/* From Page (Authority) */}
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          FROM (Authority Page)
                        </div>
                        <div className="text-sm font-medium truncate">
                          {opp.fromPage}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={opp.fromPage} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 pl-7">
                      <div className="h-px flex-1 bg-border" />
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* To Page (Target) */}
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <LinkIcon className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          TO (Target Page - Needs Boost)
                        </div>
                        <div className="text-sm font-medium truncate">
                          {opp.toPage}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={opp.toPage} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shared Queries */}
              <div className="mb-4 pl-8">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Shared Topics:
                </div>
                <div className="flex flex-wrap gap-2">
                  {opp.sharedQueries.map((query, qIdx) => (
                    <Badge key={qIdx} variant="outline" className="text-xs">
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Suggested Anchors */}
              <div className="pl-8 bg-blue-500/5 rounded-lg p-4 border border-blue-500/10">
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Suggested Anchor Texts:
                </div>
                <div className="flex flex-wrap gap-2">
                  {opp.suggestedAnchors.map((anchor, aIdx) => (
                    <Button
                      key={aIdx}
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(anchor)}
                      className={
                        copiedAnchor === anchor
                          ? "bg-green-500/10 border-green-500"
                          : ""
                      }
                    >
                      {anchor}
                      {copiedAnchor === anchor ? (
                        <span className="ml-2 text-green-500">✓</span>
                      ) : (
                        <Copy className="ml-2 h-3 w-3" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

