import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, MousePointer, Eye, BarChart3, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MetricsOverviewProps {
  propertyUrl: string;
  startDate: string;
  endDate: string;
}

interface MetricData {
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

const MetricsOverview = ({ propertyUrl, startDate, endDate }: MetricsOverviewProps) => {
  const [metrics, setMetrics] = useState<{
    clicks: MetricData;
    impressions: MetricData;
    ctr: MetricData;
    position: MetricData;
  }>({
    clicks: { value: 0, change: 0, trend: "neutral" },
    impressions: { value: 0, change: 0, trend: "neutral" },
    ctr: { value: 0, change: 0, trend: "neutral" },
    position: { value: 0, change: 0, trend: "neutral" },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [propertyUrl, startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Verify user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to view data");
        return;
      }

      // Calculate previous period (same duration)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - duration);

      // Fetch current period
      // gsc-query will get provider_token from database using Authorization header
      const { data, error } = await supabase.functions.invoke("gsc-query", {
        body: {
          siteUrl: propertyUrl,
          startDate,
          endDate,
          dimensions: ["date"],
        },
      });

      if (error) {
        console.error("GSC query error:", error);
        console.error("Error data:", data);
        console.error("Full error response:", error);
        throw error;
      }

      // Check if the response contains an error even if request succeeded
      if (data?.error) {
        console.error("GSC API error:", data.error);
        console.error("Full error data:", data);
        throw new Error(data.error);
      }

      // Fetch previous period for comparison
      const { data: prevData, error: prevError } = await supabase.functions.invoke("gsc-query", {
        body: {
          siteUrl: propertyUrl,
          startDate: prevStart.toISOString().split("T")[0],
          endDate: prevEnd.toISOString().split("T")[0],
          dimensions: ["date"],
        },
      });

      if (prevError) {
        console.warn("Previous period query error:", prevError);
      }

      if (data?.rows && data.rows.length > 0) {
        const totalClicks = data.rows.reduce((sum: number, row: any) => sum + row.clicks, 0);
        const totalImpressions = data.rows.reduce((sum: number, row: any) => sum + row.impressions, 0);
        const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const avgPosition = data.rows.reduce((sum: number, row: any) => sum + row.position, 0) / data.rows.length;

        // Calculate previous period metrics
        const prevClicks = prevData?.rows?.reduce((sum: number, row: any) => sum + row.clicks, 0) || 0;
        const prevImpressions = prevData?.rows?.reduce((sum: number, row: any) => sum + row.impressions, 0) || 0;
        const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;
        const prevPosition = prevData?.rows?.reduce((sum: number, row: any) => sum + row.position, 0) / (prevData?.rows?.length || 1);

        // Calculate deltas
        const clicksChange = prevClicks > 0 ? ((totalClicks - prevClicks) / prevClicks) * 100 : 0;
        const impressionsChange = prevImpressions > 0 ? ((totalImpressions - prevImpressions) / prevImpressions) * 100 : 0;
        const ctrChange = prevCtr > 0 ? ((avgCtr - prevCtr) / prevCtr) * 100 : 0;
        const positionChange = prevPosition > 0 ? ((avgPosition - prevPosition) / prevPosition) * 100 : 0;

        setMetrics({
          clicks: { 
            value: totalClicks, 
            change: clicksChange, 
            trend: clicksChange > 0 ? "up" : clicksChange < 0 ? "down" : "neutral" 
          },
          impressions: { 
            value: totalImpressions, 
            change: impressionsChange, 
            trend: impressionsChange > 0 ? "up" : impressionsChange < 0 ? "down" : "neutral" 
          },
          ctr: { 
            value: avgCtr, 
            change: ctrChange, 
            trend: ctrChange > 0 ? "up" : ctrChange < 0 ? "down" : "neutral" 
          },
          position: { 
            value: avgPosition, 
            change: positionChange, 
            trend: positionChange < 0 ? "up" : positionChange > 0 ? "down" : "neutral" // Lower position is better
          },
        });
      } else {
        console.warn("No data rows returned from GSC query");
        toast.warning("No data available for the selected date range");
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch metrics";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const metricCards = [
    {
      title: "Total Clicks",
      icon: MousePointer,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      data: metrics.clicks,
      format: (val: number) => val.toLocaleString(),
    },
    {
      title: "Impressions",
      icon: Eye,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      data: metrics.impressions,
      format: (val: number) => val.toLocaleString(),
    },
    {
      title: "Avg CTR",
      icon: BarChart3,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      data: metrics.ctr,
      format: (val: number) => `${val.toFixed(2)}%`,
    },
    {
      title: "Avg Position",
      icon: Target,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      data: metrics.position,
      format: (val: number) => val.toFixed(1),
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.data.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <Card key={metric.title} className="p-6 border shadow-soft hover:shadow-medium transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.data.trend === "up" ? "text-success" : "text-destructive"
                }`}>
                  <TrendIcon className="h-4 w-4" />
                  <span>{Math.abs(metric.data.change)}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.format(metric.data.value)}</p>
              </div>
            </Card>
          );
        })}
    </div>
  );
};

export default MetricsOverview;
