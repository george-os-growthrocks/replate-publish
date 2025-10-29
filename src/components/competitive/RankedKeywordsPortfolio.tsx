import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default function RankedKeywordsPortfolio() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const analyzeRankings = async () => {
    if (!target.trim()) {
      toast({
        title: "Domain Required",
        description: "Please enter a domain to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "dataforseo-labs-ranked-keywords",
        {
          body: {
            target: target.trim(),
            location_code: 2840,
            language_code: "en",
            limit: 1000,
          },
        }
      );

      if (error) throw error;

      setResults(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.summary?.total_keywords || 0} ranked keywords`,
      });
    } catch (error: any) {
      console.error("Ranked keywords analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze ranked keywords",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return "text-green-600";
    if (position <= 10) return "text-blue-600";
    if (position <= 20) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <div className="flex gap-2">
            <Input
              id="domain"
              placeholder="example.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeRankings()}
            />
            <Button onClick={analyzeRankings} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Keywords</div>
              <div className="text-2xl font-bold">
                {results.summary?.total_keywords?.toLocaleString() || 0}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Est. Monthly Traffic</div>
              <div className="text-2xl font-bold">
                {results.summary?.estimated_monthly_traffic?.toLocaleString() || 0}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Position</div>
              <div className="text-2xl font-bold">
                {results.summary?.avg_position?.toFixed(1) || 0}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Search Volume</div>
              <div className="text-2xl font-bold">
                {Math.round(results.summary?.avg_search_volume || 0)}
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          {results.distribution && (
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold">Ranking Distribution</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Top 3</span>
                    <span className="font-medium">{results.distribution.top_3}</span>
                  </div>
                  <Progress value={(results.distribution.top_3 / results.summary.total_keywords) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Top 10</span>
                    <span className="font-medium">{results.distribution.top_10}</span>
                  </div>
                  <Progress value={(results.distribution.top_10 / results.summary.total_keywords) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Top 20</span>
                    <span className="font-medium">{results.distribution.top_20}</span>
                  </div>
                  <Progress value={(results.distribution.top_20 / results.summary.total_keywords) * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Top 50</span>
                    <span className="font-medium">{results.distribution.top_50}</span>
                  </div>
                  <Progress value={(results.distribution.top_50 / results.summary.total_keywords) * 100} className="h-2" />
                </div>
              </div>
            </div>
          )}

          {/* Low Hanging Fruit */}
          {results.low_hanging_fruit && results.low_hanging_fruit.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-green-600" />
                Low-Hanging Fruit (Positions 11-20)
              </h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Search Volume</TableHead>
                      <TableHead>URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.low_hanging_fruit.slice(0, 10).map((keyword: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPositionColor(keyword.rank_absolute)}>
                            #{keyword.rank_absolute}
                          </Badge>
                        </TableCell>
                        <TableCell>{keyword.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {keyword.url || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Top Rankings */}
          {results.items && results.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Top Ranked Keywords</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Search Volume</TableHead>
                      <TableHead>Traffic Potential</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.items.slice(0, 20).map((keyword: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPositionColor(keyword.rank_absolute)}>
                            #{keyword.rank_absolute}
                          </Badge>
                        </TableCell>
                        <TableCell>{keyword.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>
                          {keyword.search_volume && keyword.rank_absolute
                            ? Math.round(keyword.search_volume * (keyword.rank_absolute <= 1 ? 0.3 : keyword.rank_absolute <= 3 ? 0.15 : 0.05))
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
