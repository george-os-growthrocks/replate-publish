import { useState, useMemo, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Search, Sparkles, BarChart3, LineChart as LineChartIcon, Eye, MousePointer, ArrowUpRight, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGeminiInsights } from "@/hooks/useGeminiInsights";
import { supabase } from "@/integrations/supabase/client";
import { useFilters } from "@/contexts/FilterContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

interface KeywordDetailsModalProps {
  keyword: any;
  onClose: () => void;
}

interface GscTimeSeriesData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function KeywordDetailsModal({ keyword, onClose }: KeywordDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
  const [gscData, setGscData] = useState<GscTimeSeriesData[]>([]);
  const [isLoadingGsc, setIsLoadingGsc] = useState(true);
  const { selectedProperty } = useFilters();

  // Fetch real GSC data for this keyword
  useEffect(() => {
    async function fetchKeywordTimeSeries() {
      if (!keyword.query || !selectedProperty) return;

      setIsLoadingGsc(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get OAuth token
        const { data: tokenData } = await supabase
          .from('user_oauth_tokens')
          .select('access_token')
          .eq('user_id', session.user.id)
          .single();

        if (!tokenData?.access_token) return;

        // Calculate date range (last 90 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);

        const { data, error } = await supabase.functions.invoke('gsc-query', {
          body: {
            siteUrl: selectedProperty,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dimensions: ['date', 'query'],
            filters: [
              {
                dimension: 'query',
                operator: 'equals',
                expression: keyword.query
              }
            ],
            rowLimit: 1000
          }
        });

        if (error) throw error;

        // Process the data
        const timeSeriesMap = new Map<string, GscTimeSeriesData>();
        
        data.rows?.forEach((row: any) => {
          const date = row.keys[0];
          if (!timeSeriesMap.has(date)) {
            timeSeriesMap.set(date, {
              date,
              clicks: 0,
              impressions: 0,
              ctr: 0,
              position: 0
            });
          }
          const existing = timeSeriesMap.get(date)!;
          existing.clicks += row.clicks;
          existing.impressions += row.impressions;
          existing.ctr = existing.impressions > 0 ? existing.clicks / existing.impressions : 0;
          existing.position = row.position;
        });

        const sortedData = Array.from(timeSeriesMap.values())
          .sort((a, b) => a.date.localeCompare(b.date));

        setGscData(sortedData);
      } catch (error) {
        console.error('Error fetching keyword time series:', error);
      } finally {
        setIsLoadingGsc(false);
      }
    }

    fetchKeywordTimeSeries();
  }, [keyword.query, selectedProperty]);

  // Get Gemini AI insights
  const { data: geminiInsights, isLoading: insightsLoading, error: insightsError } = useGeminiInsights({
    keyword: keyword.query,
    currentPosition: keyword.avgPosition,
    clicks: keyword.totalClicks,
    impressions: keyword.totalImpressions,
    ctr: keyword.avgCtr,
    positionChange: keyword.positionChange,
    enabled: activeTab === 'insights',
  });

  // Calculate metrics from real GSC data
  const totalClicks = gscData.reduce((sum, d) => sum + d.clicks, 0);
  const totalImpressions = gscData.reduce((sum, d) => sum + d.impressions, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition = gscData.length > 0 
    ? gscData.reduce((sum, d) => sum + d.position, 0) / gscData.length 
    : keyword.avgPosition;

  // Calculate trends
  const recentData = gscData.slice(-7); // Last 7 days
  const olderData = gscData.slice(-14, -7); // Previous 7 days
  const recentClicks = recentData.reduce((sum, d) => sum + d.clicks, 0);
  const olderClicks = olderData.reduce((sum, d) => sum + d.clicks, 0);
  const clicksTrend = olderClicks > 0 ? ((recentClicks - olderClicks) / olderClicks) * 100 : 0;
  
  const recentPosition = recentData.length > 0 
    ? recentData.reduce((sum, d) => sum + d.position, 0) / recentData.length 
    : 0;
  const olderPosition = olderData.length > 0 
    ? olderData.reduce((sum, d) => sum + d.position, 0) / olderData.length 
    : 0;
  const positionTrend = olderPosition - recentPosition; // Negative = worse position

  // Pages data
  const pagesData = keyword.pages.slice(0, 10).map((page: any) => ({
    page: page.page,
    position: page.position,
    clicks: page.clicks,
    impressions: page.impressions,
    ctr: page.ctr,
  }));

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal - Redesigned for beauty and functionality */}
      <div className="relative ml-auto w-full max-w-7xl h-full bg-gradient-to-br from-background via-background to-background/95 shadow-2xl transform translate-x-0 flex flex-col border-l-2 border-primary/20">
        {/* Stunning Header with Gradient */}
        <div className="relative border-b border-border bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm">
          <div className="p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                {/* Keyword Title with Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-primary/30 shadow-lg">
                    <Search className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground leading-tight">{keyword.query}</h2>
                    <p className="text-muted-foreground text-sm mt-1">Keyword Performance Analysis</p>
                  </div>
                </div>

                {/* Key Metrics Row - Beautiful Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointer className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700 uppercase">Total Clicks</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">{totalClicks.toLocaleString()}</div>
                    {clicksTrend !== 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {clicksTrend > 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${clicksTrend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {Math.abs(clicksTrend).toFixed(1)}% vs last week
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700 uppercase">Impressions</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{totalImpressions.toLocaleString()}</div>
                    <span className="text-xs text-blue-600/70">Last 90 days</span>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700 uppercase">Avg CTR</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{(avgCtr * 100).toFixed(2)}%</div>
                    <span className="text-xs text-purple-600/70">Click-through rate</span>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <LineChartIcon className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700 uppercase">Position</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">{avgPosition.toFixed(1)}</div>
                    {positionTrend !== 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {positionTrend > 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${positionTrend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {Math.abs(positionTrend).toFixed(1)} vs last week
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive rounded-full h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabs - Modern Design */}
            <div className="flex gap-2 mt-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`relative px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <span className="relative z-10">Performance Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`relative px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'insights'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Insights</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20">
          <div className="p-8 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Loading State */}
                {isLoadingGsc && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading keyword performance data...</p>
                    </div>
                  </div>
                )}

                {/* Charts Grid - 2 columns */}
                {!isLoadingGsc && gscData.length > 0 && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Clicks & Impressions Chart */}
                    <Card className="p-6 border-2 border-emerald-500/20 shadow-xl bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20 dark:to-background">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/30">
                          <MousePointer className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Clicks & Impressions</h3>
                          <p className="text-xs text-muted-foreground">Daily performance trends</p>
                        </div>
                      </div>

                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={gscData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="clicksAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="impressionsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #10B981',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
                                padding: '12px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            />
                            <Area
                              type="monotone"
                              dataKey="impressions"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              fill="url(#impressionsAreaGradient)"
                              name="Impressions"
                            />
                            <Area
                              type="monotone"
                              dataKey="clicks"
                              stroke="#10B981"
                              strokeWidth={3}
                              fill="url(#clicksAreaGradient)"
                              name="Clicks"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Position Chart */}
                    <Card className="p-6 border-2 border-orange-500/20 shadow-xl bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20 dark:to-background">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center border border-orange-500/30">
                          <LineChartIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Ranking Position</h3>
                          <p className="text-xs text-muted-foreground">Daily position tracking</p>
                        </div>
                      </div>

                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={gscData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="positionLineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              reversed
                              domain={[1, 'dataMax + 5']}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #F97316',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
                                padding: '12px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                              formatter={(value: any) => [value.toFixed(1), 'Position']}
                            />
                            <Line
                              type="monotone"
                              dataKey="position"
                              stroke="#F97316"
                              strokeWidth={3}
                              dot={{ fill: '#F97316', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
                              activeDot={{ r: 6, stroke: '#F97316', strokeWidth: 3, fill: '#ffffff' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* CTR Chart */}
                    <Card className="p-6 border-2 border-purple-500/20 shadow-xl bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/20 dark:to-background">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center border border-purple-500/30">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Click-Through Rate</h3>
                          <p className="text-xs text-muted-foreground">CTR performance over time</p>
                        </div>
                      </div>

                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gscData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="ctrBarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.9}/>
                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.6}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #A855F7',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
                                padding: '12px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                              formatter={(value: any) => [`${(value * 100).toFixed(2)}%`, 'CTR']}
                            />
                            <Bar
                              dataKey="ctr"
                              fill="url(#ctrBarGradient)"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Ranking Pages Table */}
                    <Card className="xl:col-span-2 p-6 border-2 border-primary/10 shadow-xl bg-gradient-to-br from-background to-primary/5">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/10 flex items-center justify-center border border-primary/30">
                          <Search className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground">Ranking Pages</h3>
                          <p className="text-xs text-muted-foreground">All pages ranking for "{keyword.query}"</p>
                        </div>
                        <Badge variant="secondary" className="text-sm px-4 py-2">
                          {pagesData.length} pages
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {pagesData.map((page: any, index: number) => (
                          <div
                            key={page.page}
                            className="group relative flex items-center justify-between p-5 rounded-xl border-2 border-border bg-card hover:border-primary/30 hover:bg-accent/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                          >
                            {/* Rank Badge */}
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                              <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg border-2 shadow-sm ${
                                index === 0
                                  ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border-yellow-500/30 text-yellow-700'
                                  : index === 1
                                  ? 'bg-gradient-to-br from-gray-400/20 to-gray-600/20 border-gray-500/30 text-gray-700'
                                  : index === 2
                                  ? 'bg-gradient-to-br from-orange-400/20 to-orange-600/20 border-orange-500/30 text-orange-700'
                                  : 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-primary'
                              }`}>
                                #{index + 1}
                              </div>
                              
                              {/* URL */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {page.page}
                                  </span>
                                  <a
                                    href={page.page}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center gap-8">
                              <div className="text-center">
                                <div className="text-lg font-bold text-emerald-600">{page.clicks.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground font-medium">Clicks</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{page.impressions.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground font-medium">Impr.</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{(page.ctr * 100).toFixed(2)}%</div>
                                <div className="text-xs text-muted-foreground font-medium">CTR</div>
                              </div>
                              <div className="text-center min-w-[60px]">
                                <div className={`text-xl font-bold px-3 py-1 rounded-lg ${
                                  page.position <= 3
                                    ? 'bg-green-500/10 text-green-700'
                                    : page.position <= 10
                                    ? 'bg-yellow-500/10 text-yellow-700'
                                    : page.position <= 20
                                    ? 'bg-orange-500/10 text-orange-700'
                                    : 'bg-red-500/10 text-red-700'
                                }`}>
                                  {page.position.toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium mt-1">Pos.</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {pagesData.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No pages found for this keyword</p>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* No Data State */}
                {!isLoadingGsc && gscData.length === 0 && (
                  <div className="text-center py-20">
                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Performance Data</h3>
                    <p className="text-muted-foreground">No data available for this keyword in the selected period.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'insights' && (
              <>
                {/* AI Insights Header */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 p-8 shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
                  <div className="relative flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border-2 border-purple-500/30 shadow-lg">
                      <Sparkles className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-1">AI-Powered SEO Insights</h3>
                      <p className="text-muted-foreground">Expert recommendations powered by Gemini 2.5</p>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {insightsLoading && (
                  <Card className="p-12 border-2 shadow-xl">
                    <div className="text-center">
                      <div className="relative inline-block mb-6">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Analyzing Keyword Performance</h4>
                      <p className="text-muted-foreground">Our AI is analyzing ranking data, CTR patterns, and competition...</p>
                    </div>
                  </Card>
                )}

                {/* AI Insights Content */}
                {!insightsLoading && geminiInsights && Array.isArray(geminiInsights) && geminiInsights.length > 0 && (
                  <div className="space-y-4">
                    {geminiInsights.map((insight: any, index: number) => {
                      const categoryIcons: Record<string, any> = {
                        on_page_seo: Search,
                        content: ArrowUpRight,
                        technical_seo: BarChart3,
                        link_building: TrendingUp,
                        user_experience: Eye,
                      };
                      const Icon = categoryIcons[insight.category] || Sparkles;

                      return (
                        <Card
                          key={index}
                          className={`p-6 border-2 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                            insight.priority === 'high'
                              ? 'bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/20 dark:to-background border-red-500/30'
                              : insight.priority === 'medium'
                              ? 'bg-gradient-to-br from-yellow-50/50 to-background dark:from-yellow-950/20 dark:to-background border-yellow-500/30'
                              : 'bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20 dark:to-background border-green-500/30'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Priority Indicator */}
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center border-2 shadow-sm flex-shrink-0 ${
                              insight.priority === 'high'
                                ? 'bg-red-500/10 border-red-500/30'
                                : insight.priority === 'medium'
                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                : 'bg-green-500/10 border-green-500/30'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                insight.priority === 'high' ? 'text-red-600' :
                                insight.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                              }`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h4 className="text-lg font-bold text-foreground leading-tight">{insight.title}</h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge className={`text-xs font-semibold ${
                                    insight.priority === 'high'
                                      ? 'bg-red-500/15 text-red-700 border-red-500/30'
                                      : insight.priority === 'medium'
                                      ? 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30'
                                      : 'bg-green-500/15 text-green-700 border-green-500/30'
                                  }`}>
                                    {insight.priority.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {insight.impact} impact
                                  </Badge>
                                </div>
                              </div>

                              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{insight.description}</p>

                              {/* Category Tag */}
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {insight.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Fallback/No Insights State */}
                {!insightsLoading && (!geminiInsights || !Array.isArray(geminiInsights) || geminiInsights.length === 0) && (
                  <Card className="p-12 border-2 border-dashed shadow-xl bg-gradient-to-br from-muted/30 to-background">
                    <div className="text-center">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/20">
                        <Sparkles className="h-10 w-10 text-purple-600/50" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">No Insights Available</h4>
                      <p className="text-muted-foreground">Unable to generate AI insights at this time. Please try again later.</p>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
