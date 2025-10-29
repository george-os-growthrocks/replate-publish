import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Target, TrendingUp } from "lucide-react";
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

export default function ContentGapAnalysis() {
  const [target, setTarget] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const addCompetitor = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, ""]);
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const analyzeGap = async () => {
    if (!target) {
      toast({
        title: "Target Required",
        description: "Please enter your website domain",
        variant: "destructive",
      });
      return;
    }

    const validCompetitors = competitors.filter(c => c.trim() !== "");
    if (validCompetitors.length === 0) {
      toast({
        title: "Competitors Required",
        description: "Please add at least one competitor",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "dataforseo-labs-content-gap",
        {
          body: {
            target: target.trim(),
            competitors: validCompetitors,
            location_code: 2840,
            language_code: "en",
            limit: 100,
          },
        }
      );

      if (error) throw error;

      setResults(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.total_gap_keywords || 0} keyword opportunities`,
      });
    } catch (error: any) {
      console.error("Content gap analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze content gap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="target">Your Website</Label>
          <Input
            id="target"
            placeholder="example.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Competitors</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addCompetitor}
              disabled={competitors.length >= 5}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Competitor
            </Button>
          </div>
          {competitors.map((competitor, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="competitor.com"
                value={competitor}
                onChange={(e) => updateCompetitor(index, e.target.value)}
              />
              {competitors.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetitor(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button onClick={analyzeGap} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Target className="mr-2 h-4 w-4" />
              Analyze Content Gap
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Gap Keywords</div>
              <div className="text-2xl font-bold">{results.total_gap_keywords}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Search Volume</div>
              <div className="text-2xl font-bold">
                {Math.round(results.summary?.avg_search_volume || 0)}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">High Opportunity</div>
              <div className="text-2xl font-bold">
                {results.summary?.high_opportunity_count || 0}
              </div>
            </div>
          </div>

          {/* Keywords Table */}
          {results.gap_keywords && results.gap_keywords.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Search Volume</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>CPC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.gap_keywords.slice(0, 20).map((keyword: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>
                        <Badge className={getOpportunityColor(keyword.opportunity_score)}>
                          {keyword.opportunity_score}/10
                        </Badge>
                      </TableCell>
                      <TableCell>{keyword.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>
                        {keyword.keyword_difficulty ? `${keyword.keyword_difficulty}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {keyword.cpc ? `$${keyword.cpc.toFixed(2)}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
