import { useState } from "react";
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
import { Search, TrendingUp, Lightbulb, Target, Loader2, DollarSign, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const fetchKeywordIdeas = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a seed keyword");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔍 Keyword Ideas Request:", {
        keywords: [seedKeyword],
        location_code: 2840,
        language_code: "en",
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-keyword-ideas", {
        body: {
          keywords: [seedKeyword],
          location_code: 2840,
          language_code: "en",
          limit: 100
        }
      });

      console.log("📦 Keyword Ideas Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ DataForSEO Error:", data.error);
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
        request: { keywords: [seedKeyword], location_code: 2840 },
        response: data,
        itemsFound: items.length,
        sampleItems: items.slice(0, 3),
        availableFields: items.length > 0 ? Object.keys(items[0]) : [],
        firstItemSample: items.length > 0 ? items[0] : null
      });

      setResults(prev => ({ ...prev, ideas: items }));
      
      if (items.length === 0) {
        toast.warning("No keywords found. Check console for details.");
      } else {
        toast.success(`Found ${items.length} keyword ideas`);
      }
    } catch (error: any) {
      console.error("💥 Keyword Ideas Error:", error);
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
        location_code: 2840,
        language_code: "en",
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-keyword-suggestions", {
        body: {
          keyword: seedKeyword,
          location_code: 2840,
          language_code: "en",
          limit: 100
        }
      });

      console.log("📦 Keyword Suggestions Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ DataForSEO Error:", data.error);
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
        request: { keyword: seedKeyword, location_code: 2840 },
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
        location_code: 2840,
        language_code: "en",
        depth: 2,
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-related-keywords", {
        body: {
          keyword: seedKeyword,
          location_code: 2840,
          language_code: "en",
          depth: 2,
          limit: 100
        }
      });

      console.log("📦 Related Keywords Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ DataForSEO Error:", data.error);
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
        request: { keyword: seedKeyword, location_code: 2840, depth: 2 },
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
        location_code: 2840,
        language_code: "en",
        limit: 100
      });

      const { data, error } = await supabase.functions.invoke("dataforseo-labs-keywords-for-site", {
        body: {
          target: targetDomain,
          location_code: 2840,
          language_code: "en",
          limit: 100
        }
      });

      console.log("📦 Competitor Keywords Raw Response:", { data, error });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("❌ DataForSEO Error:", data.error);
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
        request: { target: targetDomain, location_code: 2840 },
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

  const renderKeywordTable = (keywords: KeywordResult[] | undefined) => {
    if (!keywords || keywords.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No keywords found. Try a different search.
        </div>
      );
    }

    // Helper function to extract keyword data from various possible DataForSEO response structures
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
            <TableHead className="text-right">Search Volume</TableHead>
            <TableHead className="text-right">CPC</TableHead>
            <TableHead className="text-right">Competition</TableHead>
            <TableHead className="text-right">Difficulty</TableHead>
            <TableHead className="text-right">SERP Results</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.slice(0, 50).map((kw, idx) => {
            const { keyword, searchVolume, cpc, competition, difficulty, serpResults } = extractKeywordData(kw, idx);
            
            return (
              <TableRow key={idx}>
                <TableCell className="font-medium max-w-md">
                  <div className="truncate" title={keyword || "-"}>
                    {keyword || "-"}
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
                  {cpc !== undefined && cpc !== null ? (
                    <span className="font-medium text-emerald-400">${cpc.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {competition !== undefined && competition !== null ? (
                    <Badge variant={competition > 0.7 ? "destructive" : competition > 0.4 ? "secondary" : "default"}>
                      {(competition * 100).toFixed(0)}%
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {difficulty !== undefined && difficulty !== null ? (
                    <Badge variant={difficulty > 70 ? "destructive" : difficulty > 40 ? "secondary" : "default"}>
                      {difficulty}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {serpResults ? serpResults.toLocaleString() : "-"}
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
        <h1 className="text-3xl font-bold">Keyword Research</h1>
        <p className="text-muted-foreground mt-1">
          Discover new keyword opportunities with DataForSEO Labs
        </p>
      </div>

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
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Keyword Ideas</div>
            <div className="text-2xl font-bold mt-1">{results.ideas?.length || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Suggestions</div>
            <div className="text-2xl font-bold mt-1">{results.suggestions?.length || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Related Keywords</div>
            <div className="text-2xl font-bold mt-1">{results.related?.length || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Competitor Keywords</div>
            <div className="text-2xl font-bold mt-1">{results.competitor?.length || 0}</div>
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
        <Card className="p-6 bg-slate-900/50 border-amber-500/20">
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
              <div className="text-sm text-white bg-slate-950/50 p-2 rounded border border-white/10">
                {debugInfo.type}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Items Found</div>
              <div className="text-sm text-white bg-slate-950/50 p-2 rounded border border-white/10">
                {debugInfo.itemsFound} keywords
              </div>
            </div>

            {debugInfo.availableFields && debugInfo.availableFields.length > 0 && (
              <div>
                <div className="text-xs font-medium text-amber-300 mb-1">
                  🔑 Available Fields in Response
                </div>
                <div className="text-xs text-white bg-slate-950/50 p-3 rounded border border-white/10">
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
                <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-white/10 overflow-x-auto max-h-48">
                  {JSON.stringify(debugInfo.firstItemSample, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Request Payload</div>
              <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-white/10 overflow-x-auto">
                {JSON.stringify(debugInfo.request, null, 2)}
              </pre>
            </div>

            {debugInfo.sampleItems && debugInfo.sampleItems.length > 0 && (
              <div>
                <div className="text-xs font-medium text-amber-300 mb-1">Sample Results (first 3)</div>
                <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-white/10 overflow-x-auto">
                  {JSON.stringify(debugInfo.sampleItems, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Full API Response</div>
              <pre className="text-xs text-white bg-slate-950/50 p-3 rounded border border-white/10 overflow-x-auto max-h-96">
                {JSON.stringify(debugInfo.response, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

