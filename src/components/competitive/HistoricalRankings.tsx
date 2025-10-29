import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Plus, X, TrendingUp, TrendingDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HistoricalRankings() {
  const [target, setTarget] = useState("");
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2024-12-31");
  const [groupBy, setGroupBy] = useState("month");
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

  const trackHistorical = async () => {
    if (!target.trim()) {
      toast({
        title: "Domain Required",
        description: "Please enter a domain to track",
        variant: "destructive",
      });
      return;
    }

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
        "dataforseo-historical-rankings",
        {
          body: {
            target: target.trim(),
            keywords: validKeywords,
            location_code: 2840,
            language_code: "en",
            date_from: dateFrom,
            date_to: dateTo,
            group_by: groupBy,
          },
        }
      );

      if (error) throw error;

      setResults(data);
      toast({
        title: "Analysis Complete",
        description: `Tracked ${validKeywords.length} keywords over the period`,
      });
    } catch (error: any) {
      console.error("Historical rankings error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to track historical rankings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <span className="h-4 w-4">→</span>;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "improving") return "bg-green-500";
    if (trend === "declining") return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            placeholder="example.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From Date</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">To Date</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupBy">Group By</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger id="groupBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Keywords</Label>
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
                placeholder="e.g., seo tools"
                value={keyword}
                onChange={(e) => updateKeyword(index, e.target.value)}
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

        <Button onClick={trackHistorical} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Historical Data...
            </>
          ) : (
            <>
              <History className="mr-2 h-4 w-4" />
              Track Rankings
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
              <div className="text-sm text-muted-foreground">Keywords Tracked</div>
              <div className="text-2xl font-bold">
                {results.summary?.total_keywords || 0}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Improving</div>
              <div className="text-2xl font-bold text-green-600">
                {results.summary?.improving || 0}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Declining</div>
              <div className="text-2xl font-bold text-red-600">
                {results.summary?.declining || 0}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Overall Trend</div>
              <div className="text-2xl font-bold capitalize">
                {results.summary?.overall_trend || 'N/A'}
              </div>
            </div>
          </div>

          {/* Keywords Table */}
          {results.keywords && results.keywords.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Keyword Trends</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Current Position</TableHead>
                      <TableHead>Position Change</TableHead>
                      <TableHead>Best Position</TableHead>
                      <TableHead>Worst Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.keywords.map((keyword: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(keyword.trend)}
                            <Badge className={getTrendColor(keyword.trend)}>
                              {keyword.trend}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">#{keyword.current_position}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={keyword.position_change > 0 ? "text-green-600" : keyword.position_change < 0 ? "text-red-600" : ""}>
                            {keyword.position_change > 0 ? '+' : ''}{keyword.position_change}
                          </span>
                        </TableCell>
                        <TableCell>#{keyword.best_position}</TableCell>
                        <TableCell>#{keyword.worst_position}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Algorithm Impacts */}
          {results.keywords?.some((k: any) => k.algorithm_impacts?.length > 0) && (
            <div className="space-y-4">
              <h3 className="font-semibold">Detected Algorithm Impacts</h3>
              {results.keywords.map((keyword: any, keywordIndex: number) => (
                keyword.algorithm_impacts && keyword.algorithm_impacts.length > 0 && (
                  <div key={keywordIndex} className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium">{keyword.keyword}</div>
                    <div className="space-y-2">
                      {keyword.algorithm_impacts.map((impact: any, impactIndex: number) => (
                        <div key={impactIndex} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{impact.date}</span>
                          <Badge variant="outline">{impact.name}</Badge>
                          <span className={impact.impact.includes('+') ? "text-green-600" : "text-red-600"}>
                            {impact.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
