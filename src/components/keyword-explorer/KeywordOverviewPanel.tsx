import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  MousePointerClick, 
  Globe,
  BarChart3,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { KeywordOverview, calculateCPS } from "@/types/keyword-explorer";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface KeywordOverviewPanelProps {
  overview: KeywordOverview | null;
  trafficPotential?: number;
  parentTopic?: { keyword: string; search_volume: number };
  topResult?: { url: string; domain: string; title: string };
  loading?: boolean;
}

export function KeywordOverviewPanel({
  overview,
  trafficPotential,
  parentTopic,
  topResult,
  loading
}: KeywordOverviewPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Enter a keyword to see overview metrics
        </CardContent>
      </Card>
    );
  }

  // Calculate CPS
  const cps = calculateCPS(
    overview.impressions_info?.daily_clicks_average,
    overview.search_volume
  );

  // Calculate clicks per month
  const monthlyClicks = (overview.impressions_info?.daily_clicks_average || 0) * 30;

  // Difficulty color
  const getDifficultyColor = (kd: number) => {
    if (kd < 30) return "text-emerald-500";
    if (kd < 50) return "text-amber-500";
    if (kd < 70) return "text-orange-500";
    return "text-red-500";
  };

  // Intent badge color
  const getIntentColor = (intent?: string) => {
    switch (intent?.toLowerCase()) {
      case "commercial":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "transactional":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "informational":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "navigational":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  // Prepare 12-month trend data
  const trendData = overview.monthly_searches
    ?.slice(-12)
    ?.map((item) => ({
      month: `${item.year}-${String(item.month).padStart(2, '0')}`,
      volume: item.search_volume
    })) || [];

  return (
    <div className="space-y-4">
      {/* Main metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Keyword Difficulty */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              KD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getDifficultyColor(overview.keyword_difficulty)}`}>
              {overview.keyword_difficulty}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Difficulty</p>
          </CardContent>
        </Card>

        {/* Search Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.search_volume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly searches</p>
          </CardContent>
        </Card>

        {/* CPC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              CPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              ${overview.cpc.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cost per click</p>
          </CardContent>
        </Card>

        {/* Clicks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(monthlyClicks).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Per month</p>
          </CardContent>
        </Card>

        {/* CPS (Clicks Per Search) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cps.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Clicks/search</p>
          </CardContent>
        </Card>

        {/* Traffic Potential */}
        {trafficPotential !== undefined && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                TP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {Math.round(trafficPotential).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Traffic potential</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Secondary info row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 12-month trend */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">12-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const [, month] = value.split('-');
                      return month;
                    }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intent & Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Intent & Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Intent */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Search Intent</p>
              <Badge className={getIntentColor(overview.search_intent_info?.main_intent)}>
                {overview.search_intent_info?.main_intent || "Unknown"}
              </Badge>
            </div>

            {/* SERP Results */}
            {overview.serp_info?.se_results_count && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">SERP Results</p>
                <p className="font-medium">
                  {overview.serp_info.se_results_count.toLocaleString()}
                </p>
              </div>
            )}

            {/* Competition */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Competition</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${overview.competition * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {(overview.competition * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parent Topic & Top Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parent Topic */}
        {parentTopic && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Parent Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">{parentTopic.keyword}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {parentTopic.search_volume.toLocaleString()} searches/mo
              </p>
            </CardContent>
          </Card>
        )}

        {/* Top Ranking Result */}
        {topResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Top Ranking Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium truncate" title={topResult.title}>
                  {topResult.title}
                </p>
                <a 
                  href={topResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                >
                  {topResult.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
