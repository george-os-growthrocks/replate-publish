import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins, FolderOpen, FileText, Plug, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { Counter } from "@/components/ui/counter";

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
    { name: 'SEO Intelligence', connected: true },
    { name: 'Google Analytics', connected: false },
    { name: 'Advanced Analytics', connected: false },
  ];

  const connectedAPIs = apiIntegrations.filter(api => api.connected).length;
  
  // Calculate total content generated this month
  const totalContentGenerated = contentActivity?.reduce((sum: number, item: any) => sum + item.value, 0) || 0;

  const cards = [
    { id: 'credits', gradient: 'from-primary/5 to-primary/10', border: 'border-primary/20', icon: Coins, color: 'text-primary' },
    { id: 'projects', gradient: 'from-blue-500/5 to-blue-500/10', border: 'border-blue-500/20', icon: FolderOpen, color: 'text-blue-500' },
    { id: 'content', gradient: 'from-emerald-500/5 to-emerald-500/10', border: 'border-emerald-500/20', icon: FileText, color: 'text-emerald-500' },
    { id: 'api', gradient: 'from-amber-500/5 to-amber-500/10', border: 'border-amber-500/20', icon: Plug, color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* Credits Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={{ y: -4 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-xl transition-shadow group cursor-pointer">
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <CardHeader className="relative pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              </motion.div>
              <span className="truncate">Available Credits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              <Counter value={credits?.available_credits || 0} />
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
      </motion.div>

      {/* SEO Projects Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ y: -4 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 hover:shadow-xl transition-shadow group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate">SEO Projects</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              <Counter value={activeProjects} />
            </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
            {totalProjects} total projects
          </p>
          <motion.div 
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
            </motion.div>
            <span className="text-green-600 dark:text-green-400 font-semibold">+2</span>
            <span className="text-muted-foreground">this month</span>
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Content Generated Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ y: -4 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20 hover:shadow-xl transition-shadow group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
              <span className="truncate">Content Generated</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              <Counter value={totalContentGenerated} />
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
      </motion.div>

      {/* API Integrations Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        whileHover={{ y: -4 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20 hover:shadow-xl transition-shadow group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Plug className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
              <span className="truncate">API Integrations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              {connectedAPIs} / {apiIntegrations.length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
              connected services
            </p>
            <div className="space-y-1">
              {apiIntegrations.slice(0, 2).map((api, idx) => (
                <motion.div 
                  key={idx} 
                  className="flex items-center justify-between text-[10px] sm:text-xs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                >
                  <span className="text-muted-foreground truncate pr-2">{api.name}</span>
                  <motion.div 
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${api.connected ? 'bg-green-500' : 'bg-slate-400'}`}
                    animate={api.connected ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

