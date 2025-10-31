import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Zap, BarChart3, FolderOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardCharts() {
  // Fetch daily credit usage for last 30 days
  const { data: dailyCredits } = useQuery({
    queryKey: ['daily-credit-usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('credit_usage_log')
        .select('credits_used, created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });
      
      if (error || !data) return [];
      
      // Group by date
      const grouped: Record<string, number> = {};
      data.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        grouped[date] = (grouped[date] || 0) + item.credits_used;
      });
      
      return Object.entries(grouped).map(([date, credits]) => ({ date, credits }));
    }
  });

  // Fetch feature usage distribution
  const { data: featureUsage } = useQuery({
    queryKey: ['feature-usage-distribution'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_usage_log')
        .select('feature, credits_used')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error || !data) return [];
      
      // Group by feature
      const grouped: Record<string, number> = {};
      data.forEach(item => {
        const feature = item.feature || 'other';
        grouped[feature] = (grouped[feature] || 0) + item.credits_used;
      });
      
      const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
      return Object.entries(grouped)
        .map(([name, value], idx) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value,
          color: colors[idx % colors.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    }
  });

  // Fetch project activity timeline
  const { data: projectActivity } = useQuery({
    queryKey: ['project-activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('seo_projects')
        .select('name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error || !data) return [];
      
      return data.map(project => ({
        name: project.name,
        created: new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        updated: new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        daysSinceUpdate: Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }));
    }
  });

  const creditChartData = dailyCredits && dailyCredits.length > 0 ? dailyCredits : [
    { date: 'No data', credits: 0 }
  ];

  const featureChartData = featureUsage && featureUsage.length > 0 ? featureUsage : [
    { name: 'No activity yet', value: 1, color: '#94a3b8' }
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3"
        >
          <p className="text-sm font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="shadow-medium hover:shadow-xl transition-shadow">
        <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Platform Usage Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue="credits" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto bg-muted/50">
            <TabsTrigger 
              value="credits" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.div>
              <span className="hidden xs:inline">Credits</span>
            </TabsTrigger>
            <TabsTrigger 
              value="features" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.div>
              <span className="hidden xs:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.div>
              <span className="hidden xs:inline">Projects</span>
            </TabsTrigger>
          </TabsList>

          {/* Credits Usage Tab */}
          <TabsContent value="credits" className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">Daily Credit Usage (Last 30 Days)</h3>
              <div className="min-h-[250px] h-[40vh] max-h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={creditChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="creditsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="credits"
                      stroke="hsl(var(--primary))"
                      fill="url(#creditsGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2 sm:mt-3">
                Track your daily credit consumption patterns
              </p>
            </div>
          </TabsContent>

          {/* Feature Usage Tab */}
          <TabsContent value="features" className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">Feature Usage Distribution</h3>
              <div className="min-h-[250px] h-[40vh] max-h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={featureChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius="70%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {featureChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2 sm:mt-3">
                See which tools you use most frequently
              </p>
            </div>
          </TabsContent>

          {/* Projects Activity Tab */}
          <TabsContent value="projects" className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">Recent Project Activity</h3>
              <div className="space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto">
                {projectActivity && projectActivity.length > 0 ? (
                  projectActivity.map((project, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-sm sm:text-base truncate">{project.name}</span>
                          <Badge 
                            variant={project.daysSinceUpdate < 7 ? 'default' : 'secondary'}
                            className="text-[10px] sm:text-xs flex-shrink-0"
                          >
                            {project.daysSinceUpdate === 0 ? 'Today' : 
                             project.daysSinceUpdate === 1 ? 'Yesterday' :
                             `${project.daysSinceUpdate}d ago`}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Created {project.created} • Updated {project.updated}
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                        <div className="text-xl sm:text-2xl font-bold">{project.daysSinceUpdate}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">days ago</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                    <p className="text-xs sm:text-sm px-4">No projects yet. Create your first project to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </motion.div>
  );
}

