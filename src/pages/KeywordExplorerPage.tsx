import { useState } from "react";
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
import { Search, Globe, Loader2, Bug } from "lucide-react";
import { KeywordOverviewPanel } from "@/components/keyword-explorer/KeywordOverviewPanel";
import { KeywordIdeasTabs } from "@/components/keyword-explorer/KeywordIdeasTabs";
import { SerpOverviewTable } from "@/components/keyword-explorer/SerpOverviewTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeywordExplorerState } from "@/types/keyword-explorer";
import { FeatureDebugPanel, DebugLog } from "@/components/debug/FeatureDebugPanel";
import { useState } from "react";

export default function KeywordExplorerPage() {
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [state, setState] = useState<KeywordExplorerState>({
    seedKeyword: "",
    locationCode: 2840, // US default
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
    addDebugLog('info', `Location: ${state.locationCode}, Language: ${state.languageCode}`);
    
    try {
      // Get session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addDebugLog('error', '❌ No auth session - please login');
        toast.error('Please sign in again');
        setState(prev => ({ ...prev, overviewLoading: false }));
        return;
      }

      // Use keyword-overview-bundle which includes historical search volume (monthly_searches)
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
        
        if (overview.monthly_searches && overview.monthly_searches.length > 0) {
          addDebugLog('success', `✅ Found ${overview.monthly_searches.length} months of trend data`);
          addDebugLog('info', `Sample: ${JSON.stringify(overview.monthly_searches[0])}`);
        } else {
          addDebugLog('warn', `⚠️ No monthly_searches data! Value: ${JSON.stringify(overview.monthly_searches)}`);
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
        toast.success(trendCount > 0 ? `Overview loaded with ${trendCount} months of trend data` : "Overview loaded");
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
      // Fetch matching terms (suggestions)
      const { data: matchingData } = await supabase.functions.invoke("dataforseo-labs-keyword-suggestions", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode,
          limit: 100
        }
      });

      // Fetch related keywords
      const { data: relatedData } = await supabase.functions.invoke("dataforseo-labs-related-keywords", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode,
          depth: 1,
          limit: 100
        }
      });

      const matching = matchingData?.tasks?.[0]?.result?.[0]?.items || [];
      const related = relatedData?.tasks?.[0]?.result?.[0]?.items || [];
      
      // Filter questions (keywords starting with question words)
      const questionRegex = /^(what|how|why|when|where|who|which|can|will|should|is|are|do|does)/i;
      const questions = [...matching, ...related].filter(item => 
        questionRegex.test(item.keyword || item.keyword_data?.keyword || "")
      );

      setState(prev => ({
        ...prev,
        matchingTerms: matching,
        relatedTerms: related,
        questions: questions.slice(0, 50),
        searchSuggestions: [], // TODO: Implement autocomplete
        ideasLoading: false
      }));

      toast.success(`Found ${matching.length + related.length} keyword ideas`);
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
      // TODO: Implement SERP with enrichment
      // For now, show placeholder
      toast.info("SERP enrichment not yet implemented. See KEYWORD_EXPLORER_IMPLEMENTATION.md");
      setState(prev => ({ ...prev, serpLoading: false, serpItems: [] }));
    } catch (error) {
      console.error("Error fetching SERP:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to fetch SERP: ${errorMessage}`);
      setState(prev => ({ ...prev, serpLoading: false }));
    }
  };

  const handleSearch = async () => {
    if (!state.seedKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    // Fetch all data
    await Promise.all([
      fetchOverview(),
      fetchIdeas(),
      // fetchSERP() // Commented out until implemented
    ]);
  };

  const handleKeywordClick = (keyword: string) => {
    // Just update the seed keyword in the input, don't auto-search
    // User can click Analyze if they want to search
    setState(prev => ({ ...prev, seedKeyword: keyword }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Keywords Explorer</h1>
        <p className="text-muted-foreground">
          Advanced keyword research and SEO intelligence platform
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter seed keyword (e.g., 'seo tools')"
              value={state.seedKeyword}
              onChange={(e) => setState(prev => ({ ...prev, seedKeyword: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              disabled={state.overviewLoading || state.ideasLoading}
            />
          </div>

          <Select
            value={state.locationCode.toString()}
            onValueChange={(v) => setState(prev => ({ ...prev, locationCode: Number(v) }))}
          >
            <SelectTrigger className="w-[200px]">
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
              <SelectItem value="2300">🇬🇷 Greece</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={state.languageCode}
            onValueChange={(v) => setState(prev => ({ ...prev, languageCode: v }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="el">Ελληνικά</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSearch} 
            disabled={state.overviewLoading || state.ideasLoading}
            size="lg"
            className="px-8"
          >
            {(state.overviewLoading || state.ideasLoading) ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />Search</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="gap-2"
          >
            <Bug className="h-4 w-4" />
            {showDebug ? 'Hide' : 'Show'} Debug
          </Button>
        </div>
      </Card>

      {/* Location Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>
          Showing results for: <strong>{state.locationCode === 2840 ? "United States" : "Selected region"}</strong> in <strong>{state.languageCode === "en" ? "English" : state.languageCode.toUpperCase()}</strong>
        </span>
      </div>

      {/* Overview Panel */}
      <KeywordOverviewPanel
        overview={state.overview}
        trafficPotential={state.trafficPotential}
        parentTopic={state.parentTopic}
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
      {state.serpItems.length > 0 && (
        <SerpOverviewTable
          serpItems={state.serpItems}
          loading={state.serpLoading}
          keywordTrendData={state.overview?.monthly_searches}
        />
      )}

      {/* Implementation Notice */}
      {!state.overview && !state.overviewLoading && (
        <Card className="p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-xl font-bold">🎯 Advanced Keywords Explorer</h3>
            <p className="text-muted-foreground">
              Enter a keyword above to start exploring. This page provides:
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                ✅ Keyword Overview (KD, SV, CPC)
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                ✅ Keyword Ideas (Matching, Related, Questions)
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                ⏳ SERP Overview with Authority Metrics
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                ⏳ Traffic Potential & Parent Topic
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              See <code className="bg-muted px-2 py-1 rounded">KEYWORD_EXPLORER_IMPLEMENTATION.md</code> for full implementation guide
            </p>
          </div>
        </Card>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <FeatureDebugPanel
          logs={debugLogs}
          featureName="Keyword Explorer"
          onClear={() => setDebugLogs([])}
        />
      )}
    </div>
  );
}
