import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InsightsPanelProps {
  propertyUrl: string;
  startDate: string;
  endDate: string;
}

interface Insight {
  type: string;
  title: string;
  rationale: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  effort: "LOW" | "MEDIUM" | "HIGH";
  items: any[];
}

const InsightsPanel = ({ propertyUrl, startDate, endDate }: InsightsPanelProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLog(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      setDebugLog([]);
      addDebugLog("🚀 Starting AI Insights generation...");
      addDebugLog(`Property: ${propertyUrl}`);
      addDebugLog(`Date range: ${startDate} to ${endDate}`);
      
      const { data: { session } } = await supabase.auth.getSession();
      addDebugLog(`Session check: ${session ? 'Found' : 'Not found'}`);
      addDebugLog(`Provider token: ${session?.provider_token ? 'Available' : 'Missing'}`);
      
      if (!session?.provider_token) {
        addDebugLog("❌ ERROR: No Google access token");
        toast.error("No Google access token. Please sign out and sign in again.");
        return;
      }

      addDebugLog("📤 Calling gemini-insights function...");
      const requestBody = {
        provider_token: session.provider_token,
        siteUrl: propertyUrl,
        startDate,
        endDate,
      };
      addDebugLog(`Request body: ${JSON.stringify(Object.keys(requestBody))}`);

      const { data, error } = await supabase.functions.invoke("gemini-insights", {
        body: requestBody,
      });

      addDebugLog("📥 Response received");
      addDebugLog(`Response data: ${data ? JSON.stringify(Object.keys(data)) : 'null'}`);
      addDebugLog(`Response error: ${error ? JSON.stringify(error) : 'none'}`);

      if (error) {
        addDebugLog(`❌ Supabase function error: ${JSON.stringify(error)}`);
        throw error;
      }

      if (data?.error) {
        addDebugLog(`❌ API error: ${data.error}`);
        throw new Error(data.error);
      }

      // Log debug info from backend
      if (data?.debug) {
        addDebugLog("=== Backend Debug Info ===");
        addDebugLog(`Model used: ${data.debug.modelUsed}`);
        addDebugLog(`GSC data rows: ${data.debug.dataRows}`);
        addDebugLog(`Gemini response length: ${data.debug.geminiResponseLength}`);
        addDebugLog(`Parsed successfully: ${data.debug.parsedSuccessfully ? '✅ YES - Gemini returned valid JSON!' : '❌ NO - Using intelligent fallback'}`);
        addDebugLog(`Used fallback: ${data.debug.usedFallback ? '⚠️ YES (Gemini response failed to parse)' : '✅ NO (Gemini working perfectly)'}`);
        addDebugLog(`Actions generated: ${data.debug.actionsCount || 'unknown'}`);
        addDebugLog(`Total recommendations: ${data.debug.totalRecommendations || 'unknown'}`);
        
        if (data.debug.geminiResponsePreview) {
          addDebugLog("--- Gemini Response Preview (first 500 chars) ---");
          addDebugLog(data.debug.geminiResponsePreview);
        }
        
        if (data.debug.geminiResponseEnd) {
          addDebugLog("--- Gemini Response End (last 200 chars) ---");
          addDebugLog(data.debug.geminiResponseEnd);
        }
      }

      if (data?.actions) {
        addDebugLog(`✅ Success! Received ${data.actions.length} insights`);
        data.actions.forEach((action: Insight, idx: number) => {
          addDebugLog(`  Insight ${idx + 1}: ${action.type} - ${action.title} (${action.impact} impact, ${action.effort} effort, ${action.items?.length || 0} items)`);
        });
        setInsights(data.actions);
        
        if (data.debug?.usedFallback) {
          toast.warning(`Generated ${data.actions.length} insights (using intelligent fallback)`);
        } else {
          toast.success(`Generated ${data.actions.length} AI insights`);
        }
      } else {
        addDebugLog("⚠️ No actions in response");
        addDebugLog(`Full response: ${JSON.stringify(data)}`);
        toast.warning("No insights generated");
      }
    } catch (error: any) {
      addDebugLog(`❌ ERROR: ${error.message}`);
      if (error.stack) {
        addDebugLog(`Stack: ${error.stack}`);
      }
      console.error("Error fetching insights:", error);
      toast.error(`Failed to generate insights: ${error.message}`);
    } finally {
      setIsLoading(false);
      addDebugLog("🏁 AI Insights generation ended");
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "HIGH":
        return "bg-success/10 text-success";
      case "MEDIUM":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "LOW":
        return "bg-success/10 text-success";
      case "MEDIUM":
        return "bg-warning/10 text-warning";
      default:
        return "bg-destructive/10 text-destructive";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CTR_TEST":
        return TrendingUp;
      case "FIX_TECHNICAL":
        return AlertCircle;
      default:
        return Lightbulb;
    }
  };

  return (
    <Card className="p-6 shadow-card sticky top-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchInsights}
            disabled={isLoading}
            size="sm"
            className="gradient-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
          {debugLog.length > 0 && (
            <Button
              onClick={() => setShowDebug(!showDebug)}
              size="sm"
              variant="outline"
            >
              {showDebug ? "Hide" : "Show"} Debug
            </Button>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && debugLog.length > 0 && (
        <div className="mb-4 p-3 bg-slate-900/50 border border-blue-500/30 rounded-lg max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-blue-300">Debug Log ({debugLog.length} entries)</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugLog([])}
              className="h-6 text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1 font-mono text-xs text-slate-300">
            {debugLog.map((log, idx) => (
              <div key={idx} className={
                log.includes('ERROR') || log.includes('❌') ? 'text-red-300' :
                log.includes('Success') || log.includes('✅') ? 'text-emerald-300' :
                log.includes('⚠️') ? 'text-amber-300' :
                'text-slate-400'
              }>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Click "Generate" to get AI-powered SEO recommendations
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 p-4 border rounded-lg">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = getTypeIcon(insight.type);
          return (
            <div key={index} className="p-4 border rounded-lg space-y-3 hover:shadow-card transition-shadow">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.rationale}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className={getImpactColor(insight.impact)}>
                  Impact: {insight.impact}
                </Badge>
                <Badge variant="outline" className={getEffortColor(insight.effort)}>
                  Effort: {insight.effort}
                </Badge>
              </div>

              {insight.items && insight.items.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {insight.items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {item.query || item.page || item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default InsightsPanel;
