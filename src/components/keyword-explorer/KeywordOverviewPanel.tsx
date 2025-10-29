import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  MousePointerClick, 
  Globe,
  BarChart3,
  Sparkles,
  ExternalLink,
  Zap,
  Brain,
  TrendingDown
} from "lucide-react";
import { KeywordOverview, calculateCPS } from "@/types/keyword-explorer";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from "react";
import React from "react";
import { 
  calculateKeywordValue, 
  analyzeSearchIntent,
  calculateTrafficPotential 
} from "@/lib/seo-calculations";

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
  // ALL HOOKS MUST BE AT THE TOP - before any early returns

  // Overview data processing
  React.useEffect(() => {
    // Overview data is ready for processing
  }, [overview]);

  // Prepare 12-month trend data (before early returns)
  const trendData = overview?.monthly_searches
    ?.slice(-12)
    ?.map((item) => {
      return {
        month: `${item.year}-${String(item.month).padStart(2, '0')}`,
        volume: item.search_volume
      };
    }) || [];


  // Early returns AFTER all hooks
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

  // ========== NEW: Calculate Advanced SEO Metrics ==========
  const keywordValue = React.useMemo(() => 
    calculateKeywordValue(overview.search_volume, overview.cpc, overview.keyword_difficulty),
    [overview.search_volume, overview.cpc, overview.keyword_difficulty]
  );

  const searchIntent = React.useMemo(() => 
    analyzeSearchIntent(overview.keyword, overview.cpc),
    [overview.keyword, overview.cpc]
  );

  const enhancedTraffic = React.useMemo(() => 
    calculateTrafficPotential(1, overview.search_volume, [], { device: 'desktop' }),
    [overview.search_volume]
  );

  // Difficulty color
  const getDifficultyColor = (kd: number) => {
    if (kd < 30) return "text-emerald-500";
    if (kd < 50) return "text-amber-500";
    if (kd < 70) return "text-orange-500";
    return "text-red-500";
  };

  // Priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Buying stage icon
  const getBuyingStageInfo = (stage: string) => {
    switch (stage) {
      case 'awareness': return { icon: '🔍', label: 'Awareness', color: 'text-blue-400' };
      case 'consideration': return { icon: '🤔', label: 'Consideration', color: 'text-purple-400' };
      case 'decision': return { icon: '💰', label: 'Decision', color: 'text-emerald-400' };
      default: return { icon: '❓', label: 'Unknown', color: 'text-gray-400' };
    }
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
          <CardHeader className="flex flex-row items-center justify-between">
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

      {/* ========== NEW: Advanced SEO Intelligence Cards ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Keyword Value & ROI Card */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Keyword Value & ROI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Monthly Value (at #1)</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${keywordValue.monthlyValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Opportunity Score</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">
                  {keywordValue.opportunityScore.toFixed(1)}
                </p>
                <Badge className={getPriorityColor(keywordValue.priority)}>
                  {keywordValue.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Est. Clicks at #1</p>
              <p className="font-medium">{keywordValue.estimatedClicks.toLocaleString()}/month</p>
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-emerald-400">
                💡 {keywordValue.priority === 'high' 
                  ? 'High-value target! Great ROI potential.' 
                  : keywordValue.priority === 'medium'
                  ? 'Moderate opportunity. Worth targeting.'
                  : 'Lower priority. Focus on higher-value keywords first.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Search Intent Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              Search Intent Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Primary Intent</p>
              <div className="flex items-center gap-2">
                <Badge className={getIntentColor(searchIntent.primary)}>
                  {searchIntent.primary}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {searchIntent.confidence}% confidence
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Buying Stage</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getBuyingStageInfo(searchIntent.buyingStage).icon}</span>
                <span className={`font-medium ${getBuyingStageInfo(searchIntent.buyingStage).color}`}>
                  {getBuyingStageInfo(searchIntent.buyingStage).label}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Commercial Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-500 rounded-full h-2 transition-all"
                    style={{ width: `${searchIntent.commercialScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{searchIntent.commercialScore}%</span>
              </div>
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-purple-400">
                💡 {searchIntent.recommendation}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Traffic Potential Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              Traffic Potential (Enhanced)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Industry CTR at #1</p>
              <p className="text-2xl font-bold text-blue-400">
                {(enhancedTraffic.ctr * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Desktop - AWR 2024 data)
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estimated Traffic</p>
              <p className="text-xl font-bold">
                {enhancedTraffic.estimatedClicks.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">clicks/month at position 1</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Pos #2</p>
                <p className="font-medium">
                  {Math.round(overview.search_volume * 0.158).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pos #3</p>
                <p className="font-medium">
                  {Math.round(overview.search_volume * 0.103).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pos #5</p>
                <p className="font-medium">
                  {Math.round(overview.search_volume * 0.058).toLocaleString()}
                </p>
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
