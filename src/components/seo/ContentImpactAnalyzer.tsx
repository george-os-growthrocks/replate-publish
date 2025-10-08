import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Calendar, RefreshCw, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContentImpact {
  content_title: string;
  publish_date: string;
  keywords_impacted: number;
  avg_position_change: number;
  traffic_increase: number;
  ranking_improvements: number;
}

export const ContentImpactAnalyzer = ({ projectId }: { projectId: string }) => {
  const [loading, setLoading] = useState(true);
  const [contentData, setContentData] = useState<ContentImpact[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadContentImpact();
  }, [projectId]);

  const loadContentImpact = async () => {
    setLoading(true);
    try {
      // Get published content from calendar
      const { data: contentItems } = await supabase
        .from('content_calendar' as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);

      // For each content piece, analyze SERP impact
      const impactData: ContentImpact[] = [];

      for (const item of ((contentItems as any) || [])) {
        const publishDate = new Date((item as any).published_at);
        const twoWeeksLater = new Date(publishDate);
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

        // Get SERP rankings changes after publish
        const { data: serpBefore } = await supabase
          .from('serp_rankings' as any)
          .select('position, keyword')
          .eq('project_id', projectId)
          .lt('checked_at', publishDate.toISOString())
          .order('checked_at', { ascending: false });

        const { data: serpAfter } = await supabase
          .from('serp_rankings' as any)
          .select('position, keyword')
          .eq('project_id', projectId)
          .gte('checked_at', publishDate.toISOString())
          .lte('checked_at', twoWeeksLater.toISOString());

        // Calculate impact
        const keywordsImpacted = new Set([
          ...(serpBefore || []).map((s: any) => s.keyword),
          ...(serpAfter || []).map((s: any) => s.keyword)
        ]).size;

        const avgPositionChange = (serpAfter as any)?.reduce((sum: number, after: any) => {
          const before = (serpBefore as any)?.find((b: any) => b.keyword === after.keyword);
          return sum + ((before?.position || 100) - after.position);
        }, 0) / ((serpAfter as any)?.length || 1) || 0;

        const rankingImprovements = (serpAfter as any)?.filter((after: any) => {
          const before = (serpBefore as any)?.find((b: any) => b.keyword === after.keyword);
          return before && after.position < before.position;
        }).length || 0;

        // Get traffic data
        const { data: gscData } = await supabase
          .from('gsc_analytics' as any)
          .select('clicks')
          .eq('project_id', projectId)
          .gte('date', publishDate.toISOString())
          .lte('date', twoWeeksLater.toISOString());

        const trafficIncrease = gscData?.reduce((sum: number, d: any) => sum + d.clicks, 0) || 0;

        impactData.push({
          content_title: (item as any).title,
          publish_date: (item as any).published_at,
          keywords_impacted: keywordsImpacted,
          avg_position_change: Math.round(avgPositionChange * 10) / 10,
          traffic_increase: trafficIncrease,
          ranking_improvements: rankingImprovements
        });
      }

      setContentData(impactData);
    } catch (error: any) {
      console.error('Error loading content impact:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
              <FileText className="w-5 h-5 text-blue-500" />
              Content Impact Analyzer
            </CardTitle>
            <CardDescription>
              Track how published content affects your rankings
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadContentImpact}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {contentData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No published content to analyze yet</p>
            <p className="text-sm mt-2">
              Publish content via the Content Calendar to see impact analysis
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contentData.map((item, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.content_title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.publish_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {item.avg_position_change !== 0 && (
                        <Badge 
                          variant={item.avg_position_change > 0 ? "default" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {item.avg_position_change > 0 ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {Math.abs(item.avg_position_change)} positions
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {item.keywords_impacted}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Keywords Impacted
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {item.ranking_improvements}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Improved Rankings
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          +{item.traffic_increase}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Extra Clicks
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
