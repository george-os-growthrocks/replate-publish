import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, TrendingUp, Search, Target, Clock, Zap, Award } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { clusterKeywords, KeywordCluster } from "@/lib/ngram-similarity";
import { groupByQuery } from "@/lib/cannibalization";
import { calculateKeywordDifficulty, analyzeCtr } from "@/lib/seo-algorithms";
import { FeatureDebugPanel, DebugLog } from "@/components/debug/FeatureDebugPanel";

export default function KeywordClusteringPage() {
  const { propertyUrl, dateRange, country, device } = useFilters();
  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
    device,
  });
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<string>("all");
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (level: DebugLog['level'], message: string) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    console.log(`[${level.toUpperCase()}] ${message}`);
    setDebugLogs(prev => [...prev, log]);
  };

  const queries = useMemo(() => {
    if (!rows) return [];
    return groupByQuery(rows);
  }, [rows]);

  // Enhanced clusters with SEO metrics
  const enrichedClusters = useMemo(() => {
    if (!queries || queries.length === 0) return [];
    
    const keywords = queries.map(q => q.query);
    const baseClusters = clusterKeywords(keywords, similarityThreshold);
    
    // Enrich each cluster with SEO algorithms
    return baseClusters.map(cluster => {
      const mainQuery = queries.find(q => q.query === cluster.mainKeyword);
      const clusterQueries = [cluster.mainKeyword, ...cluster.similarKeywords]
        .map(kw => queries.find(q => q.query === kw))
        .filter(Boolean);
      
      // Calculate total metrics for the cluster
      const totalClicks = clusterQueries.reduce((sum, q) => sum + (q?.clicks || 0), 0);
      const totalImpressions = clusterQueries.reduce((sum, q) => sum + (q?.impressions || 0), 0);
      const avgPosition = clusterQueries.length > 0
        ? clusterQueries.reduce((sum, q) => sum + (q?.position || 100), 0) / clusterQueries.length
        : 100;
      
      // Keyword difficulty calculation
      const difficulty = calculateKeywordDifficulty(
        {
          keyword: cluster.mainKeyword,
          searchVolume: totalImpressions,
          difficulty: undefined,
          cpc: 0,
          competition: 0.5,
        },
        {
          avgDomainAuthority: 50, // Default - could be enhanced with actual DA
          avgBacklinks: 100,
          avgContentLength: 2000,
          topRankingPages: 10,
        }
      );
      
      // CTR analysis
      const ctrAnalysis = analyzeCtr({
        currentPosition: Math.round(avgPosition),
        searchVolume: totalImpressions,
        hasRichSnippet: false,
        hasSitelinks: false,
        serpFeatures: [],
      });
      
      // Calculate priority score (0-100)
      // Higher score = better opportunity
      const priorityScore = calculatePriorityScore({
        difficulty: difficulty.difficulty,
        searchVolume: totalImpressions,
        currentPosition: avgPosition,
        clicks: totalClicks,
        ctr: ctrAnalysis.expectedCtr,
      });
      
      return {
        ...cluster,
        metrics: {
          totalClicks,
          totalImpressions,
          avgPosition: Math.round(avgPosition * 10) / 10,
          difficulty: difficulty.difficulty,
          difficultyLevel: difficulty.competitionLevel,
          estimatedTimeToRank: difficulty.estimatedTimeToRank,
          requiredBacklinks: difficulty.requiredBacklinks,
          expectedCtr: ctrAnalysis.expectedCtr,
          potentialClicks: ctrAnalysis.potentialClicks,
          improvementOpportunity: ctrAnalysis.improvementOpportunity,
          priorityScore,
        },
      };
    });
  }, [queries, similarityThreshold]);

  // Helper function to calculate priority score
  function calculatePriorityScore(params: {
    difficulty: number;
    searchVolume: number;
    currentPosition: number;
    clicks: number;
    ctr: number;
  }): number {
    const { difficulty, searchVolume, currentPosition, clicks, ctr } = params;
    
    // Lower difficulty = higher score (inverted)
    const difficultyScore = (100 - difficulty) * 0.3;
    
    // Higher search volume = higher score (normalized)
    const volumeScore = Math.min(100, (searchVolume / 1000) * 10) * 0.25;
    
    // Better position = higher score (inverted, positions 1-20)
    const positionScore = Math.max(0, (21 - currentPosition) / 20 * 100) * 0.25;
    
    // CTR improvement opportunity
    const ctrScore = Math.min(100, ctr * 200) * 0.2;
    
    return Math.round(difficultyScore + volumeScore + positionScore + ctrScore);
  }

  const filteredClusters = useMemo(() => {
    let filtered = enrichedClusters;

    if (searchTerm) {
      filtered = filtered.filter(cluster =>
        cluster.mainKeyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cluster.similarKeywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedIntent !== "all") {
      filtered = filtered.filter(cluster => cluster.intent === selectedIntent);
    }

    // Sort by priority score (highest first)
    return filtered.sort((a, b) => (b.metrics?.priorityScore || 0) - (a.metrics?.priorityScore || 0));
  }, [enrichedClusters, searchTerm, selectedIntent]);

  const intentStats = useMemo(() => {
    const stats = {
      informational: 0,
      navigational: 0,
      transactional: 0,
      commercial: 0,
    };

    enrichedClusters.forEach(cluster => {
      stats[cluster.intent]++;
    });

    return stats;
  }, [enrichedClusters]);

  // Calculate opportunity stats
  const opportunityStats = useMemo(() => {
    const quickWins = enrichedClusters.filter(c => 
      c.metrics && c.metrics.difficulty < 30 && c.metrics.totalImpressions > 100
    ).length;
    
    const highPotential = enrichedClusters.filter(c => 
      c.metrics && c.metrics.potentialClicks > 100
    ).length;
    
    return { quickWins, highPotential };
  }, [enrichedClusters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading GSC data...</p>
        </div>
      </div>
    );
  }

  if (!queries || queries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-12 text-center max-w-md">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Search Queries Found</h3>
          <p className="text-muted-foreground">
            Please select a property and date range to see keyword clusters
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Keyword Clustering</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered keyword grouping with difficulty scoring, time-to-rank estimation, and priority analysis
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Total Clusters
          </div>
          <div className="text-3xl font-bold">{enrichedClusters.length}</div>
        </Card>
        <Card className="p-6 bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/30 dark:border-emerald-500/20">
          <div className="text-sm text-emerald-700 dark:text-emerald-200 mb-1 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Quick Wins
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{opportunityStats.quickWins}</div>
          <div className="text-xs text-emerald-600/80 dark:text-emerald-300/70">Low difficulty</div>
        </Card>
        <Card className="p-6 bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/30 dark:border-amber-500/20">
          <div className="text-sm text-amber-700 dark:text-amber-200 mb-1 flex items-center gap-1">
            <Target className="h-3 w-3" />
            High Potential
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{opportunityStats.highPotential}</div>
          <div className="text-xs text-amber-600/80 dark:text-amber-300/70">100+ clicks</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Informational</div>
          <div className="text-3xl font-bold text-blue-500">{intentStats.informational}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Commercial</div>
          <div className="text-3xl font-bold text-amber-500">{intentStats.commercial}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Transactional</div>
          <div className="text-3xl font-bold text-green-500">{intentStats.transactional}</div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-3 block">
              Similarity Threshold: {(similarityThreshold * 100).toFixed(0)}%
            </label>
            <Slider
              value={[similarityThreshold]}
              onValueChange={(value) => setSimilarityThreshold(value[0])}
              min={0.2}
              max={0.9}
              step={0.05}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Lower = more keywords per cluster, Higher = stricter grouping
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Search Clusters</label>
            <Input
              type="text"
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>
        </div>
      </Card>

      {/* Intent Filter */}
      <Tabs value={selectedIntent} onValueChange={setSelectedIntent} className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({enrichedClusters.length})</TabsTrigger>
          <TabsTrigger value="informational">
            Informational ({intentStats.informational})
          </TabsTrigger>
          <TabsTrigger value="commercial">
            Commercial ({intentStats.commercial})
          </TabsTrigger>
          <TabsTrigger value="transactional">
            Transactional ({intentStats.transactional})
          </TabsTrigger>
          <TabsTrigger value="navigational">
            Navigational ({intentStats.navigational})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Clusters Display */}
      <div className="space-y-4">
        {filteredClusters.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No clusters found matching your filters
            </p>
          </Card>
        ) : (
          filteredClusters.map((cluster, index) => {
            const mainQuery = queries?.find(q => q.query === cluster.mainKeyword);
            const intentColors = {
              informational: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
              commercial: 'bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500/30',
              transactional: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
              navigational: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
            };

            const difficultyColors = {
              low: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
              medium: 'bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500/30',
              high: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
              very_high: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
            };

            const priorityColor = cluster.metrics.priorityScore > 70 
              ? 'text-emerald-400' 
              : cluster.metrics.priorityScore > 50 
                ? 'text-amber-400' 
                : 'text-muted-foreground';

            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-l-4" style={{
                borderLeftColor: cluster.metrics.priorityScore > 70 ? 'rgb(52 211 153)' : 
                                cluster.metrics.priorityScore > 50 ? 'rgb(251 191 36)' : 
                                'rgb(100 116 139)'
              }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold">{cluster.mainKeyword}</h3>
                      <Badge className={intentColors[cluster.intent]}>
                        {cluster.intent}
                      </Badge>
                      <Badge className={difficultyColors[cluster.metrics.difficultyLevel]}>
                        {cluster.metrics.difficultyLevel.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {cluster.similarKeywords.length + 1} keywords
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                      <Award className="h-3 w-3" />
                      Priority Score
                    </div>
                    <div className={`text-3xl font-bold ${priorityColor}`}>
                      {cluster.metrics.priorityScore}
                    </div>
                  </div>
                </div>

                {/* SEO Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-100/80 dark:bg-slate-900/30 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Difficulty
                    </div>
                    <div className="text-lg font-bold">{cluster.metrics.difficulty}/100</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time to Rank
                    </div>
                    <div className="text-lg font-bold">{cluster.metrics.estimatedTimeToRank}mo</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Potential Clicks</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      +{cluster.metrics.potentialClicks.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Position</div>
                    <div className="text-lg font-bold">#{cluster.metrics.avgPosition}</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-100/60 dark:bg-slate-900/20 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Clicks</div>
                    <div className="text-sm font-semibold">{cluster.metrics.totalClicks.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-100/60 dark:bg-slate-900/20 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Impressions</div>
                    <div className="text-sm font-semibold">{cluster.metrics.totalImpressions.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-100/60 dark:bg-slate-900/20 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Expected CTR</div>
                    <div className="text-sm font-semibold">{(cluster.metrics.expectedCtr * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-100/60 dark:bg-slate-900/20 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Backlinks Needed</div>
                    <div className="text-sm font-semibold">{cluster.metrics.requiredBacklinks}</div>
                  </div>
                </div>

                {/* Similar Keywords */}
                {cluster.similarKeywords.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Similar Keywords:</div>
                    <div className="flex flex-wrap gap-2">
                      {cluster.similarKeywords.slice(0, 10).map((keyword, i) => {
                        const similarQuery = queries?.find(q => q.query === keyword);
                        return (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {keyword}
                            {similarQuery && similarQuery.clicks !== undefined && (
                              <span className="ml-1 text-muted-foreground">
                                ({similarQuery.clicks})
                              </span>
                            )}
                          </Badge>
                        );
                      })}
                      {cluster.similarKeywords.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{cluster.similarKeywords.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {filteredClusters.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredClusters.length} of {enrichedClusters.length} clusters • 
          Sorted by Priority Score
        </div>
      )}

      {/* Debug Panel */}
      <FeatureDebugPanel
        logs={debugLogs}
        featureName="Keyword Clustering"
        onClear={() => setDebugLogs([])}
      />
    </div>
  );
}

