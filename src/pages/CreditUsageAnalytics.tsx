import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Download, TrendingUp, Zap, Calendar } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";

interface CreditUsage {
  id: string;
  feature: string;
  credits_used: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface FeatureStats {
  feature: string;
  totalCredits: number;
  usageCount: number;
}

export default function CreditUsageAnalytics() {
  const [usageData, setUsageData] = useState<CreditUsage[]>([]);
  const [featureStats, setFeatureStats] = useState<FeatureStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadUsageData();
  }, [dateRange]);

  const loadUsageData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('credit_usage_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply date filter
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      setUsageData(data || []);

      // Calculate feature stats
      const stats: Record<string, FeatureStats> = {};
      (data || []).forEach((usage) => {
        if (!stats[usage.feature]) {
          stats[usage.feature] = {
            feature: usage.feature,
            totalCredits: 0,
            usageCount: 0,
          };
        }
        stats[usage.feature].totalCredits += usage.credits_used;
        stats[usage.feature].usageCount += 1;
      });

      setFeatureStats(
        Object.values(stats).sort((a, b) => b.totalCredits - a.totalCredits)
      );
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Feature', 'Credits', 'Details'];
    const rows = usageData.map(usage => [
      new Date(usage.created_at).toLocaleString(),
      usage.feature,
      usage.credits_used.toString(),
      JSON.stringify(usage.metadata),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-usage-${Date.now()}.csv`;
    a.click();
  };

  const totalCreditsUsed = featureStats.reduce((sum, stat) => sum + stat.totalCredits, 0);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Usage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your credit consumption and feature usage
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range)}
          >
            {range === 'all' ? 'All Time' : `Last ${range}`}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credits Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {usageData.length} operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Used Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {featureStats[0]?.feature.replace(/_/g, ' ') || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {featureStats[0]?.usageCount || 0} times
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Credits/Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dateRange !== 'all' 
                ? Math.round(totalCreditsUsed / parseInt(dateRange))
                : Math.round(totalCreditsUsed / 30)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Features Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{featureStats.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Different features
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featureStats.map((stat) => {
              const percentage = (stat.totalCredits / totalCreditsUsed) * 100;
              return (
                <div key={stat.feature} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">
                      {stat.feature.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {stat.usageCount} uses
                      </Badge>
                      <span className="text-muted-foreground">
                        {stat.totalCredits} credits
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usageData.slice(0, 20).map((usage) => (
              <div
                key={usage.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">
                      {usage.feature.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(usage.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {usage.credits_used} credits
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
