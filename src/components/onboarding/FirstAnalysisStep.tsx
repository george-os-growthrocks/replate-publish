import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingState } from "./OnboardingWizard";
import { Sparkles, BarChart3, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FirstAnalysisStepProps {
  state: OnboardingState;
  onUpdate: (update: Partial<OnboardingState>) => void;
}

interface GSCQueryRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

interface AnalysisResults {
  totalClicks: number;
  totalImpressions: number;
  totalQueries: number;
  totalPages: number;
  opportunities: number;
  avgPosition: string;
}

export function FirstAnalysisStep({ state, onUpdate }: FirstAnalysisStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

  const handleRunAnalysis = async () => {
    if (!state.selectedProperty) {
      toast.error("Please select a property first");
      return;
    }

    setIsAnalyzing(true);
    const startTime = Date.now();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Calculate date range (last 28 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      // Create analysis run record
      const { data: analysisRun, error: createError } = await supabase
        .from('analysis_runs')
        .insert({
          user_id: user.id,
          property_url: state.selectedProperty,
          analysis_type: 'onboarding',
          status: 'running',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (createError) throw createError;

      // Fetch GSC data - Top Queries
      const { data: queriesData, error: queriesError } = await supabase.functions.invoke('gsc-query', {
        body: {
          siteUrl: state.selectedProperty,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: 100,
        },
      });

      if (queriesError) throw queriesError;

      // Fetch GSC data - Top Pages
      const { data: pagesData, error: pagesError } = await supabase.functions.invoke('gsc-query', {
        body: {
          siteUrl: state.selectedProperty,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['page'],
          rowLimit: 100,
        },
      });

      if (pagesError) throw pagesError;

      // Calculate totals and opportunities
      const queries = queriesData?.rows || [];
      const pages = pagesData?.rows || [];
      
      const totalClicks = queries.reduce((sum: number, q: GSCQueryRow) => sum + (q.clicks || 0), 0);
      const totalImpressions = queries.reduce((sum: number, q: GSCQueryRow) => sum + (q.impressions || 0), 0);
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const avgPosition = queries.length > 0 
        ? queries.reduce((sum: number, q: GSCQueryRow) => sum + (q.position || 0), 0) / queries.length 
        : 0;

      // Find opportunities (high impressions, low clicks, position 4-20)
      const opportunities = queries
        .filter((q: GSCQueryRow) => 
          q.impressions > 100 && 
          q.clicks < 10 && 
          q.position >= 4 && 
          q.position <= 20
        )
        .slice(0, 10);

      const topQueries = queries.slice(0, 10);
      const topPages = pages.slice(0, 10);

      // Update analysis run with results
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const { error: updateError } = await supabase
        .from('analysis_runs')
        .update({
          status: 'completed',
          total_clicks: totalClicks,
          total_impressions: totalImpressions,
          avg_ctr: avgCtr,
          avg_position: avgPosition,
          total_queries: queries.length,
          total_pages: pages.length,
          top_queries: topQueries,
          top_pages: topPages,
          opportunities: opportunities,
          duration_seconds: duration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysisRun?.id);

      if (updateError) throw updateError;

      // Store results in state
      setAnalysisResults({
        totalClicks,
        totalImpressions,
        totalQueries: queries.length,
        totalPages: pages.length,
        opportunities: opportunities.length,
        avgPosition: avgPosition.toFixed(1),
      });

      onUpdate({ completedAnalysis: true });
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Failed to complete analysis. You can skip this step.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Run Your First Analysis</h3>
        <p className="text-muted-foreground">
          Get instant insights into your SEO performance
        </p>
      </div>

      {!state.completedAnalysis ? (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Traffic Analysis</h4>
              <p className="text-xs text-muted-foreground">
                See how users find your site
              </p>
            </Card>

            <Card className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 mx-auto mb-3 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Top Keywords</h4>
              <p className="text-xs text-muted-foreground">
                Discover your best performers
              </p>
            </Card>

            <Card className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Quick Wins</h4>
              <p className="text-xs text-muted-foreground">
                Get actionable recommendations
              </p>
            </Card>
          </div>

          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !state.selectedProperty}
            className="w-full gradient-primary"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Quick Analysis
              </>
            )}
          </Button>

          {!state.selectedProperty && (
            <p className="text-xs text-center text-muted-foreground">
              Please select a property in the previous step to run analysis
            </p>
          )}
        </>
      ) : (
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Analysis Complete!</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Your SEO data has been analyzed. Here's what we found:
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {analysisResults?.totalQueries || 0}
                </p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-green-500">
                  {analysisResults?.totalClicks?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">Clicks (28d)</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-amber-500">
                  {analysisResults?.opportunities || 0}
                </p>
                <p className="text-xs text-muted-foreground">Opportunities</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              View detailed insights in your dashboard after setup
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
