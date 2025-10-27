import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Award,
  Clock,
  BarChart3,
  Eye,
  Loader2
} from 'lucide-react';
import { useGscData } from '@/hooks/useGscData';
import { useFilters } from '@/contexts/FilterContext';
import { AlgorithmDropDetector } from '@/components/seo-intelligence/AlgorithmDropDetector';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SEOIntelligencePage() {
  const { dateRange, selectedProperty } = useFilters();
  const { data: gscData, isLoading } = useGscData(selectedProperty || '', dateRange);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [algorithmDrops, setAlgorithmDrops] = useState<any[]>([]);
  const [isLoadingImpacts, setIsLoadingImpacts] = useState(true);

  // Load real algorithm impacts from database
  useEffect(() => {
    loadAlgorithmImpacts();
  }, [selectedProperty]);

  const loadAlgorithmImpacts = async () => {
    if (!selectedProperty) {
      console.error('❌ No property selected for algorithm analysis');
      toast.error('Please select a property first');
      return;
    }

    console.log('🚀 Starting algorithm impact analysis for:', selectedProperty);
    setIsLoadingImpacts(true);
    
    try {
      console.log('📞 Calling detect-algorithm-impacts edge function...');
      const { data, error } = await supabase.functions.invoke('detect-algorithm-impacts', {
        body: {
          property: selectedProperty,
          days: 365 // Check last year
        }
      });

      console.log('📥 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('❌ API error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Analysis complete. Impacts found:', data?.impacts?.length || 0);

      if (data?.impacts) {
        // Transform impacts to match UI format
        const formattedImpacts = data.impacts.map((impact: any) => ({
          date: impact.algorithmUpdate.update_date,
          severity: impact.severity,
          avgDrop: impact.avgDrop,
          keywords: impact.affectedKeywords,
          trafficLoss: impact.trafficLoss,
          algorithm: impact.algorithmUpdate.name,
          diagnosis: impact.diagnosis,
          actions: impact.actions
        }));
        console.log('📊 Formatted impacts:', formattedImpacts);
        setAlgorithmDrops(formattedImpacts);
        toast.success(`Analysis complete! Found ${formattedImpacts.length} algorithm impacts`);
      } else {
        console.log('✅ No impacts detected (this is good!)');
        setAlgorithmDrops([]);
        toast.success('Analysis complete! No significant algorithm impacts detected.');
      }
    } catch (error) {
      console.error('❌ Error loading algorithm impacts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load algorithm impacts');
      setAlgorithmDrops([]); // Clear any previous data
    } finally {
      setIsLoadingImpacts(false);
    }
  };

  // Debug: Log when algorithm impacts load
  useEffect(() => {
    console.log('Algorithm impacts loaded:', algorithmDrops);
  }, [algorithmDrops]);

  // Calculate AI insights from GSC data
  const insights = useMemo(() => {
    if (!gscData?.queries) return null;

    const topQueries = gscData.queries.slice(0, 10);
    const avgCtr = topQueries.reduce((sum, q) => sum + (q.avgCtr || 0), 0) / topQueries.length;
    const avgPosition = topQueries.reduce((sum, q) => sum + (q.avgPosition || 0), 0) / topQueries.length;
    
    // Quick wins: queries on page 2-3 with high impressions
    const quickWins = gscData.queries.filter(
      q => q.avgPosition > 10 && q.avgPosition <= 30 && q.totalImpressions > 100
    );

    // Declining queries: mock for now
    const declining = gscData.queries.filter((_, idx) => idx % 5 === 0).slice(0, 5);

    // Opportunities: high impressions but low CTR
    const opportunities = gscData.queries.filter(
      q => q.totalImpressions > 500 && q.avgCtr < 0.02
    );

    return {
      avgCtr: avgCtr * 100,
      avgPosition,
      quickWins: quickWins.length,
      declining: declining.length,
      opportunities: opportunities.length,
      totalQueries: gscData.queries.length,
    };
  }, [gscData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          SEO Intelligence
        </h1>
        <p className="text-muted-foreground">
          AI-powered insights, algorithm impact detection, and actionable recommendations
        </p>
      </div>

      {/* Overview Stats */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-primary/70 mb-1">
                <Brain className="h-4 w-4" />
                Intelligence Score
              </div>
              <div className="text-2xl font-bold text-primary">
                {Math.min(100, Math.floor(insights.avgCtr * 10 + 50))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-emerald-200/70 mb-1">
                <Zap className="h-4 w-4" />
                Quick Wins
              </div>
              <div className="text-2xl font-bold text-emerald-300">{insights.quickWins}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-amber-200/70 mb-1">
                <Target className="h-4 w-4" />
                Opportunities
              </div>
              <div className="text-2xl font-bold text-amber-300">{insights.opportunities}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-red-200/70 mb-1">
                <AlertTriangle className="h-4 w-4" />
                Declining
              </div>
              <div className="text-2xl font-bold text-red-300">{insights.declining}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950/80 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                Avg Position
              </div>
              <div className="text-2xl font-bold">{insights.avgPosition.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950/80 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Eye className="h-4 w-4" />
                Avg CTR
              </div>
              <div className="text-2xl font-bold">{insights.avgCtr.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="algorithm" className="space-y-4">
        <TabsList>
          <TabsTrigger value="algorithm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Algorithm Impact
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Recommendations
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            Deep Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="algorithm" className="space-y-4">
          <Card className="bg-slate-950/80 border-white/10 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Algorithm Impact Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Analyzes your GSC data for ranking drops around 14 known Google algorithm updates (2023-2025)
                </p>
              </div>
              <Button 
                onClick={loadAlgorithmImpacts} 
                disabled={isLoadingImpacts || !selectedProperty}
                className="ml-4"
              >
                {isLoadingImpacts ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isLoadingImpacts ? 'Analyzing...' : 'Analyze Now'}
              </Button>
            </div>
          </Card>
          
          {isLoadingImpacts ? (
            <Card className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Analyzing Algorithm Impacts...</h3>
              <p className="text-sm text-muted-foreground">
                Checking your GSC data against 14 Google algorithm updates from 2023-2025.
                <br />
                This may take 10-30 seconds.
              </p>
            </Card>
          ) : (
            <AlgorithmDropDetector drops={algorithmDrops} />
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card className="bg-slate-950/80 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Personalized action items to improve your SEO performance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">AI Recommendations Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're analyzing your GSC data to generate personalized SEO recommendations.
                <br />
                Check the <strong>Algorithm Impact</strong> tab for immediate insights.
              </p>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Feature Under Development
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="bg-slate-950/80 border-white/10 p-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Deep Insights Coming Soon</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced performance health scoring and traffic forecasting features are under development.
              <br />
              For now, check the <strong>Algorithm Impact</strong> tab for actionable insights.
            </p>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Feature Under Development
            </Badge>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

