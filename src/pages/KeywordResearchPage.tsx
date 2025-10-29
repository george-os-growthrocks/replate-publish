import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, TrendingUp, Lightbulb, Target, Loader2, DollarSign, BarChart3, Clock, Award, Zap, Globe, ExternalLink } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateKeywordDifficulty, analyzeCtr } from "@/lib/seo-algorithms";
import { FeatureDebugPanel, DebugLog } from "@/components/debug/FeatureDebugPanel";
import { AIOverview } from "@/components/serp/AIOverview";

interface KeywordResult {
  keyword?: string;
  key?: string;
  keyword_data?: {
    keyword?: string;
    keyword_info?: {
      search_volume?: number;
      cpc?: number;
      competition?: number;
      keyword_difficulty?: number;
      monthly_searches?: Array<{ month: number; year: number; search_volume: number }>;
    };
  };
  search_volume?: number;
  cpc?: number;
  competition?: number;
  competition_level?: string;
  competition_index?: number;
  keyword_difficulty?: number;
  keyword_info?: {
    search_volume?: number;
    cpc?: number;
    competition?: number;
    keyword_difficulty?: number;
    monthly_searches?: any[];
  };
  keyword_properties?: {
    search_volume?: number;
    cpc?: number;
    keyword_difficulty?: number;
  };
  avg_backlinks_info?: {
    search_volume?: number;
  };
  serp_info?: {
    se_results_count?: number;
  };
  impressions_info?: {
    se_results_count?: number;
  };
  se_results_count?: number;
}

export default function KeywordResearchPage() {
  const [seedKeyword, setSeedKeyword] = useState("");
  const [targetDomain, setTargetDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    ideas?: KeywordResult[];
    suggestions?: KeywordResult[];
    related?: KeywordResult[];
    competitor?: KeywordResult[];
  }>({});
  const [activeTab, setActiveTab] = useState("ideas");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordResult | null>(null);
  const [showSerpDialog, setShowSerpDialog] = useState(false);
  const [aiOverviewData, setAiOverviewData] = useState<{content: string; sources: Array<{title: string; url: string; favicon?: string}>} | null>(null);
  const [isLoadingAiOverview, setIsLoadingAiOverview] = useState(false);
  const [locationCode, setLocationCode] = useState(2300); // Greece default
  const [languageCode, setLanguageCode] = useState("el"); // Greek default
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
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

      // Load monthly search trend data
  const loadMonthlyTrend = async (targetKeyword?: string) => {
    // Use provided keyword or get from selectedKeyword
    const keyword = targetKeyword || selectedKeyword?.keyword_data?.keyword || selectedKeyword?.keyword;
    if (!keyword) {
      addDebugLog('error', '❌ No keyword provided for trend data');
      toast.error('Please select a keyword first');
      return;
    }

    setIsLoadingTrend(true);
    addDebugLog('info', `📊 Loading monthly trend data for: "${keyword}"`);
    
    try {
      // Get session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addDebugLog('error', '❌ No auth session - please login');
        toast.error('Please sign in again');
        setIsLoadingTrend(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('keyword-overview-bundle', {
        body: {
          keyword: keyword,
          location_code: locationCode,
          language_code: languageCode,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        addDebugLog('error', `❌ API error: ${error.message}`);
        throw error;
      }

      if (data?.error) {
        addDebugLog('error', `❌ API error: ${data.error}`);
        throw new Error(data.error);
      }

      console.log('🔵 Full API response:', JSON.stringify(data, null, 2));
      addDebugLog('info', `📊 Full response keys: ${data ? Object.keys(data).join(', ') : 'null'}`);
      
      const overview = data?.overview;
      if (!overview) {
        addDebugLog('error', '❌ No overview in response');
        console.error('❌ Response structure:', data);
        toast.error('Invalid response from API');
        setMonthlyTrendData([]);
        return;
      }

      addDebugLog('info', `📊 Overview keys: ${Object.keys(overview).join(', ')}`);
      addDebugLog('info', `📊 monthly_searches type: ${typeof overview.monthly_searches}`);
      addDebugLog('info', `📊 monthly_searches length: ${Array.isArray(overview.monthly_searches) ? overview.monthly_searches.length : 'NOT AN ARRAY'}`);
      
      const monthlySearches = overview.monthly_searches || [];
      
      console.log('🔵 Monthly searches raw:', monthlySearches);
      
      if (monthlySearches.length === 0) {
        addDebugLog('warn', '⚠️ No monthly search data returned');
        addDebugLog('info', `📊 Debug info: ${JSON.stringify(overview._debug || {})}`);
        
        // Check if there's data in other places
        if (overview.clickstream_keyword_info?.monthly_searches) {
          addDebugLog('info', '📊 Found monthly_searches in clickstream_keyword_info');
          const clickstreamData = overview.clickstream_keyword_info.monthly_searches;
          if (Array.isArray(clickstreamData) && clickstreamData.length > 0) {
            monthlySearches.push(...clickstreamData);
          }
        }
        
        if (monthlySearches.length === 0) {
          toast.warning('No trend data available for this keyword');
          setMonthlyTrendData([]);
          return;
        }
      }

      // Transform data for chart (last 12 months)
      const chartData = monthlySearches
        .slice(-12) // Last 12 months
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

      console.log('🔵 Chart data prepared:', chartData);
      setMonthlyTrendData(chartData);
      addDebugLog('success', `✅ Loaded ${chartData.length} months of trend data`);
      toast.success(`Loaded ${chartData.length} months of trend data`);
    } catch (error: any) {
      console.error('💥 Monthly Trend Error:', error);
      addDebugLog('error', `❌ Failed to load trend data: ${error.message}`);
      toast.error(`Failed to load trend data: ${error.message}`);
      setMonthlyTrendData([]);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  // Load SERP with AI Overview when keyword is selected
  const loadSerpWithAiOverview = async (targetKeyword?: string) => {
    const keyword = targetKeyword || selectedKeyword?.keyword_data?.keyword || selectedKeyword?.keyword;
    if (!keyword) return;

    setIsLoadingAiOverview(true);
    addDebugLog('info', `🤖 Loading SERP with AI Overview for: "${keyword}"`);

    try {
      // Get session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addDebugLog('error', '❌ No auth session - please login');
        setIsLoadingAiOverview(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('dataforseo-serp', {
        body: {
          keyword: keyword,
          location_code: locationCode,
          language_code: languageCode,
          device: 'desktop',
          enable_ai_overview: true
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        addDebugLog('error', `❌ SERP API error: ${error.message}`);
        setIsLoadingAiOverview(false);
        return;
      }

      // Extract AI Overview from SERP response
      const serpResult = data?.tasks?.[0]?.result?.[0];
      const aiOverviewItems = serpResult?.items?.filter((item: any) => 
        item.type === 'ai_overview' || item.type === 'ai_mode'
      ) || [];

      if (aiOverviewItems.length > 0) {
        const aiItem = aiOverviewItems[0];
        setAiOverviewData({
          content: aiItem.text || aiItem.content || aiItem.answer || 'AI Overview detected but content not available',
          sources: (aiItem.sources || []).map((src: any) => ({
            title: src.title || src.name || src.domain || 'Unknown',
            url: src.url || src.link || '#',
            favicon: src.favicon || `https://www.google.com/s2/favicons?domain=${src.domain || src.url}`
          }))
        });
        addDebugLog('success', `✅ AI Overview found with ${aiItem.sources?.length || 0} sources`);
      } else {
        addDebugLog('info', `ℹ️ No AI Overview detected for this keyword`);
        setAiOverviewData(null);
      }
    } catch (error: any) {
      console.error('💥 AI Overview Error:', error);
      addDebugLog('error', `❌ Failed to load AI Overview: ${error.message}`);
      setAiOverviewData(null);
    } finally {
      setIsLoadingAiOverview(false);
    }
  };

  // Auto-load trend AND AI Overview when keyword is selected AND dialog is open
  useEffect(() => {
    if (selectedKeyword && showSerpDialog) {
      const keyword = selectedKeyword?.keyword_data?.keyword || selectedKeyword?.keyword;
      if (keyword) {
        // Always reload both to ensure fresh data
        addDebugLog('info', `📌 Keyword selected in dialog: "${keyword}" - loading trend data and AI Overview`);
        loadMonthlyTrend(keyword);
        loadSerpWithAiOverview(keyword);
      }
    } else if (!showSerpDialog) {
      // Reset when dialog closes
      setMonthlyTrendData([]);
      setAiOverviewData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeyword, showSerpDialog]);

  const fetchKeywordIdeas = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a seed keyword");
      return;
    }

    setIsLoading(true);
    addDebugLog('info', `🔍 Fetching keyword ideas for: "${seedKeyword}"`);
    try {
      console.log("🔍 Keyword Ideas Request:", {
        keywords: [seedKeyword],
        location_code: locationCode,
        language_code: languageCode,
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-keyword-ideas", {
        body: {
          keywords: [seedKeyword],
          location_code: locationCode,
          language_code: languageCode,
          limit: 100
        }
      });

      console.log("📦 Keyword Ideas Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ API Error:", data.error);
        throw new Error(data.error);
      }

      console.log("📊 Full Data Structure:", JSON.stringify(data, null, 2));

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      console.log(`✅ Extracted ${items.length} keyword ideas:`, items.slice(0, 3));
      
      // Log the field names of the first item to help debug
      if (items.length > 0) {
        console.log("🔑 Available fields in first item:", Object.keys(items[0]));
        console.log("📝 First item structure:", items[0]);
      }

      // Save debug info
      setDebugInfo({
        type: "Keyword Ideas",
        request: { keywords: [seedKeyword], location_code: locationCode, language_code: languageCode },
        response: data,
        itemsFound: items.length,
        sampleItems: items.slice(0, 3),
        availableFields: items.length > 0 ? Object.keys(items[0]) : [],
        firstItemSample: items.length > 0 ? items[0] : null
      });

      setResults(prev => ({ ...prev, ideas: items }));
      
      if (items.length === 0) {
        addDebugLog('warn', '⚠️ No keyword ideas found');
        toast.warning("No keywords found. Check console for details.");
      } else {
        addDebugLog('success', `✅ Found ${items.length} keyword ideas`);
        toast.success(`Found ${items.length} keyword ideas`);
      }
    } catch (error: any) {
      console.error("💥 Keyword Ideas Error:", error);
      addDebugLog('error', `❌ Failed to fetch keyword ideas: ${error.message}`);
      toast.error(`Failed to fetch keyword ideas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKeywordSuggestions = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a seed keyword");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔍 Keyword Suggestions Request:", {
        keyword: seedKeyword,
        location_code: locationCode,
        language_code: languageCode,
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-keyword-suggestions", {
        body: {
          keyword: seedKeyword,
          location_code: locationCode,
          language_code: languageCode,
          limit: 100
        }
      });

      console.log("📦 Keyword Suggestions Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ API Error:", data.error);
        throw new Error(data.error);
      }

      console.log("📊 Full Data Structure:", JSON.stringify(data, null, 2));

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      console.log(`✅ Extracted ${items.length} keyword suggestions:`, items.slice(0, 3));
      
      if (items.length > 0) {
        console.log("🔑 Available fields in first item:", Object.keys(items[0]));
        console.log("📝 First item structure:", items[0]);
      }

      setDebugInfo({
        type: "Keyword Suggestions",
        request: { keyword: seedKeyword, location_code: locationCode, language_code: languageCode },
        response: data,
        itemsFound: items.length,
        sampleItems: items.slice(0, 3),
        availableFields: items.length > 0 ? Object.keys(items[0]) : [],
        firstItemSample: items.length > 0 ? items[0] : null
      });

      setResults(prev => ({ ...prev, suggestions: items }));
      
      if (items.length === 0) {
        toast.warning("No keywords found. Check console for details.");
      } else {
        toast.success(`Found ${items.length} keyword suggestions`);
      }
    } catch (error: any) {
      console.error("💥 Keyword Suggestions Error:", error);
      toast.error(`Failed to fetch keyword suggestions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedKeywords = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a seed keyword");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔍 Related Keywords Request:", {
        keyword: seedKeyword,
        location_code: locationCode,
        language_code: languageCode,
        depth: 1,
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-related-keywords", {
        body: {
          keyword: seedKeyword,
          location_code: locationCode,
          language_code: languageCode,
          depth: 1,
          limit: 100
        }
      });

      console.log("📦 Related Keywords Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ API Error:", data.error);
        throw new Error(data.error);
      }

      console.log("📊 Full Data Structure:", JSON.stringify(data, null, 2));

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      console.log(`✅ Extracted ${items.length} related keywords:`, items.slice(0, 3));
      
      if (items.length > 0) {
        console.log("🔑 Available fields in first item:", Object.keys(items[0]));
        console.log("📝 First item structure:", items[0]);
      }

      setDebugInfo({
        type: "Related Keywords",
        request: { keyword: seedKeyword, location_code: locationCode, language_code: languageCode, depth: 1 },
        response: data,
        itemsFound: items.length,
        sampleItems: items.slice(0, 3),
        availableFields: items.length > 0 ? Object.keys(items[0]) : [],
        firstItemSample: items.length > 0 ? items[0] : null
      });

      setResults(prev => ({ ...prev, related: items }));
      
      if (items.length === 0) {
        toast.warning("No keywords found. Check console for details.");
      } else {
        toast.success(`Found ${items.length} related keywords`);
      }
    } catch (error: any) {
      console.error("💥 Related Keywords Error:", error);
      toast.error(`Failed to fetch related keywords: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompetitorKeywords = async () => {
    if (!targetDomain.trim()) {
      toast.error("Please enter a competitor domain");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔍 Competitor Keywords Request:", {
        target: targetDomain,
        location_code: locationCode,
        language_code: languageCode,
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-keywords-for-site", {
        body: {
          target: targetDomain,
          location_code: locationCode,
          language_code: languageCode,
          limit: 100
        }
      });

      console.log("📦 Competitor Keywords Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ API Error:", data.error);
        throw new Error(data.error);
      }

      console.log("📊 Full Data Structure:", JSON.stringify(data, null, 2));

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      console.log(`✅ Extracted ${items.length} competitor keywords:`, items.slice(0, 3));
      
      if (items.length > 0) {
        console.log("🔑 Available fields in first item:", Object.keys(items[0]));
        console.log("📝 First item structure:", items[0]);
      }

      setDebugInfo({
        type: "Competitor Keywords",
        request: { target: targetDomain, location_code: locationCode, language_code: languageCode },
        response: data,
        itemsFound: items.length,
        sampleItems: items.slice(0, 3),
        availableFields: items.length > 0 ? Object.keys(items[0]) : [],
        firstItemSample: items.length > 0 ? items[0] : null
      });

      setResults(prev => ({ ...prev, competitor: items }));
      
      if (items.length === 0) {
        toast.warning("No keywords found. Check console for details.");
      } else {
        toast.success(`Found ${items.length} competitor keywords`);
      }
    } catch (error: any) {
      console.error("💥 Competitor Keywords Error:", error);
      toast.error(`Failed to fetch competitor keywords: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate priority score for keyword opportunities
  const calculatePriorityScore = (params: {
    difficulty: number;
    searchVolume: number;
    cpc: number;
    potentialClicks: number;
  }): number => {
    const { difficulty, searchVolume, cpc, potentialClicks } = params;
    
    // Lower difficulty = higher score (inverted)
    const difficultyScore = (100 - difficulty) * 0.35;
    
    // Higher search volume = higher score (normalized)
    const volumeScore = Math.min(100, (searchVolume / 1000) * 10) * 0.30;
    
    // Higher CPC = higher value (capped at $10)
    const cpcScore = Math.min(100, (cpc / 10) * 100) * 0.15;
    
    // Potential clicks
    const clicksScore = Math.min(100, potentialClicks / 5) * 0.20;
    
    return Math.round(difficultyScore + volumeScore + cpcScore + clicksScore);
  };

  const renderKeywordTable = (keywords: KeywordResult[] | undefined) => {
    if (!keywords || keywords.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No keywords found. Try a different search.
        </div>
      );
    }

    // Helper function to extract keyword data from various possible API response structures
    const extractKeywordData = (kw: any, idx: number) => {
      // Extract keyword (check multiple paths)
      const keyword = 
        kw.keyword || 
        kw.keyword_data?.keyword || 
        kw.key || 
        "";
      
      // Try multiple paths for search volume
      const searchVolume = 
        kw.search_volume ?? 
        kw.keyword_info?.search_volume ?? 
        kw.keyword_data?.keyword_info?.search_volume ??
        kw.keyword_properties?.search_volume ??
        (kw.avg_backlinks_info?.search_volume) ??
        undefined;
      
      // Try multiple paths for CPC
      const cpc = 
        kw.cpc ?? 
        kw.keyword_info?.cpc ?? 
        kw.keyword_data?.keyword_info?.cpc ??
        kw.keyword_properties?.cpc ??
        undefined;
      
      // Try multiple paths for competition
      const competition = 
        kw.competition ?? 
        kw.keyword_info?.competition ?? 
        kw.keyword_data?.keyword_info?.competition ??
        kw.competition_index ??
        undefined;
      
      // Try multiple paths for keyword difficulty
      const difficulty = 
        kw.keyword_difficulty ?? 
        kw.keyword_properties?.keyword_difficulty ??
        kw.keyword_info?.keyword_difficulty ??
        undefined;
      
      // Try multiple paths for SERP results
      const serpResults = 
        kw.serp_info?.se_results_count ?? 
        kw.impressions_info?.se_results_count ??
        kw.se_results_count ??
        undefined;

      // Log extraction for first 3 items for debugging
      if (idx < 3) {
        console.log(`🔍 Extracting data for keyword #${idx + 1}:`, {
          keyword,
          searchVolume,
          cpc,
          competition,
          difficulty,
          serpResults,
          rawItem: kw
        });
      }

      return { keyword, searchVolume, cpc, competition, difficulty, serpResults };
    };

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Award className="h-3 w-3" />
                Priority
              </div>
            </TableHead>
            <TableHead className="text-right">Search Volume</TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Target className="h-3 w-3" />
                Difficulty
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                Time
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <TrendingUp className="h-3 w-3" />
                Potential
              </div>
            </TableHead>
            <TableHead className="text-right">CPC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.slice(0, 50).map((kw, idx) => {
            const { keyword, searchVolume, cpc, competition, difficulty, serpResults } = extractKeywordData(kw, idx);
            
            // Calculate enhanced metrics using SEO algorithms
            const difficultyAnalysis = calculateKeywordDifficulty(
              {
                keyword: keyword || "",
                searchVolume: searchVolume || 0,
                cpc: cpc || 0,
                competition: competition || 0.5,
              },
              {
                avgDomainAuthority: 50,
                avgBacklinks: 100,
                avgContentLength: 2000,
                topRankingPages: 10,
              }
            );

            // CTR analysis (assume position 10 for new keywords)
            const ctrAnalysis = analyzeCtr({
              currentPosition: 10,
              searchVolume: searchVolume || 0,
              hasRichSnippet: false,
              hasSitelinks: false,
              serpFeatures: [],
            });

            // Calculate priority score
            const priorityScore = calculatePriorityScore({
              difficulty: difficultyAnalysis.difficulty,
              searchVolume: searchVolume || 0,
              cpc: cpc || 0,
              potentialClicks: ctrAnalysis.potentialClicks,
            });

            const difficultyColors = {
              low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
              very_high: 'bg-red-500/10 text-red-400 border-red-500/20',
            };

            const priorityColor = priorityScore > 70 
              ? 'text-emerald-400 font-bold' 
              : priorityScore > 50 
                ? 'text-amber-400 font-semibold' 
                : 'text-muted-foreground';
            
            return (
              <TableRow key={idx} className={priorityScore > 70 ? 'bg-emerald-500/5' : priorityScore > 50 ? 'bg-amber-500/5' : ''}>
                <TableCell className="font-medium max-w-md">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔵 Keyword clicked:', keyword);
                      console.log('🔵 Keyword data:', kw);
                      setSelectedKeyword(kw);
                      setShowSerpDialog(true);
                      setMonthlyTrendData([]);
                      setAiOverviewData(null);
                      console.log('🔵 Dialog state set to true');
                    }}
                    className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer text-left w-full p-2 -m-2"
                  >
                    {priorityScore > 70 && <Zap className="h-3 w-3 text-emerald-400" />}
                    <div className="truncate" title={keyword || "-"}>
                      {keyword || "-"}
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`text-2xl ${priorityColor}`}>
                    {priorityScore}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {searchVolume !== undefined && searchVolume !== null ? (
                    <span className="font-medium">{searchVolume.toLocaleString()}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className={difficultyColors[difficultyAnalysis.competitionLevel]}>
                    {difficultyAnalysis.difficulty}/100
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-medium">{difficultyAnalysis.estimatedTimeToRank}mo</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-medium text-emerald-400">
                    +{ctrAnalysis.potentialClicks.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {cpc !== undefined && cpc !== null ? (
                    <span className="font-medium text-emerald-400">${cpc.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Keyword Research</h1>
        <p className="text-muted-foreground mt-1">
          Discover keyword opportunities with AI-powered difficulty scoring, time-to-rank estimation, and priority analysis
        </p>
      </div>

      {/* Location Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Target Market:</span>
          </div>
          <Select value={locationCode.toString()} onValueChange={(val) => setLocationCode(Number(val))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2300">🇬🇷 Greece (Greek)</SelectItem>
              <SelectItem value="2840">🇺🇸 United States (English)</SelectItem>
              <SelectItem value="2826">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="2276">🇩🇪 Germany</SelectItem>
              <SelectItem value="2250">🇫🇷 France</SelectItem>
              <SelectItem value="2380">🇮🇹 Italy</SelectItem>
              <SelectItem value="2724">🇪🇸 Spain</SelectItem>
              <SelectItem value="2528">🇳🇱 Netherlands</SelectItem>
              <SelectItem value="2056">🇧🇪 Belgium</SelectItem>
              <SelectItem value="2036">🇦🇺 Australia</SelectItem>
              <SelectItem value="2124">🇨🇦 Canada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={languageCode} onValueChange={setLanguageCode}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="el">Greek (Ελληνικά)</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">German (Deutsch)</SelectItem>
              <SelectItem value="fr">French (Français)</SelectItem>
              <SelectItem value="it">Italian (Italiano)</SelectItem>
              <SelectItem value="es">Spanish (Español)</SelectItem>
              <SelectItem value="nl">Dutch (Nederlands)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Search Controls */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Keyword Research</h3>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Enter seed keyword (e.g., 'seo tools')"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchKeywordIdeas()}
            />
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={fetchKeywordIdeas} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-1" />}
                Ideas
              </Button>
              <Button onClick={fetchKeywordSuggestions} disabled={isLoading} size="sm" variant="outline">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-1" />}
                Suggestions
              </Button>
              <Button onClick={fetchRelatedKeywords} disabled={isLoading} size="sm" variant="outline">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4 mr-1" />}
                Related
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Competitor Analysis</h3>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Enter competitor domain (e.g., 'example.com')"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCompetitorKeywords()}
            />
            <Button onClick={fetchCompetitorKeywords} disabled={isLoading} className="w-full" size="sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Analyze Keywords
            </Button>
          </div>
        </Card>
      </div>

      {/* Stats Cards */}
      {Object.keys(results).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Keywords</div>
            <div className="text-2xl font-bold mt-1">
              {(results.ideas?.length || 0) + (results.suggestions?.length || 0) + 
               (results.related?.length || 0) + (results.competitor?.length || 0)}
            </div>
          </Card>
          <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
            <div className="text-sm text-emerald-700 dark:text-emerald-200 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Quick Wins
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {(() => {
                const allKeywords = [
                  ...(results.ideas || []),
                  ...(results.suggestions || []),
                  ...(results.related || []),
                  ...(results.competitor || [])
                ];
                return allKeywords.filter((kw: any) => {
                  const sv = kw.search_volume || kw.keyword_info?.search_volume || 0;
                  const diff = kw.keyword_difficulty || kw.keyword_properties?.keyword_difficulty || 50;
                  return diff < 30 && sv > 100;
                }).length;
              })()}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300/70 mt-1">Low difficulty</div>
          </Card>
          <Card className="p-4 bg-blue-500/5 border-blue-500/20">
            <div className="text-sm text-blue-700 dark:text-blue-200 flex items-center gap-1">
              <Target className="h-3 w-3" />
              High Volume
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {(() => {
                const allKeywords = [
                  ...(results.ideas || []),
                  ...(results.suggestions || []),
                  ...(results.related || []),
                  ...(results.competitor || [])
                ];
                return allKeywords.filter((kw: any) => {
                  const sv = kw.search_volume || kw.keyword_info?.search_volume || 0;
                  return sv > 1000;
                }).length;
              })()}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300/70 mt-1">1000+ searches</div>
          </Card>
          <Card className="p-4 bg-amber-500/5 border-amber-500/20">
            <div className="text-sm text-amber-700 dark:text-amber-200 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              High Value
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
              {(() => {
                const allKeywords = [
                  ...(results.ideas || []),
                  ...(results.suggestions || []),
                  ...(results.related || []),
                  ...(results.competitor || [])
                ];
                return allKeywords.filter((kw: any) => {
                  const cpc = kw.cpc || kw.keyword_info?.cpc || 0;
                  return cpc > 2;
                }).length;
              })()}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300/70 mt-1">$2+ CPC</div>
          </Card>
          <Card className="p-4 bg-purple-500/5 border-purple-500/20">
            <div className="text-sm text-purple-700 dark:text-purple-200 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Best Opportunities
            </div>
            <div className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
              {(() => {
                const allKeywords = [
                  ...(results.ideas || []),
                  ...(results.suggestions || []),
                  ...(results.related || []),
                  ...(results.competitor || [])
                ];
                return allKeywords.filter((kw: any) => {
                  const sv = kw.search_volume || kw.keyword_info?.search_volume || 0;
                  const diff = kw.keyword_difficulty || kw.keyword_properties?.keyword_difficulty || 50;
                  const cpc = kw.cpc || kw.keyword_info?.cpc || 0;
                  return diff < 40 && sv > 500 && cpc > 1;
                }).length;
              })()}
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300/70 mt-1">Perfect combo</div>
          </Card>
        </div>
      )}

      {/* Results Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
            <TabsTrigger value="ideas" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              💡 Keyword Ideas ({results.ideas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              📝 Suggestions ({results.suggestions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="related" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              🎯 Related ({results.related?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="competitor" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              📊 Competitor ({results.competitor?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ideas" className="p-0">
            {renderKeywordTable(results.ideas)}
          </TabsContent>

          <TabsContent value="suggestions" className="p-0">
            {renderKeywordTable(results.suggestions)}
          </TabsContent>

          <TabsContent value="related" className="p-0">
            {renderKeywordTable(results.related)}
          </TabsContent>

          <TabsContent value="competitor" className="p-0">
            {renderKeywordTable(results.competitor)}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Debug Panel */}
      {debugInfo && (
        <Card className="p-6 bg-muted border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-lg">🐛</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-200">Debug Information</h3>
                <p className="text-xs text-amber-300/70">Last API call details</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDebugInfo(null)}>
              Close
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Request Type</div>
              <div className="text-sm text-white bg-slate-950/50 p-2 rounded border border-border">
                {debugInfo.type}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Items Found</div>
              <div className="text-sm text-white bg-slate-950/50 p-2 rounded border border-border">
                {debugInfo.itemsFound} keywords
              </div>
            </div>

            {debugInfo.availableFields && debugInfo.availableFields.length > 0 && (
              <div>
                <div className="text-xs font-medium text-amber-300 mb-1">
                  🔑 Available Fields in Response
                </div>
                <div className="text-xs text-white bg-slate-950/50 p-3 rounded border border-border">
                  <div className="flex flex-wrap gap-2">
                    {debugInfo.availableFields.map((field: string) => (
                      <Badge key={field} variant="outline" className="text-[10px] border-amber-500/30 text-amber-200">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {debugInfo.firstItemSample && (
              <div>
                <div className="text-xs font-medium text-amber-300 mb-1">
                  ✅ Data Extraction Status
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(() => {
                    const sample = debugInfo.firstItemSample;
                    const checks = [
                      { label: "Keyword", found: !!(sample.keyword || sample.keyword_data?.keyword || sample.key) },
                      { label: "Search Volume", found: !!(sample.search_volume ?? sample.keyword_info?.search_volume ?? sample.keyword_data?.keyword_info?.search_volume ?? sample.keyword_properties?.search_volume) },
                      { label: "CPC", found: !!(sample.cpc ?? sample.keyword_info?.cpc ?? sample.keyword_data?.keyword_info?.cpc ?? sample.keyword_properties?.cpc) },
                      { label: "Competition", found: !!(sample.competition ?? sample.keyword_info?.competition ?? sample.keyword_data?.keyword_info?.competition ?? sample.competition_index) },
                      { label: "Difficulty", found: !!(sample.keyword_difficulty ?? sample.keyword_properties?.keyword_difficulty ?? sample.keyword_info?.keyword_difficulty) },
                      { label: "SERP Results", found: !!(sample.serp_info?.se_results_count ?? sample.impressions_info?.se_results_count ?? sample.se_results_count) }
                    ];
                    return checks.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={check.found ? "text-emerald-400" : "text-red-400"}>
                          {check.found ? "✓" : "✗"}
                        </span>
                        <span className={check.found ? "text-white" : "text-red-300"}>
                          {check.label}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
                <div className="text-xs font-medium text-amber-300 mb-1">
                  📝 First Item Structure (raw JSON)
                </div>
                <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-border overflow-x-auto max-h-48">
                  {JSON.stringify(debugInfo.firstItemSample, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Request Payload</div>
              <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-border overflow-x-auto">
                {JSON.stringify(debugInfo.request, null, 2)}
              </pre>
            </div>

            {debugInfo.sampleItems && debugInfo.sampleItems.length > 0 && (
              <div>
                <div className="text-xs font-medium text-amber-300 mb-1">Sample Results (first 3)</div>
                <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-border overflow-x-auto">
                  {JSON.stringify(debugInfo.sampleItems, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Full API Response</div>
              <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-border overflow-x-auto max-h-96">
                {JSON.stringify(debugInfo.response, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* SERP Preview Dialog */}
      <Dialog open={showSerpDialog} onOpenChange={(open) => {
        console.log('🔵 Dialog open changed to:', open, 'selectedKeyword:', selectedKeyword);
        setShowSerpDialog(open);
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
              SERP Analysis: {selectedKeyword?.keyword_data?.keyword || selectedKeyword?.keyword || selectedKeyword?.key || "-"}
            </DialogTitle>
            <DialogDescription>
              Detailed SERP data and keyword metrics
            </DialogDescription>
          </DialogHeader>

          {selectedKeyword ? (
            <div className="space-y-4">
              {/* Keyword Overview */}
              <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Search Volume</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(selectedKeyword.search_volume || 
                        selectedKeyword.keyword_info?.search_volume || 
                        selectedKeyword.keyword_data?.keyword_info?.search_volume || 
                        0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">CPC</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      ${(selectedKeyword.cpc || 
                        selectedKeyword.keyword_info?.cpc || 
                        selectedKeyword.keyword_data?.keyword_info?.cpc || 
                        0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Competition</div>
                    <div className="text-2xl font-bold text-amber-400">
                      {((selectedKeyword.competition || 
                        selectedKeyword.keyword_info?.competition || 
                        selectedKeyword.keyword_data?.keyword_info?.competition || 
                        0) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">SERP Results</div>
                    <div className="text-2xl font-bold">
                      {(selectedKeyword.serp_info?.se_results_count || 
                        selectedKeyword.keyword_data?.serp_info?.se_results_count || 
                        0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>

              {/* SERP Features */}
              {(selectedKeyword.keyword_data?.serp_info?.serp_item_types || 
                selectedKeyword.serp_info?.serp_item_types) && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">SERP Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedKeyword.keyword_data?.serp_info?.serp_item_types || 
                      selectedKeyword.serp_info?.serp_item_types || []).map((feature: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Intent */}
              {(selectedKeyword.keyword_data?.search_intent_info || 
                selectedKeyword.search_intent_info) && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Search Intent</h4>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                    {selectedKeyword.keyword_data?.search_intent_info?.main_intent || 
                     selectedKeyword.search_intent_info?.main_intent || "Unknown"}
                  </Badge>
                </div>
              )}

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

              {/* Monthly Searches Trend */}
              <div>
                <h4 className="text-sm font-semibold mb-4">Monthly Search Trend (Last 12 Months)</h4>
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
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No trend data available for this keyword</p>
                    <p className="text-xs mt-2">Click "Load Trend Data" to fetch historical data</p>
                    <Button
                      onClick={loadMonthlyTrend}
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      disabled={isLoadingTrend}
                    >
                      {isLoadingTrend ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mr-2" />
                      )}
                      Load Trend Data
                    </Button>
                  </div>
                )}
              </div>

              {/* Backlinks Info */}
              {(selectedKeyword.keyword_data?.avg_backlinks_info || 
                selectedKeyword.avg_backlinks_info) && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Average Backlinks (Top Ranking Pages)</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-muted p-3 rounded border border-border">
                      <div className="text-xs text-muted-foreground">Total Backlinks</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {Math.round(selectedKeyword.keyword_data?.avg_backlinks_info?.backlinks || 
                                    selectedKeyword.avg_backlinks_info?.backlinks || 0)}
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded border border-border">
                      <div className="text-xs text-muted-foreground">Dofollow</div>
                      <div className="text-lg font-bold">
                        {Math.round(selectedKeyword.keyword_data?.avg_backlinks_info?.dofollow || 
                                    selectedKeyword.avg_backlinks_info?.dofollow || 0)}
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded border border-border">
                      <div className="text-xs text-muted-foreground">Referring Domains</div>
                      <div className="text-lg font-bold text-blue-400">
                        {Math.round(selectedKeyword.keyword_data?.avg_backlinks_info?.referring_domains || 
                                    selectedKeyword.avg_backlinks_info?.referring_domains || 0)}
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded border border-border">
                      <div className="text-xs text-muted-foreground">Domain Rank</div>
                      <div className="text-lg font-bold text-amber-400">
                        {Math.round(selectedKeyword.keyword_data?.avg_backlinks_info?.main_domain_rank || 
                                    selectedKeyword.avg_backlinks_info?.main_domain_rank || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Check SERP Link */}
              {(selectedKeyword.keyword_data?.serp_info?.check_url || 
                selectedKeyword.serp_info?.check_url) && (
                <div className="pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(
                      selectedKeyword.keyword_data?.serp_info?.check_url || 
                      selectedKeyword.serp_info?.check_url, 
                      '_blank'
                    )}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live SERP Results on Google
                  </Button>
                </div>
              )}
              </div>
              );
            })()
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No keyword selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Debug Panel */}
      <FeatureDebugPanel
        logs={debugLogs}
        featureName="Keyword Research"
        onClear={() => setDebugLogs([])}
      />
    </div>
  );
}

