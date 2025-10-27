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

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        toast.error("No Google access token. Please sign out and sign in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("gemini-insights", {
        body: {
          provider_token: session.provider_token,
          siteUrl: propertyUrl,
          startDate,
          endDate,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.actions) {
        setInsights(data.actions);
        toast.success(`Generated ${data.actions.length} AI insights`);
      } else {
        toast.warning("No insights generated");
      }
    } catch (error: any) {
      console.error("Error fetching insights:", error);
      toast.error(`Failed to generate insights: ${error.message}`);
    } finally {
      setIsLoading(false);
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
        </div>
      </div>

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
