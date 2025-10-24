import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Target, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuickKeywordResearchProps {
  projectId: string;
  onKeywordsFound?: (count: number) => void;
}

export function QuickKeywordResearch({ projectId, onKeywordsFound }: QuickKeywordResearchProps) {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const researchKeywords = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Enter a keyword",
        description: "Please enter a seed keyword to research",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      console.log("Researching keyword:", keyword);

      // Call DataForSEO via the edge function
      const { data, error } = await supabase.functions.invoke('dataforseo-advanced', {
        body: {
          operation: 'keyword_research',
          keywords: [keyword],
          location: 'United States',
          language: 'English',
        },
      });

      if (error) throw error;

      console.log("DataForSEO response:", data);

      if (data?.keywordData && data.keywordData.length > 0) {
        const keywordsToStore = data.keywordData.map((kw: any) => ({
          project_id: projectId,
          keyword: kw.keyword,
          search_volume: kw.search_volume || 0,
          difficulty_score: kw.competition_index * 100 || 50,
          potential_score: kw.opportunity_score || 0.5,
          opportunity_type: kw.search_intent || 'informational',
          ai_recommendations: {
            notes: `Researched on ${new Date().toLocaleDateString()}`,
            metrics: {
              cpc: kw.cpc || 0,
              competition: kw.competition || 'medium',
              trend: kw.trend_score > 0.5 ? 'rising' : 'stable',
            }
          },
        }));

        // Store in database
        const { data: inserted, error: insertError } = await supabase
          .from('keyword_analysis')
          .upsert(keywordsToStore, {
            onConflict: 'project_id,keyword',
            ignoreDuplicates: false,
          })
          .select();

        if (insertError) {
          console.error('Error storing keywords:', insertError);
          throw insertError;
        }

        setResults(data.keywordData);
        onKeywordsFound?.(data.keywordData.length);

        toast({
          title: "Keywords Found!",
          description: `Found ${data.keywordData.length} related keywords`,
        });
      } else {
        toast({
          title: "No results",
          description: "No keyword data found. Try a different keyword.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Keyword research error:", error);
      toast({
        title: "Research Failed",
        description: error.message || "Failed to research keywords",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Quick Keyword Research
          </h3>
          <p className="text-sm text-muted-foreground">
            Find related keywords with search volume and competition data
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter seed keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && researchKeywords()}
          />
          <Button onClick={researchKeywords} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Researching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Research
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="font-medium text-sm">Found {results.length} Keywords</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((kw, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex-1">
                    <div className="font-medium">{kw.keyword}</div>
                    <div className="text-xs text-muted-foreground">
                      {kw.search_intent || 'informational'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{kw.search_volume?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-muted-foreground">volume</div>
                    </div>
                    <Badge variant={kw.competition_index > 0.7 ? 'destructive' : kw.competition_index > 0.4 ? 'secondary' : 'default'}>
                      {kw.competition_index > 0.7 ? 'High' : kw.competition_index > 0.4 ? 'Med' : 'Low'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
