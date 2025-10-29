import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Activity,
  Zap,
  BarChart3,
  Plus,
  Trash2,
  Eye,
  MousePointerClick,
  Calendar,
  Loader2,
  Award,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useGscData } from '@/hooks/useGscData';
import { useFilters } from '@/contexts/FilterContext';
import { ExportButton } from '@/components/ExportButton';
import { formatDateForFilename } from '@/lib/export-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FeatureDebugPanel, DebugLog } from '@/components/debug/FeatureDebugPanel';

interface TrackedKeyword {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  clicks: number;
  impressions: number;
  ctr: number;
  firstTracked: Date;
  history: { date: string; position: number; clicks: number; impressions: number }[];
}

export default function RankingTrackerPage() {
  const { dateRange, selectedProperty } = useFilters();
  const { data: gscData, isLoading } = useGscData(selectedProperty || '', dateRange);
  
  const [trackedKeywords, setTrackedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingTracked, setIsLoadingTracked] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, any[]>>({});

  // Debug logging functions
  const addDebugLog = (level: DebugLog['level'], message: string) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    console.log(`[${level.toUpperCase()}] ${message}`);
    setDebugLogs(prev => [...prev, log]);
  };

  // Debug: Log selectedProperty on mount and changes
  useEffect(() => {
    console.log('🔍 RankingTracker - selectedProperty:', selectedProperty);
    console.log('🔍 RankingTracker - type:', typeof selectedProperty);
    console.log('🔍 RankingTracker - is empty?', !selectedProperty);
  }, [selectedProperty]);

  // Load tracked keywords from database
  useEffect(() => {
    loadTrackedKeywords();
  }, [selectedProperty]);

  const loadTrackedKeywords = async () => {
    if (!selectedProperty) {
      addDebugLog('warn', 'No property selected, skipping load');
      return;
    }
    
    setIsLoadingTracked(true);
    try {
      // Check auth session first
      const { data: { session } } = await supabase.auth.getSession();
      addDebugLog('info', `Auth session: ${session ? 'EXISTS' : 'MISSING'}`);
      
      if (!session) {
        addDebugLog('error', 'No active session - user might need to re-login');
        toast.error('Please sign in again to track keywords');
        return;
      }
      
      // Log session details for debugging
      if (session?.access_token) {
        addDebugLog('info', `Access token: ${session.access_token.substring(0, 30)}...`);
        addDebugLog('info', `Token expires at: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      }
      
      addDebugLog('info', `📞 Calling track-keyword with action: list, property: ${selectedProperty}`);
      
      // Manually pass the Authorization header (workaround for auth issues)
      const { data, error } = await supabase.functions.invoke('track-keyword', {
        body: {
          action: 'list',
          property: selectedProperty
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      addDebugLog('info', `📥 Response received - data keys: ${data ? Object.keys(data).join(', ') : 'null'}`);

      if (error) {
        addDebugLog('error', `Edge function network error: ${JSON.stringify(error)}`);
        throw error;
      }
      
      if (data?.error) {
        addDebugLog('error', `API error: ${data.error}`);
        if (data.details) {
          addDebugLog('error', `Error details: ${data.details}`);
        }
        throw new Error(data.error);
      }

      if (data?.data) {
        const keywords = data.data.map((item: {keyword: string}) => item.keyword);
        addDebugLog('success', `✅ Loaded ${keywords.length} tracked keywords`);
        setTrackedKeywords(keywords);
        
        // Load historical data for all tracked keywords
        await loadHistoricalData(keywords);
      } else {
        addDebugLog('info', 'ℹ️ No tracked keywords found');
        setTrackedKeywords([]);
        setHistoricalData({});
      }
    } catch (error) {
      addDebugLog('error', `❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Failed to load tracked keywords. Check debug log.');
    } finally {
      setIsLoadingTracked(false);
    }
  };

  // Add keyword to tracking
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error('Please enter a keyword');
      return;
    }
    
    if (!selectedProperty) {
      addDebugLog('error', `No property selected. selectedProperty: ${selectedProperty}`);
      toast.error('Please select a property from the dropdown above');
      return;
    }

    addDebugLog('info', `Adding keyword: "${newKeyword}" to property: ${selectedProperty}`);
    
    if (trackedKeywords.includes(newKeyword.toLowerCase())) {
      addDebugLog('warn', 'Keyword already tracked');
      toast.error('Keyword already tracked');
      return;
    }

    setIsAdding(true);
    try {
      // Check auth session first
      const { data: { session } } = await supabase.auth.getSession();
      addDebugLog('info', `Auth session: ${session ? 'EXISTS' : 'MISSING'}`);
      
      if (!session) {
        addDebugLog('error', 'No active session for add operation');
        toast.error('Please sign in again to add keywords');
        return;
      }

      const { data, error } = await supabase.functions.invoke('track-keyword', {
        body: {
          action: 'add',
          keyword: newKeyword.toLowerCase(),
          property: selectedProperty
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      addDebugLog('info', `📥 Add response: ${JSON.stringify(data).substring(0, 200)}`);

      if (error) {
        addDebugLog('error', `Network error: ${JSON.stringify(error)}`);
        throw error;
      }
      
      if (data?.error) {
        addDebugLog('error', `API error: ${data.error}`);
        if (data.details) {
          addDebugLog('error', `Details: ${data.details}`);
        }
        throw new Error(data.error);
      }
      
      if (!data?.success) {
        addDebugLog('error', `Unexpected response format: ${JSON.stringify(data)}`);
        throw new Error('Unexpected response from server');
      }

      addDebugLog('success', `✅ Keyword "${newKeyword}" added successfully`);
      await loadTrackedKeywords(); // Reload list
      const keywordToClear = newKeyword;
      setNewKeyword('');
      toast.success(`Now tracking "${keywordToClear}"`);
    } catch (error) {
      addDebugLog('error', `Failed to add keyword: ${error instanceof Error ? error.message : String(error)}`);
      toast.error(error instanceof Error ? error.message : 'Failed to add keyword');
    } finally {
      setIsAdding(false);
    }
  };

  // Remove keyword from tracking
  const handleRemoveKeyword = async (keyword: string) => {
    if (!selectedProperty) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in again');
        return;
      }

      const { data, error } = await supabase.functions.invoke('track-keyword', {
        body: {
          action: 'remove',
          keyword,
          property: selectedProperty
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await loadTrackedKeywords(); // Reload list
      toast.success(`Stopped tracking "${keyword}"`);
    } catch (error) {
      console.error('Error removing keyword:', error);
      toast.error('Failed to remove keyword');
    }
  };

  // Load historical ranking data from database
  const loadHistoricalData = async (keywords: string[]) => {
    if (!selectedProperty || keywords.length === 0) {
      setHistoricalData({});
      return;
    }

    try {
      addDebugLog('info', `📊 Loading historical data for ${keywords.length} keywords...`);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addDebugLog('warn', 'No session for historical data load');
        return;
      }

      // Fetch historical data for all keywords in parallel
      const historyPromises = keywords.map(async (keyword) => {
        try {
          const { data, error } = await supabase.functions.invoke('track-keyword', {
            body: {
              action: 'get_history',
              keyword: keyword.toLowerCase(),
              property: selectedProperty
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (error) {
            addDebugLog('warn', `Failed to load history for "${keyword}": ${error.message}`);
            return { keyword, history: [] };
          }

          if (data?.data) {
            addDebugLog('info', `✅ Loaded ${data.data.length} historical records for "${keyword}"`);
            return { keyword, history: data.data };
          }

          return { keyword, history: [] };
        } catch (error) {
          addDebugLog('warn', `Error loading history for "${keyword}": ${error instanceof Error ? error.message : String(error)}`);
          return { keyword, history: [] };
        }
      });

      const results = await Promise.all(historyPromises);
      const historyMap: Record<string, any[]> = {};
      
      results.forEach(({ keyword, history }) => {
        historyMap[keyword.toLowerCase()] = history;
      });

      setHistoricalData(historyMap);
      addDebugLog('success', `✅ Historical data loaded for all keywords`);
    } catch (error) {
      addDebugLog('error', `Failed to load historical data: ${error instanceof Error ? error.message : String(error)}`);
      setHistoricalData({});
    }
  };

  // Sync all tracked keywords with GSC data
  const handleSyncKeywords = async () => {
    if (!selectedProperty) return;
    if (trackedKeywords.length === 0) {
      toast.error('No keywords to sync');
      return;
    }

    setIsSyncing(true);
    addDebugLog('info', `🔄 Syncing ${trackedKeywords.length} keywords with GSC...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in again');
        return;
      }

      // Call edge function to sync all tracked keywords
      const { data, error } = await supabase.functions.invoke('track-keyword', {
        body: {
          action: 'sync_all',
          property: selectedProperty
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        addDebugLog('error', `Sync error: ${JSON.stringify(error)}`);
        throw error;
      }

      if (data?.error) {
        addDebugLog('error', `Sync API error: ${data.error}`);
        throw new Error(data.error);
      }

      addDebugLog('success', `✅ Synced ${data.synced || 0} keywords successfully`);
      toast.success(`Synced ${data.synced || 0} keywords with GSC data`);
      
      // Reload to show updated data
      await loadTrackedKeywords();
    } catch (error) {
      addDebugLog('error', `Sync failed: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Failed to sync keywords');
    } finally {
      setIsSyncing(false);
    }
  };

  // Process GSC data into tracked keyword metrics
  const keywordMetrics = useMemo((): TrackedKeyword[] => {
    console.log('🔍 keywordMetrics recalculating...');
    console.log('📊 trackedKeywords:', trackedKeywords);
    console.log('📊 gscData?.queries:', gscData?.queries?.length, 'queries');
    
    // Show all tracked keywords, even if there's no GSC data yet
    const metrics = trackedKeywords.map(trackedKw => {
      const queryData = gscData?.queries?.find(
        q => q.query.toLowerCase() === trackedKw.toLowerCase()
      );

      if (!queryData) {
        // No GSC data yet - still show the keyword as tracked
        return {
          keyword: trackedKw,
          currentPosition: 999, // Use 999 to indicate "not yet ranked" (will display as "Not Ranked")
          previousPosition: 999,
          trend: 'stable' as const,
          change: 0,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          firstTracked: new Date(),
          history: []
        };
      }

      const currentPosition = queryData.avgPosition || 0;
      
      // Get real historical data from database
      const keywordHistory = historicalData[trackedKw.toLowerCase()] || [];
      
      // Process history for chart (last 90 days)
      const history = keywordHistory
        .slice(-90) // Last 90 records
        .map((record: any) => ({
          date: new Date(record.checked_at || record.created_at).toISOString().split('T')[0],
          position: Number(record.position) || 0,
          clicks: Number(record.clicks) || 0,
          impressions: Number(record.impressions) || 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate previous position from history (last non-current entry)
      const previousRecord = keywordHistory.length > 1 
        ? keywordHistory[keywordHistory.length - 2] 
        : null;
      const previousPosition = previousRecord 
        ? Number(previousRecord.position) || currentPosition 
        : currentPosition;
      
      // Calculate trend
      const change = previousPosition - currentPosition;
      const trend = change > 1 ? 'up' : change < -1 ? 'down' : 'stable';

      // Get first tracked date from history
      const firstTracked = keywordHistory.length > 0
        ? new Date(keywordHistory[0].checked_at || keywordHistory[0].created_at)
        : new Date();

      return {
        keyword: trackedKw,
        currentPosition,
        previousPosition,
        trend,
        change,
        clicks: queryData.totalClicks || 0,
        impressions: queryData.totalImpressions || 0,
        ctr: queryData.avgCtr || 0,
        firstTracked,
        history: history.length > 0 ? history : [{
          date: new Date().toISOString().split('T')[0],
          position: currentPosition,
          clicks: queryData.totalClicks || 0,
          impressions: queryData.totalImpressions || 0
        }]
      };
    }); // Show all tracked keywords, even those without GSC data yet
    
    console.log('✅ keywordMetrics computed:', metrics.length, 'keywords');
    console.log('📋 metrics:', metrics);
    
    return metrics;
  }, [gscData, trackedKeywords, historicalData]);

  // Stats calculations
  const stats = useMemo(() => {
    const improving = keywordMetrics.filter(k => k.trend === 'up').length;
    const declining = keywordMetrics.filter(k => k.trend === 'down').length;
    const stable = keywordMetrics.filter(k => k.trend === 'stable').length;
    
    // Calculate average position excluding "Not Ranked" keywords (position >= 100)
    const rankedKeywords = keywordMetrics.filter(k => k.currentPosition < 100);
    const avgPosition = rankedKeywords.length > 0
      ? rankedKeywords.reduce((sum, k) => sum + k.currentPosition, 0) / rankedKeywords.length
      : 0;
    
    const totalClicks = keywordMetrics.reduce((sum, k) => sum + k.clicks, 0);
    const topRankings = keywordMetrics.filter(k => k.currentPosition <= 3).length;

    return { improving, declining, stable, avgPosition, totalClicks, topRankings };
  }, [keywordMetrics]);

  // Selected keyword details
  const selectedKeywordData = selectedKeyword
    ? keywordMetrics.find(k => k.keyword === selectedKeyword)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Ranking Tracker
          </h1>
          <p className="text-muted-foreground">
            Monitor keyword positions over time with historical tracking and trend analysis
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={keywordMetrics}
            filename={`ranking-tracker-${formatDateForFilename()}`}
          />
        </div>
      </div>

      {/* Add Keyword Input */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/90 dark:to-slate-950/90 border-slate-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Track New Keyword
          </CardTitle>
          <CardDescription>
            Add keywords to monitor their ranking positions over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter keyword to track..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              className="flex-1"
            />
            <Button onClick={handleAddKeyword} disabled={isAdding || !newKeyword.trim()}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Track
            </Button>
            <Button 
              onClick={handleSyncKeywords} 
              disabled={isSyncing || trackedKeywords.length === 0}
              variant="secondary"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Sync with GSC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-100/50 dark:bg-slate-950/80 border-slate-200 dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Tracked
            </div>
            <div className="text-2xl font-bold">{keywordMetrics.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-500/10 dark:to-emerald-600/5 border-emerald-500/30 dark:border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-200/70 mb-1">
              <TrendingUp className="h-4 w-4" />
              Improving
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{stats.improving}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 dark:from-red-500/10 dark:to-red-600/5 border-red-500/30 dark:border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-200/70 mb-1">
              <TrendingDown className="h-4 w-4" />
              Declining
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-300">{stats.declining}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 dark:from-amber-500/10 dark:to-amber-600/5 border-amber-500/30 dark:border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-200/70 mb-1">
              <Minus className="h-4 w-4" />
              Stable
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-300">{stats.stable}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-purple-500/10 dark:from-primary/10 dark:to-purple-500/5 border-primary/30 dark:border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-primary dark:text-primary/70 mb-1">
              <Award className="h-4 w-4" />
              Top 3
            </div>
            <div className="text-2xl font-bold text-primary">{stats.topRankings}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-100/50 dark:bg-slate-950/80 border-slate-200 dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              Avg Pos
            </div>
            <div className="text-2xl font-bold">{stats.avgPosition.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="details">
            <Eye className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {keywordMetrics.length === 0 ? (
            <Card className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Keywords Tracked</h3>
              <p className="text-muted-foreground">
                Add keywords above to start tracking their ranking positions
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {keywordMetrics.map((kw) => (
                <Card
                  key={kw.keyword}
                  className={`bg-slate-50 dark:bg-slate-950/80 border-l-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors ${
                    kw.trend === 'up'
                      ? 'border-l-emerald-500'
                      : kw.trend === 'down'
                      ? 'border-l-red-500'
                      : 'border-l-amber-500'
                  }`}
                  onClick={() => setSelectedKeyword(kw.keyword)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{kw.keyword}</h3>
                          <Badge
                            variant={
                              kw.trend === 'up' ? 'default' : kw.trend === 'down' ? 'destructive' : 'secondary'
                            }
                          >
                            {kw.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {kw.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {kw.trend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                            {kw.trend === 'up' ? 'Improving' : kw.trend === 'down' ? 'Declining' : 'Stable'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Current Position</div>
                            <div className="text-2xl font-bold">
                              {kw.currentPosition >= 100 ? 'Not Ranked' : kw.currentPosition.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Change</div>
                            <div
                              className={`text-2xl font-bold ${
                                kw.change > 0 ? 'text-emerald-400' : kw.change < 0 ? 'text-red-400' : ''
                              }`}
                            >
                              {kw.change > 0 ? '+' : ''}
                              {kw.change.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Clicks</div>
                            <div className="text-2xl font-bold">{kw.clicks.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">CTR</div>
                            <div className="text-2xl font-bold">{(kw.ctr * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveKeyword(kw.keyword);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>

                    {/* Mini Chart */}
                    <div className="mt-4 h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={kw.history}>
                          <defs>
                            <linearGradient id={`gradient-${kw.keyword}`} x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor={kw.trend === 'up' ? '#10b981' : kw.trend === 'down' ? '#ef4444' : '#f59e0b'}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={kw.trend === 'up' ? '#10b981' : kw.trend === 'down' ? '#ef4444' : '#f59e0b'}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="position"
                            stroke={kw.trend === 'up' ? '#10b981' : kw.trend === 'down' ? '#ef4444' : '#f59e0b'}
                            fill={`url(#gradient-${kw.keyword})`}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedKeywordData ? (
            <>
              <Card className="bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{selectedKeywordData.keyword}</CardTitle>
                      <CardDescription>
                        Tracking since {selectedKeywordData.firstTracked.toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedKeyword(null)}>
                      Back to Overview
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Historical Chart */}
                    <div>
                      <h4 className="text-sm font-semibold mb-4">Position History (30 Days)</h4>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedKeywordData.history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#64748b" />
                            <YAxis stroke="#64748b" reversed domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="position"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              dot={{ fill: '#3b82f6', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select a Keyword</h3>
              <p className="text-muted-foreground">
                Click on a keyword from the overview to see detailed analytics
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Debug Panel */}
      <FeatureDebugPanel
        logs={debugLogs}
        featureName="Rank Tracker"
        onClear={() => setDebugLogs([])}
      />
    </div>
  );
}

