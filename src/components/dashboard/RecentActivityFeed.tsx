import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Search,
  Target,
  BarChart3,
  Link2,
  Eye,
  Brain,
  FileText,
  Clock,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  feature: string;
  created_at: string;
  credits_used: number;
  metadata?: Record<string, unknown>;
}

const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  competitor_analysis: Target,
  serp_analysis: Eye,
  backlink_analysis: Link2,
  keyword_research: Search,
  content_repurpose: Sparkles,
  seo_ai_chat: Brain,
  site_audit: BarChart3,
  answer_the_public: FileText,
  rank_tracking: Target,
  local_seo: Target,
  shopping_analysis: Eye,
  onpage_seo: FileText,
};

const featureNames: Record<string, string> = {
  competitor_analysis: "Competitor Analysis",
  serp_analysis: "SERP Analysis",
  backlink_analysis: "Backlink Analysis",
  keyword_research: "Keyword Research",
  content_repurpose: "Content Repurpose",
  seo_ai_chat: "AI SEO Chat",
  site_audit: "Site Audit",
  answer_the_public: "Answer The Public",
  rank_tracking: "Rank Tracking",
  local_seo: "Local SEO",
  shopping_analysis: "Shopping Analysis",
  onpage_seo: "On-Page SEO",
};

export function RecentActivityFeed({ limit = 10 }: { limit?: number }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();

    // Subscribe to new activities
    const subscription = supabase
      .channel('activity_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_usage_history',
        },
        (payload) => {
          setActivities(prev => [payload.new as ActivityItem, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [limit]);

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('credit_usage_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Start using features to see your history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = featureIcons[activity.feature] || Sparkles;
              const featureName = featureNames[activity.feature] || activity.feature;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate">{featureName}</p>
                      <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {activity.credits_used}
                      </Badge>
                    </div>

                    {activity.metadata && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {JSON.stringify(activity.metadata).length > 50
                          ? Object.entries(activity.metadata).slice(0, 2).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(' • ')
                          : Object.entries(activity.metadata).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(' • ')
                        }
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
