import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, MousePointer, Eye, BarChart3, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetricsOverviewProps {
  propertyUrl: string;
}

interface MetricData {
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

const MetricsOverview = ({ propertyUrl }: MetricsOverviewProps) => {
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
  }, [propertyUrl]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { data, error } = await supabase.functions.invoke("gsc-query", {
        body: {
          siteUrl: propertyUrl,
          startDate,
          endDate,
          dimensions: ["date"],
        },
      });

      if (error) throw error;

      if (data?.rows) {
        const totalClicks = data.rows.reduce((sum: number, row: any) => sum + row.clicks, 0);
        const totalImpressions = data.rows.reduce((sum: number, row: any) => sum + row.impressions, 0);
        const avgCtr = (totalClicks / totalImpressions) * 100;
        const avgPosition = data.rows.reduce((sum: number, row: any) => sum + row.position, 0) / data.rows.length;

        setMetrics({
          clicks: { value: totalClicks, change: 5.2, trend: "up" },
          impressions: { value: totalImpressions, change: 3.8, trend: "up" },
          ctr: { value: avgCtr, change: 1.5, trend: "up" },
          position: { value: avgPosition, change: -0.8, trend: "up" },
        });
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
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
          <Card key={metric.title} className="p-6 shadow-card hover:shadow-elevated transition-shadow">
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
