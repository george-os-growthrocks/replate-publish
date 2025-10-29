import { useState } from "react";
import React from "react";
import { FeatureDebugPanel, DebugLog } from "@/components/debug/FeatureDebugPanel";
import { Bug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Zap } from "lucide-react";
import { KeywordOverviewPanel } from "@/components/keyword-explorer/KeywordOverviewPanel";
import { KeywordIdeasTabs } from "@/components/keyword-explorer/KeywordIdeasTabs";
import { SerpOverviewTable } from "@/components/keyword-explorer/SerpOverviewTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeywordExplorerState, KeywordIdea } from "@/types/keyword-explorer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Brain, ExternalLink } from "lucide-react";
import { AIOverview } from "@/components/serp/AIOverview";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function KeywordExplorerPageFull() {
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [state, setState] = useState<KeywordExplorerState>({
    seedKeyword: "",
    locationCode: 2840,
    languageCode: "en",
    overview: null,
    overviewLoading: false,
    matchingTerms: [],
    relatedTerms: [],
    questions: [],
    searchSuggestions: [],
    ideasLoading: false,
    serpItems: [],
    serpLoading: false,
    alsoRankFor: [],
    alsoRankForLoading: false,
    positionHistory: [],
    historyLoading: false,
    trafficShare: [],
    trafficLoading: false,
  });

  const [topResultUrl, setTopResultUrl] = useState<string>("");
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordIdea | null>(null);
  const [showKeywordDialog, setShowKeywordDialog] = useState(false);
  const [aiOverviewData, setAiOverviewData] = useState<{content: string; sources: Array<{title: string; url: string; favicon?: string}>} | null>(null);
  const [isLoadingAiOverview, setIsLoadingAiOverview] = useState(false);
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([]);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  const addDebugLog = (level: DebugLog['level'], message: string) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    console.log(`[${level.toUpperCase()}] ${message}`);
    setDebugLogs(prev => [...prev, log]);
  };

  const fetchOverview = async () => {
    setState(prev => ({ ...prev, overviewLoading: true }));
    addDebugLog('info', `🔍 Fetching overview for: "${state.seedKeyword}"`);
    
    try {
      // Get session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addDebugLog('error', '❌ No auth session - please login');
        toast.error('Please sign in again');
        setState(prev => ({ ...prev, overviewLoading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke("keyword-overview-bundle", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        addDebugLog('error', `❌ Supabase function error: ${error.message}`);
        throw error;
      }

      if (data?.error) {
        addDebugLog('error', `❌ API error: ${data.error}`);
        throw new Error(data.error);
      }

      addDebugLog('info', `📦 Full API response received: ${JSON.stringify(Object.keys(data || {}))}`);

      const overview = data?.overview;
      if (overview) {
        addDebugLog('info', `📊 Overview object keys: ${JSON.stringify(Object.keys(overview))}`);
        addDebugLog('info', `📊 monthly_searches type: ${typeof overview.monthly_searches}`);
        addDebugLog('info', `📊 monthly_searches is array: ${Array.isArray(overview.monthly_searches)}`);
        addDebugLog('info', `📊 monthly_searches length: ${overview.monthly_searches?.length || 0}`);
        
        // Show debug info if available
        if (overview._debug) {
          addDebugLog('info', `🔍 Debug Info: History API Status ${overview._debug.history_api_status} - ${overview._debug.history_api_message}`);
          addDebugLog('info', `🔍 History Item Keys: ${JSON.stringify(overview._debug.history_item_keys)}`);
          addDebugLog('info', `🔍 Monthly Searches Found: ${overview._debug.monthly_searches_found}`);
        }
        
        if (overview.monthly_searches && overview.monthly_searches.length > 0) {
          addDebugLog('success', `✅ Found ${overview.monthly_searches.length} months of trend data`);
          addDebugLog('info', `Sample: ${JSON.stringify(overview.monthly_searches[0])}`);
        } else {
          addDebugLog('warn', `⚠️ No monthly_searches data! Value: ${JSON.stringify(overview.monthly_searches)}`);
          if (overview._debug?.history_api_status !== 20000) {
            addDebugLog('error', `❌ History API returned error status: ${overview._debug?.history_api_status} - ${overview._debug?.history_api_message}`);
          } else {
            addDebugLog('warn', `ℹ️ API returned success but no monthly_searches data. This keyword may not have historical data available.`);
          }
        }

      setState(prev => ({
        ...prev,
          overview: {
            keyword: overview.keyword || state.seedKeyword,
            location_code: overview.location_code || state.locationCode,
            language_code: overview.language_code || state.languageCode,
            search_volume: overview.search_volume || 0,
            keyword_difficulty: overview.keyword_difficulty || 0,
            cpc: overview.cpc || 0,
            competition: overview.competition || 0,
            monthly_searches: overview.monthly_searches || [],
            search_intent_info: overview.search_intent_info || null,
            impressions_info: overview.impressions_info || null,
            serp_info: overview.serp_info || null,
          },
        overviewLoading: false
      }));
      
        const trendCount = overview.monthly_searches?.length || 0;
        toast.success(`Overview loaded${trendCount > 0 ? ` with ${trendCount} months of trend data` : ''}!`);
      } else {
        addDebugLog('error', `❌ No overview in response! Full data: ${JSON.stringify(data)}`);
        toast.warning("No data found for this keyword");
        setState(prev => ({ ...prev, overviewLoading: false }));
      }
    } catch (error) {
      console.error("Error fetching overview:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addDebugLog('error', `❌ Failed to fetch overview: ${errorMessage}`);
      toast.error(`Failed to fetch overview: ${errorMessage}`);
      setState(prev => ({ ...prev, overviewLoading: false }));
    }
  };

  const fetchIdeas = async () => {
    setState(prev => ({ ...prev, ideasLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("keyword-ideas-all", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode,
          limit: 100
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        matchingTerms: data.matching || [],
        relatedTerms: data.related || [],
        questions: data.questions || [],
        searchSuggestions: data.suggestions || [],
        ideasLoading: false
      }));

      toast.success(`Found ${(data.matching?.length || 0) + (data.related?.length || 0)} keyword ideas!`);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to fetch ideas: ${errorMessage}`);
      setState(prev => ({ ...prev, ideasLoading: false }));
    }
  };

  const fetchSERP = async () => {
    setState(prev => ({ ...prev, serpLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("serp-enriched", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode,
          depth: 10
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        serpItems: data.items || [],
        serpLoading: false
      }));

      // Save top result URL for Traffic Potential calculation
      if (data.items && data.items.length > 0) {
        setTopResultUrl(data.items[0].url);
        toast.success(`SERP loaded with ${data.items.length} enriched results!`);
      }
    } catch (error) {
      console.error("Error fetching SERP:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to fetch SERP: ${errorMessage}`);
      setState(prev => ({ ...prev, serpLoading: false }));
    }
  };

  const fetchTrafficPotential = async (targetUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("traffic-potential", {
        body: {
          target_url: targetUrl,
          location_code: state.locationCode,
          language_code: state.languageCode
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        trafficPotential: data.traffic_potential,
        parentTopic: data.parent_topic,
      }));

      toast.success(`Traffic Potential: ${data.traffic_potential.toLocaleString()} visits/mo`);
    } catch (error) {
      console.error("Error fetching traffic potential:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to fetch traffic potential: ${errorMessage}`);
    }
  };

  const handleSearch = async () => {
    if (!state.seedKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    // Reset state
    setTopResultUrl("");
    
    // Fetch Overview + Ideas + SERP in parallel
    const promises = [
      fetchOverview(),
      fetchIdeas(),
      fetchSERP()
    ];

    await Promise.all(promises);
  };

  // Auto-fetch Traffic Potential when we have top result
  React.useEffect(() => {
    if (topResultUrl && !state.trafficPotential) {
      fetchTrafficPotential(topResultUrl);
    }
  }, [topResultUrl]);

  // Load trend data for a keyword
  const loadMonthlyTrendForKeyword = async (keyword: string) => {
    setIsLoadingTrend(true);
    addDebugLog('info', `📊 Loading monthly trend data for: "${keyword}"`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addDebugLog('error', '❌ No auth session');
        setIsLoadingTrend(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('keyword-overview-bundle', {
        body: {
          keyword: keyword,
          location_code: state.locationCode,
          language_code: state.languageCode
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        addDebugLog('error', `❌ API error: ${error.message}`);
        setIsLoadingTrend(false);
        return;
      }

      const overview = data?.overview;
      if (!overview) {
        addDebugLog('error', '❌ No overview in response');
        setIsLoadingTrend(false);
        return;
      }

      const monthlySearches = overview.monthly_searches || [];
      addDebugLog('info', `📊 Found ${monthlySearches.length} months of data`);

      if (monthlySearches.length === 0) {
        addDebugLog('warn', '⚠️ No monthly search data available');
        setMonthlyTrendData([]);
        setIsLoadingTrend(false);
        return;
      }

      const chartData = monthlySearches
        .slice(-12)
        .map((item: any) => ({
          month: item.month,
          year: item.year,
          monthLabel: `${item.year}-${String(item.month).padStart(2, '0')}`,
          search_volume: item.search_volume || 0,
        }))
        .sort((a: any, b: any) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });

      setMonthlyTrendData(chartData);
      addDebugLog('success', `✅ Loaded ${chartData.length} months of trend data`);
    } catch (error: any) {
      console.error('💥 Monthly Trend Error:', error);
      addDebugLog('error', `❌ Failed: ${error.message}`);
      setMonthlyTrendData([]);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  // Load AI Overview for a keyword
  const loadAiOverviewForKeyword = async (keyword: string) => {
    setIsLoadingAiOverview(true);
    addDebugLog('info', `🤖 Loading AI Overview for: "${keyword}"`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoadingAiOverview(false);
        return;
      }

      // First try regular SERP with AI Overview enabled
      let { data, error } = await supabase.functions.invoke('dataforseo-serp', {
        body: {
          keyword: keyword,
          location_code: state.locationCode,
          language_code: state.languageCode,
          device: 'desktop',
          enable_ai_overview: true,
          enable_ai_mode: true // Also try AI Mode endpoint
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        addDebugLog('error', `❌ SERP error: ${error.message}`);
        setIsLoadingAiOverview(false);
        return;
      }

      // AI Mode returns data in tasks[0].result[0] structure
      // Regular SERP also uses same structure
      const serpResult = data?.tasks?.[0]?.result?.[0];
      
      // AI Overview can be in different places:
      // 1. Direct in items array: items[0].type === 'ai_overview'
      // 2. In items array with type 'ai_mode'
      const aiOverviewItems = serpResult?.items?.filter((item: any) => 
        item.type === 'ai_overview' || item.type === 'ai_mode'
      ) || [];

      console.log('🔵 SERP Result:', JSON.stringify(serpResult, null, 2));
      console.log('🔵 AI Overview Items:', aiOverviewItems.length);

      if (aiOverviewItems.length > 0) {
        const aiItem = aiOverviewItems[0];
        console.log('🔵 AI Item structure:', JSON.stringify(Object.keys(aiItem)));
        
        // Extract content - can be in markdown, text, or content field
        const content = aiItem.markdown || aiItem.text || aiItem.content || aiItem.answer || 'AI Overview detected';
        
        // Extract sources/references - DataForSEO uses 'references' array
        // Each reference has: url, title, domain, source, text
        const sources = (aiItem.references || aiItem.sources || []).map((src: any) => ({
          title: src.title || src.name || src.domain || 'Unknown',
          url: src.url || src.link || '#',
          favicon: src.favicon || `https://www.google.com/s2/favicons?domain=${src.domain || src.url || 'google.com'}`
        }));
        
        console.log('🔵 AI Overview Content length:', content.length);
        console.log('🔵 AI Overview Sources count:', sources.length);
        
        setAiOverviewData({
          content: content,
          sources: sources
        });
        addDebugLog('success', `✅ AI Overview found with ${sources.length} sources`);
      } else {
        addDebugLog('info', `ℹ️ No AI Overview detected. Items in result: ${serpResult?.items?.length || 0}`);
        setAiOverviewData(null);
      }
    } catch (error: any) {
      console.error('💥 AI Overview Error:', error);
      setAiOverviewData(null);
    } finally {
      setIsLoadingAiOverview(false);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    console.log('🔵 Keyword clicked:', keyword);
    
    // Find the keyword in matching or related terms
    const kw = [...state.matchingTerms, ...state.relatedTerms, ...state.questions]
      .find(k => k.keyword === keyword);
    
    if (!kw) {
      toast.error('Keyword data not found');
      return;
    }

    setSelectedKeyword(kw);
    setShowKeywordDialog(true);
    setMonthlyTrendData([]);
    setAiOverviewData(null);

    // Load data
    loadMonthlyTrendForKeyword(keyword);
    loadAiOverviewForKeyword(keyword);
  };

  const isLoading = state.overviewLoading || state.ideasLoading || state.serpLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <Zap className="h-8 w-8 text-primary" />
            Keywords Explorer
          </h1>
          <p className="text-muted-foreground">
            Complete keyword research and analysis powered by advanced SEO intelligence
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">All Features Enabled</div>
          <div className="text-xs text-emerald-500">✓ Overview ✓ Ideas ✓ SERP ✓ TP ✓ Authority</div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border-2 border-primary/20">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter seed keyword (e.g., 'seo tools', 'digital marketing')"
              value={state.seedKeyword}
              onChange={(e) => setState(prev => ({ ...prev, seedKeyword: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-12 text-lg"
              disabled={isLoading}
            />
          </div>

          <Select
            value={state.locationCode.toString()}
            onValueChange={(v) => setState(prev => ({ ...prev, locationCode: Number(v) }))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[200px] h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2840">🇺🇸 United States</SelectItem>
              <SelectItem value="2826">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="2124">🇨🇦 Canada</SelectItem>
              <SelectItem value="2036">🇦🇺 Australia</SelectItem>
              <SelectItem value="2276">🇩🇪 Germany</SelectItem>
              <SelectItem value="2250">🇫🇷 France</SelectItem>
              <SelectItem value="2380">🇮🇹 Italy</SelectItem>
              <SelectItem value="2724">🇪🇸 Spain</SelectItem>
              <SelectItem value="2528">🇳🇱 Netherlands</SelectItem>
              <SelectItem value="2300">🇬🇷 Greece</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={state.languageCode}
            onValueChange={(v) => setState(prev => ({ ...prev, languageCode: v }))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[150px] h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="el">Ελληνικά</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            size="lg"
            className="px-8 h-12 gradient-primary"
          >
            {isLoading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Search className="h-5 w-5 mr-2" />Analyze</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="gap-2 h-12"
          >
            <Bug className="h-4 w-4" />
            {showDebug ? 'Hide' : 'Show'} Debug
          </Button>
        </div>
      </Card>

      {/* Location Info */}
      {state.seedKeyword && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>
            Analyzing <strong className="text-foreground">"{state.seedKeyword}"</strong> for{" "}
            <strong className="text-foreground">
              {state.locationCode === 2840 ? "United States" : 
               state.locationCode === 2826 ? "United Kingdom" :
               state.locationCode === 2300 ? "Greece" : "Selected region"}
            </strong> in{" "}
            <strong className="text-foreground">{state.languageCode.toUpperCase()}</strong>
          </span>
        </div>
      )}

      {/* Overview Panel */}
      <KeywordOverviewPanel
        overview={state.overview}
        trafficPotential={state.trafficPotential}
        parentTopic={state.parentTopic}
        topResult={state.serpItems.length > 0 ? {
          url: state.serpItems[0].url,
          domain: state.serpItems[0].domain,
          title: state.serpItems[0].title || "No title"
        } : undefined}
        loading={state.overviewLoading}
      />

      {/* Keyword Ideas Tabs */}
      {(state.matchingTerms.length > 0 || state.relatedTerms.length > 0 || state.ideasLoading) && (
        <KeywordIdeasTabs
          matchingTerms={state.matchingTerms}
          relatedTerms={state.relatedTerms}
          questions={state.questions}
          searchSuggestions={state.searchSuggestions}
          loading={state.ideasLoading}
          onKeywordClick={handleKeywordClick}
        />
      )}

      {/* SERP Overview Table */}
      {(state.serpItems.length > 0 || state.serpLoading) && (
        <SerpOverviewTable
          serpItems={state.serpItems}
          loading={state.serpLoading}
          keywordTrendData={state.overview?.monthly_searches}
        />
      )}

      {/* Keyword Details Dialog */}
      <Dialog open={showKeywordDialog} onOpenChange={(open) => {
        setShowKeywordDialog(open);
        if (!open) {
          setSelectedKeyword(null);
          setMonthlyTrendData([]);
          setAiOverviewData(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Keyword Details: {selectedKeyword?.keyword || "-"}
            </DialogTitle>
            <DialogDescription>
              Comprehensive SEO metrics and analysis
            </DialogDescription>
          </DialogHeader>

          {selectedKeyword && (
            <div className="space-y-4">
              {/* Keyword Metrics */}
              <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Search Volume</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(selectedKeyword.keyword_info?.search_volume || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">CPC</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      ${(selectedKeyword.keyword_info?.cpc || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Keyword Difficulty</div>
                    <div className="text-2xl font-bold text-amber-400">
                      {selectedKeyword.keyword_properties?.keyword_difficulty || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Intent</div>
                    <div className="text-lg font-bold">
                      <Badge variant="outline">
                        {selectedKeyword.search_intent_info?.main_intent || "unknown"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* AI Overview */}
              {isLoadingAiOverview ? (
                <Card className="p-6">
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading AI Overview...</span>
                  </div>
                </Card>
              ) : aiOverviewData ? (
                <div>
                  <h4 className="text-sm font-semibold mb-4">AI Overview</h4>
                  <AIOverview 
                    content={aiOverviewData.content}
                    sources={aiOverviewData.sources}
                  />
                </div>
              ) : null}

              {/* 12-Month Trend Chart */}
              <div>
                <h4 className="text-sm font-semibold mb-4">12-Month Search Trend</h4>
                {isLoadingTrend ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : monthlyTrendData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrendData}>
                        <defs>
                          <linearGradient id="colorSearchVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="monthLabel" 
                          stroke="#64748b"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [value.toLocaleString(), 'Searches']}
                        />
                        <Area
                          type="monotone"
                          dataKey="search_volume"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorSearchVolume)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No trend data available for this keyword</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Welcome State */}
      {!state.overview && !isLoading && (
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-block p-4 bg-primary/10 rounded-full">
              <Zap className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Complete Keyword Intelligence Platform</h2>
            <p className="text-lg text-muted-foreground">
              Enter a keyword above to unlock comprehensive SEO intelligence
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-lg p-4">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-semibold">Keyword Overview</div>
                <div className="text-xs text-muted-foreground mt-1">
                  KD, Volume, CPC, 12-mo trend
                </div>
              </div>
              
              <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-lg p-4">
                <div className="text-3xl mb-2">💡</div>
                <div className="font-semibold">Keyword Ideas</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Matching, Related, Questions
                </div>
              </div>
              
              <div className="bg-purple-500/10 border-2 border-purple-500/20 rounded-lg p-4">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-semibold">SERP Analysis</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Authority Score + Backlinks
                </div>
              </div>
              
              <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-lg p-4">
                <div className="text-3xl mb-2">🚀</div>
                <div className="font-semibold">Traffic Potential</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Estimated monthly visits
                </div>
              </div>
              
              <div className="bg-pink-500/10 border-2 border-pink-500/20 rounded-lg p-4">
                <div className="text-3xl mb-2">✨</div>
                <div className="font-semibold">Parent Topic</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Main topic cluster
                </div>
              </div>
              
              <div className="bg-indigo-500/10 border-2 border-indigo-500/20 rounded-lg p-4">
                <div className="text-3xl mb-2">📈</div>
                <div className="font-semibold">Search Intent</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Commercial, Informational, etc.
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Powered by <strong>AnotherSEOGuru AI</strong> • 
                Built by <strong>GK</strong>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <FeatureDebugPanel
          logs={debugLogs}
          featureName="Keyword Explorer Full"
          onClear={() => setDebugLogs([])}
        />
      )}
    </div>
  );
}
