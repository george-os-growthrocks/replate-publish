import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, X, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AIOverviewTracker() {
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const addKeyword = () => {
    if (keywords.length < 10) {
      setKeywords([...keywords, ""]);
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const trackAIOverview = async () => {
    const validKeywords = keywords.filter(k => k.trim() !== "");
    if (validKeywords.length === 0) {
      toast({
        title: "Keywords Required",
        description: "Please add at least one keyword to track",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "dataforseo-ai-overview-tracker",
        {
          body: {
            keywords: validKeywords,
            location_code: 2840,
            language_code: "en",
            track_changes: true,
          },
        }
      );

      if (error) throw error;

      setResults(data);
      toast({
        title: "Analysis Complete",
        description: `Analyzed ${validKeywords.length} keywords for AI Overview presence`,
      });
    } catch (error: any) {
      console.error("AI Overview tracking error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to track AI Overview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Keywords to Track</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addKeyword}
              disabled={keywords.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Keyword
            </Button>
          </div>
          {keywords.map((keyword, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="e.g., seo tools, keyword research"
                value={keyword}
                onChange={(e) => updateKeyword(index, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && trackAIOverview()}
              />
              {keywords.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyword(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button onClick={trackAIOverview} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing AI Overview Impact...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Track AI Overview
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Keywords</div>
              <div className="text-2xl font-bold">{results.summary?.total_keywords || 0}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">AI Overview %</div>
              <div className="text-2xl font-bold">
                {results.summary?.ai_overview_percentage || 0}%
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Position Shift</div>
              <div className="text-2xl font-bold">
                {results.summary?.avg_position_shift > 0 ? '+' : ''}
                {results.summary?.avg_position_shift?.toFixed(1) || 0}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Traffic at Risk</div>
              <div className="text-2xl font-bold">
                {results.summary?.estimated_traffic_loss || 0}%
              </div>
            </div>
          </div>

          {/* Alert if high AI presence */}
          {results.summary?.ai_overview_percentage > 30 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>High AI Overview Presence Detected</AlertTitle>
              <AlertDescription>
                {results.summary.ai_overview_percentage}% of your tracked keywords show AI Overviews,
                which may impact organic click-through rates.
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="p-4 border rounded-lg space-y-2">
              <h3 className="font-semibold">Recommendations</h3>
              <ul className="space-y-1 text-sm">
                {results.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords Table */}
          {results.keywords && results.keywords.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Keyword Analysis</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>AI Overview</TableHead>
                      <TableHead>Position Impact</TableHead>
                      <TableHead>Est. Traffic Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.keywords.map((keyword: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell>
                          {keyword.has_ai_overview ? (
                            <Badge className="bg-purple-500">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {keyword.position_shift ? (
                            <span className={keyword.position_shift > 0 ? "text-red-600" : "text-green-600"}>
                              {keyword.position_shift > 0 ? '+' : ''}{keyword.position_shift}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {keyword.estimated_traffic_loss ? `${keyword.estimated_traffic_loss}%` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Cited Sources */}
          {results.cited_sources && results.cited_sources.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cited Sources in AI Overviews
              </h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Citations</TableHead>
                      <TableHead>Keywords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.cited_sources.map((source: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{source.domain}</TableCell>
                        <TableCell>{source.citation_count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {source.keywords.join(", ")}
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
