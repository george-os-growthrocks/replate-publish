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
import { Search, Globe, Loader2, Zap } from "lucide-react";
import { KeywordOverviewPanel } from "@/components/keyword-explorer/KeywordOverviewPanel";
import { KeywordIdeasTabs } from "@/components/keyword-explorer/KeywordIdeasTabs";
import { SerpOverviewTable } from "@/components/keyword-explorer/SerpOverviewTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeywordExplorerState } from "@/types/keyword-explorer";

export default function KeywordExplorerPageFull() {
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

  const fetchOverview = async () => {
    setState(prev => ({ ...prev, overviewLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("keyword-overview-bundle", {
        body: {
          keyword: state.seedKeyword,
          location_code: state.locationCode,
          language_code: state.languageCode
        }
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        overview: data.overview,
        overviewLoading: false
      }));
      
      toast.success("Overview loaded!");
    } catch (error) {
      console.error("Error fetching overview:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
  useState(() => {
    if (topResultUrl && !state.trafficPotential) {
      fetchTrafficPotential(topResultUrl);
    }
  });

  const handleKeywordClick = (keyword: string) => {
    setState(prev => ({ ...prev, seedKeyword: keyword }));
    setTimeout(() => handleSearch(), 100);
  };

  const isLoading = state.overviewLoading || state.ideasLoading || state.serpLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Keywords Explorer
          </h1>
          <p className="text-muted-foreground">
            Complete Ahrefs-style keyword research powered by DataForSEO v3
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
        />
      )}

      {/* Welcome State */}
      {!state.overview && !isLoading && (
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-block p-4 bg-primary/10 rounded-full">
              <Zap className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Complete Ahrefs-Style Keywords Explorer</h2>
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
    </div>
  );
}
