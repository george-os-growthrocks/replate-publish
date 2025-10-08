import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Search, RefreshCw, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OpportunityKeyword {
  keyword: string;
  current_position: number;
  search_volume: number;
  difficulty: number;
  opportunity_score: number;
  potential_traffic: number;
  quick_win: boolean;
}

export const KeywordOpportunityScorer = ({ projectId }: { projectId: string }) => {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<OpportunityKeyword[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    calculateOpportunities();
  }, [projectId]);

  const calculateOpportunities = async () => {
    setLoading(true);
    try {
      // Get current rankings
      const { data: rankings } = await supabase
        .from('serp_rankings' as any)
        .select('*')
        .eq('project_id', projectId);

      // Get keyword data
      const { data: keywords } = await supabase
        .from('keyword_tracking' as any)
        .select('*')
        .eq('project_id', projectId);

      // Get GSC data for current performance
      const { data: gscData } = await supabase
        .from('gsc_analytics' as any)
        .select('*')
        .eq('project_id', projectId);

      // Calculate opportunity scores
      const scored: OpportunityKeyword[] = ((keywords as any) || []).map((kw: any) => {
        const ranking = (rankings as any)?.find((r: any) => r.keyword === kw.keyword);
        const gsc = (gscData as any)?.find((g: any) => g.query === kw.keyword);

        const currentPosition = ranking?.position || 100;
        const searchVolume = kw.search_volume || 0;
        const difficulty = kw.difficulty || 50;
        const currentImpressions = gsc?.impressions || 0;

        // Opportunity Score Formula:
        // (Search Volume * 0.3) + ((100 - Difficulty) * 0.2) + (Current Impressions * 0.2) + (Position Gap * 0.3)
        const positionGap = currentPosition > 10 ? (100 - currentPosition) : 0;
        const opportunityScore = 
          (searchVolume * 0.0003) + 
          ((100 - difficulty) * 0.2) + 
          (currentImpressions * 0.0002) + 
          (positionGap * 0.3);

        // Potential traffic if moved to top 3
        const potentialTraffic = Math.round(searchVolume * 0.30); // Assuming 30% CTR for top 3

        // Quick win: Position 11-20 (page 2) with low difficulty
        const quickWin = currentPosition >= 11 && currentPosition <= 20 && difficulty < 40;

        return {
          keyword: kw.keyword,
          current_position: currentPosition,
          search_volume: searchVolume,
          difficulty: difficulty,
          opportunity_score: Math.round(opportunityScore),
          potential_traffic: potentialTraffic,
          quick_win: quickWin
        };
      })
      .filter(item => item.opportunity_score > 10)
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 15);

      setOpportunities(scored);
    } catch (error: any) {
      console.error('Error calculating opportunities:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return { variant: "default" as const, label: "High Priority", color: "text-green-600" };
    if (score >= 40) return { variant: "secondary" as const, label: "Medium Priority", color: "text-yellow-600" };
    return { variant: "outline" as const, label: "Low Priority", color: "text-gray-600" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Keyword Opportunity Scorer
            </CardTitle>
            <CardDescription>
              AI-powered keyword opportunities ranked by potential impact
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={calculateOpportunities}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No keyword opportunities found</p>
            <p className="text-sm mt-2">
              Add keywords to tracking to see opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp, idx) => {
              const scoreBadge = getScoreBadge(opp.opportunity_score);
              return (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{opp.keyword}</h3>
                            {opp.quick_win && (
                              <Badge variant="default" className="bg-green-500 text-white gap-1">
                                <Zap className="w-3 h-3" />
                                Quick Win
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Position: #{opp.current_position}</span>
                            <span>•</span>
                            <span>{opp.search_volume.toLocaleString()} searches/mo</span>
                            <span>•</span>
                            <span>Difficulty: {opp.difficulty}</span>
                          </div>
                        </div>
                        <Badge variant={scoreBadge.variant} className={scoreBadge.color}>
                          {scoreBadge.label}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Opportunity Score</span>
                          <span className="font-semibold">{opp.opportunity_score}/100</span>
                        </div>
                        <Progress value={opp.opportunity_score} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-muted-foreground">Potential:</span>
                          <span className="font-semibold text-green-600">
                            +{opp.potential_traffic.toLocaleString()} clicks/mo
                          </span>
                        </div>
                        <Button size="sm" variant="outline">
                          Optimize
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
