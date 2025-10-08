import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, ArrowUpRight, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RevenueData {
  keyword: string;
  clicks: number;
  position: number;
  conversions: number;
  revenue: number;
  revenue_per_click: number;
  position_change: number;
}

export const RevenueAttribution = ({ projectId }: { projectId: string }) => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgCPC, setAvgCPC] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadRevenueData();
  }, [projectId]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      // Combine GSC analytics with GA4 data
      const { data: gscData } = await supabase
        .from('gsc_analytics' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('clicks', { ascending: false })
        .limit(20);

      const { data: ga4Data } = await supabase
        .from('ga4_analytics' as any)
        .select('*')
        .eq('project_id', projectId)
        .limit(20);

      const { data: serpData } = await supabase
        .from('serp_rankings' as any)
        .select('*')
        .eq('project_id', projectId);

      // Combine the data
      const combined: RevenueData[] = ((gscData as any) || []).map((gsc: any) => {
        const ga4Match = ((ga4Data as any) || []).find((ga: any) => 
          ga.page_path && gsc.page && ga.page_path.includes(gsc.page)
        );
        const serpMatch = ((serpData as any) || []).find((s: any) => s.keyword === gsc.query);

        return {
          keyword: gsc.query || 'Unknown',
          clicks: gsc.clicks || 0,
          position: gsc.position || 0,
          conversions: ga4Match?.conversions || 0,
          revenue: ga4Match?.revenue || 0,
          revenue_per_click: ga4Match?.revenue ? (ga4Match.revenue / (gsc.clicks || 1)) : 0,
          position_change: serpMatch?.position_change || 0
        };
      }).filter(item => item.revenue > 0);

      setRevenueData(combined);
      setTotalRevenue(combined.reduce((sum, item) => sum + item.revenue, 0));
      setAvgCPC(combined.reduce((sum, item) => sum + item.revenue_per_click, 0) / (combined.length || 1));
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
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
              <DollarSign className="w-5 h-5 text-green-500" />
              Revenue Attribution
            </CardTitle>
            <CardDescription>
              Track revenue generated from organic search traffic
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadRevenueData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Revenue/Click</p>
                  <p className="text-2xl font-bold">
                    ${avgCPC.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Keywords</p>
                  <p className="text-2xl font-bold">
                    {revenueData.length}
                  </p>
                </div>
                <ArrowUpRight className="w-8 h-8 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Table */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Top Revenue-Generating Keywords</h3>
          {revenueData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No revenue data available</p>
              <p className="text-sm mt-2">
                Connect Google Analytics to see revenue attribution
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {revenueData.map((item, idx) => (
                <Card key={idx}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.keyword}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>Position: #{item.position}</span>
                          <span>•</span>
                          <span>{item.clicks} clicks</span>
                          <span>•</span>
                          <span>{item.conversions} conversions</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600">
                          ${item.revenue.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.revenue_per_click.toFixed(2)}/click
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
