import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins, FolderOpen, FileText, Plug, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function DashboardMetricsCards() {
  const { data: credits } = useCredits();
  const { data: projects } = useProjects();
  
  // Fetch real credit usage log for the chart
  const { data: creditUsage } = useQuery({
    queryKey: ['credit-usage-weekly'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_usage_log')
        .select('credits_used, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });
      
      if (error) return [];
      
      // Group by day
      const grouped = data.reduce((acc: any, item) => {
        const day = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        acc[day] = (acc[day] || 0) + item.credits_used;
        return acc;
      }, {});
      
      return Object.entries(grouped).map(([day, used]) => ({ day, used }));
    }
  });
  
  // Fetch real activity log for content types
  const { data: contentActivity } = useQuery({
    queryKey: ['content-activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_usage_log')
        .select('feature, credits_used')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) return [];
      
      // Group by feature type
      const grouped = data.reduce((acc: any, item) => {
        const feature = item.feature || 'other';
        acc[feature] = (acc[feature] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(grouped).map(([name, value]) => ({ 
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][Object.keys(grouped).indexOf(name) % 4]
      }));
    }
  });
  
  const activeProjects = projects?.filter(p => p.is_active).length || 0;
  const totalProjects = projects?.length || 0;

  // Use real data or fallback to defaults
  const creditUsageData = creditUsage && creditUsage.length > 0 ? creditUsage : [
    { day: 'Mon', used: 0 },
    { day: 'Tue', used: 0 },
    { day: 'Wed', used: 0 },
    { day: 'Thu', used: 0 },
    { day: 'Fri', used: 0 },
    { day: 'Sat', used: 0 },
    { day: 'Sun', used: 0 },
  ];

  const contentTypeData = contentActivity && contentActivity.length > 0 ? contentActivity : [
    { name: 'No Activity', value: 1, color: '#94a3b8' },
  ];

  const apiIntegrations = [
    { name: 'Google Search Console', connected: true },
    { name: 'DataForSEO', connected: true },
    { name: 'Google Analytics', connected: false },
    { name: 'Ahrefs', connected: false },
  ];

  const connectedAPIs = apiIntegrations.filter(api => api.connected).length;
  
  // Calculate total content generated this month
  const totalContentGenerated = contentActivity?.reduce((sum: number, item: any) => sum + item.value, 0) || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* Credits Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="truncate">Available Credits</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            {credits?.available_credits?.toLocaleString() || 0}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
            of {credits?.total_credits?.toLocaleString() || 0} total
          </p>
          <div className="h-12 sm:h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={creditUsageData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="used"
                  stroke="hsl(var(--primary))"
                  fill="url(#creditGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* SEO Projects Card */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">SEO Projects</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            {activeProjects}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
            {totalProjects} total projects
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
            <span className="text-green-600 dark:text-green-400 font-semibold">+2</span>
            <span className="text-muted-foreground">this month</span>
          </div>
        </CardContent>
      </Card>

      {/* Content Generated Card */}
      <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate">Content Generated</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            {totalContentGenerated}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
            {totalContentGenerated === 0 ? 'No content yet' : 'pieces this month'}
          </p>
          <div className="h-12 sm:h-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={30}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* API Integrations Card */}
      <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <Plug className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
            <span className="truncate">API Integrations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            {connectedAPIs} / {apiIntegrations.length}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
            connected services
          </p>
          <div className="space-y-1">
            {apiIntegrations.slice(0, 2).map((api, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-muted-foreground truncate pr-2">{api.name}</span>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${api.connected ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

