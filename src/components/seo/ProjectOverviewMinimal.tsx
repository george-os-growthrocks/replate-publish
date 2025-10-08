import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  TrendingUp,
  Eye,
  MousePointerClick,
  Search,
  Globe,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Brain,
  FileSearch,
  Plus
} from "lucide-react";

interface ProjectOverviewProps {
  projectId: string;
}

interface ProjectData {
  id: string;
  name: string;
  url: string;
  created_at: string;
  keywords_count: number;
  avg_position: number;
  total_clicks: number;
  total_impressions: number;
  ctr: number;
}

export default function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      const { data: project, error: projectError } = await supabase
        .from('seo_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const { count: keywordsCount } = await supabase
        .from('keyword_analysis')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      const { data: rankings } = await supabase
        .from('serp_rankings')
        .select('*')
        .eq('project_id', projectId);

      const avgPosition = rankings?.length ?
        rankings.reduce((sum, r) => sum + (r.position || 0), 0) / rankings.length : 0;

      const totalClicks = 0;
      const totalImpressions = 0;
      const ctr = 0;

      setProjectData({
        id: project.id,
        name: project.name,
        url: project.domain,
        created_at: project.created_at,
        keywords_count: keywordsCount || 0,
        avg_position: Math.round(avgPosition),
        total_clicks: totalClicks,
        total_impressions: totalImpressions,
        ctr: Math.round(ctr * 100) / 100
      });

      const { data: activity } = await supabase
        .from('serp_rankings')
        .select('*')
        .eq('project_id', projectId)
        .order('checked_at', { ascending: false })
        .limit(5);

      setRecentActivity(activity || []);

    } catch (error: any) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error loading project data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPositionChange = (keyword: string) => {
    return null;
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (change > 0) return <ArrowUp className="w-4 h-4 text-success" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-muted rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-2xl border p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground">The requested project could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Enhanced Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {projectData.name}
            </h1>
            <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
              Active
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{projectData.url}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Created {new Date(projectData.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stunning Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Keywords Tracked Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <ArrowUp className="w-4 h-4" />
                <span>12%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Keywords Tracked</p>
              <p className="text-3xl font-bold">{projectData.keywords_count}</p>
            </div>
          </div>
        </div>

        {/* Average Position Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <ArrowUp className="w-4 h-4" />
                <span>2.3</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Avg. Position</p>
              <p className="text-3xl font-bold">{projectData.avg_position}</p>
            </div>
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <MousePointerClick className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <ArrowUp className="w-4 h-4" />
                <span>18.5%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
              <p className="text-3xl font-bold">{projectData.total_clicks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* CTR Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <ArrowUp className="w-4 h-4" />
                <span>5.2%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Click-Through Rate</p>
              <p className="text-3xl font-bold">{projectData.ctr}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border bg-gradient-to-r from-card to-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Latest keyword ranking updates</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              View All
            </Button>
          </div>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Search className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{activity.keyword}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>Position {activity.position}</span>
                        <span>•</span>
                        <span>{new Date(activity.checked_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getChangeIcon(getPositionChange(activity.keyword))}
                    <span className="text-sm font-medium text-muted-foreground">
                      {activity.clicks || 0} clicks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
              <p className="text-muted-foreground mb-6">Start tracking keywords to see activity here.</p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Track Keywords
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border bg-gradient-to-r from-card to-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Jump to key SEO tools and features</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-semibold">Track Keywords</span>
            </button>
            <button className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold">View Analytics</span>
            </button>
            <button className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <FileSearch className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-semibold">Site Audit</span>
            </button>
            <button className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/20 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-sm font-semibold">AI Insights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
