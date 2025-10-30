import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GeminiInsightsOptions {
  keyword: string;
  currentPosition: number;
  clicks: number;
  impressions: number;
  ctr: number;
  positionChange?: number;
  enabled?: boolean;
}

export function useGeminiInsights(options: GeminiInsightsOptions) {
  const { keyword, currentPosition, clicks, impressions, ctr, positionChange, enabled = true } = options;

  return useQuery({
    queryKey: ["gemini-insights", keyword, currentPosition, clicks, impressions, ctr, positionChange],
    queryFn: async () => {
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Please sign in to view insights");
        }

        const { data, error} = await supabase.functions.invoke("keyword-insights", {
          body: {
            keyword,
            currentPosition,
            clicks,
            impressions,
            ctr,
            positionChange,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return data.insights || data;
      } catch (error: any) {
        console.error('Gemini insights error:', error);
        // Return fallback insights if Gemini fails
        return getFallbackInsights(keyword, currentPosition, ctr);
      }
    },
    enabled: enabled && !!keyword,
    staleTime: 30 * 60 * 1000, // 30 minutes - insights don't change often
  });
}

// Fallback insights when Gemini API is unavailable
function getFallbackInsights(keyword: string, position: number, ctr: number) {
  const insights = [];

  // Title optimization
  insights.push({
    type: "title_optimization",
    title: "Optimize Your Title Tag",
    description: `Your current position is ${position.toFixed(1)}. Consider adding power words like "Best", "Guide", or "2025" to improve click-through rate.`,
    priority: position > 10 ? "high" : "medium",
    impact: "high",
  });

  // Content enhancement
  insights.push({
    type: "content_enhancement",
    title: "Enhance Content Quality",
    description: "Add more comprehensive content, include related keywords, and ensure your page fully answers the search intent for this query.",
    priority: ctr < 0.02 ? "high" : "medium",
    impact: "high",
  });

  // Internal linking
  insights.push({
    type: "internal_linking",
    title: "Improve Internal Linking",
    description: "Add internal links to related pages to improve site structure and distribute link equity more effectively.",
    priority: "medium",
    impact: "medium",
  });

  // Schema markup
  insights.push({
    type: "schema_markup",
    title: "Add Schema Markup",
    description: "Implement structured data to help search engines better understand your content and potentially earn rich results.",
    priority: position <= 5 ? "high" : "low",
    impact: "medium",
  });

  return insights;
}
