import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Target, Search, Loader2, TrendingUp, ExternalLink, Zap } from "lucide-react";
import { useDomainCompetitors } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useCredits } from "@/hooks/useCreditManager";

export default function CompetitorAnalysisPage() {
  const [targetDomain, setTargetDomain] = useState("");
  const [searchDomain, setSearchDomain] = useState("");
  const { checkCredits, consumeCredits } = useCredits();

  const { data: competitorData, isLoading, error } = useDomainCompetitors(
    {
      target: searchDomain,
      location_code: 2840,
      language_code: "en",
      limit: 100
    },
    !!searchDomain
  );

  // Consume credits on success
  useEffect(() => {
    if (competitorData) {
      const competitorsCount = competitorData?.tasks?.[0]?.result?.[0]?.items?.length || 0;

      // Consume credits after successful analysis
      consumeCredits({
        feature: 'competitor_analysis',
        credits: 5,
        metadata: {
          domain: searchDomain,
          competitors_found: competitorsCount
        }
      });
    }
  }, [competitorData, searchDomain, consumeCredits]);


  const handleSearch = async () => {
    if (!targetDomain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    // Check credits before analysis
    const hasCredits = await checkCredits('competitor_analysis');
    if (!hasCredits) {
      return; // useCreditManager will show the error toast
    }

    const cleanDomain = targetDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    setSearchDomain(cleanDomain);
  };

  const competitors = competitorData?.tasks?.[0]?.result?.[0]?.items || [];
  const totalCount = competitorData?.tasks?.[0]?.result?.[0]?.total_count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Competitor Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Discover domains ranking for similar keywords
          </p>
        </div>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <div className="flex-1 flex gap-3">
            <Input
              placeholder="Enter your domain (e.g., example.com)"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Analyze
            </Button>
          </div>
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
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && competitors.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Competitors</div>
              <div className="text-2xl font-bold mt-1">{totalCount.toLocaleString()}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Shown</div>
              <div className="text-2xl font-bold mt-1">{competitors.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Avg Keywords</div>
              <div className="text-2xl font-bold mt-1">
                {Math.round(
                  competitors.reduce((sum: number, c: any) => sum + (c.intersections || 0), 0) / competitors.length
                ).toLocaleString()}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Your Domain</div>
              <div className="text-sm font-medium mt-1 truncate">{searchDomain}</div>
            </Card>
          </div>

          {/* Competitors Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Common Keywords</TableHead>
                  <TableHead className="text-right">Total Keywords</TableHead>
                  <TableHead className="text-right">Avg Position</TableHead>
                  <TableHead className="text-right">Overlap %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor: any, idx: number) => {
                  const overlapPercent = competitor.total_count 
                    ? ((competitor.intersections / competitor.total_count) * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://${competitor.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary flex items-center gap-1"
                          >
                            {competitor.domain}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary">
                          {(competitor.intersections || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {(competitor.total_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {competitor.avg_position ? competitor.avg_position.toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={
                          parseFloat(overlapPercent as string) > 20 ? "destructive" :
                          parseFloat(overlapPercent as string) > 10 ? "secondary" :
                          "default"
                        }>
                          {overlapPercent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && competitors.length === 0 && searchDomain && (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Competitors Found</h3>
          <p className="text-muted-foreground">
            Try searching for a different domain or check if the domain is indexed by Google.
          </p>
        </Card>
      )}

      {/* Initial State */}
      {!searchDomain && !isLoading && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Your Competitor Analysis</h3>
          <p className="text-muted-foreground">
            Enter a domain above to discover competitors ranking for similar keywords
          </p>
        </Card>
      )}
    </div>
  );
}

