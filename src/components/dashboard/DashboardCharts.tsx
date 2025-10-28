import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Legend
} from "recharts";
import { TrendingUp, BarChart3, Globe, Search } from "lucide-react";

// Mock data - replace with real data from your backend
const weeklyCreditsData = [
  { week: 'Week 1', credits: 120 },
  { week: 'Week 2', credits: 185 },
  { week: 'Week 3', credits: 145 },
  { week: 'Week 4', credits: 230 },
];

const trafficSourcesData = [
  { name: 'Organic', value: 65, color: '#8b5cf6' },
  { name: 'Direct', value: 20, color: '#3b82f6' },
  { name: 'Referral', value: 10, color: '#10b981' },
  { name: 'Social', value: 5, color: '#f59e0b' },
];

const rankingTrendsData = [
  { month: 'Apr', position: 15.2 },
  { month: 'May', position: 12.8 },
  { month: 'Jun', position: 10.5 },
  { month: 'Jul', position: 9.2 },
  { month: 'Aug', position: 7.8 },
  { month: 'Sep', position: 6.5 },
  { month: 'Oct', position: 5.2 },
];

const trafficGrowthData = [
  { month: 'Apr', traffic: 1200 },
  { month: 'May', traffic: 1450 },
  { month: 'Jun', traffic: 1680 },
  { month: 'Jul', traffic: 1920 },
  { month: 'Aug', traffic: 2150 },
  { month: 'Sep', traffic: 2480 },
  { month: 'Oct', traffic: 2850 },
];

const topKeywords = [
  { keyword: 'seo tools', position: 3, clicks: 1245, trend: 'up' },
  { keyword: 'keyword research', position: 5, clicks: 892, trend: 'up' },
  { keyword: 'rank tracker', position: 8, clicks: 654, trend: 'stable' },
  { keyword: 'competitor analysis', position: 12, clicks: 445, trend: 'down' },
  { keyword: 'backlink checker', position: 15, clicks: 332, trend: 'up' },
];

export function DashboardCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Traffic
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Keywords
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Weekly Credit Usage</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyCreditsData}>
                    <defs>
                      <linearGradient id="creditsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
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
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficSourcesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trafficSourcesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Ranking Trends (6 Months)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rankingTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      reversed 
                      domain={[0, 20]}
                      label={{ value: 'Average Position', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line
                      type="monotone"
                      dataKey="position"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-3">
                Average position improving from 15.2 to 5.2 over 6 months
              </p>
            </div>
          </TabsContent>

          {/* Traffic Tab */}
          <TabsContent value="traffic" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Traffic Growth Analysis</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trafficGrowthData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="traffic" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-3">
                +137% growth over 6 months
              </p>
            </div>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Top Performing Keywords</h3>
              <div className="space-y-3">
                {topKeywords.map((kw, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold">{kw.keyword}</span>
                        <Badge 
                          variant={kw.trend === 'up' ? 'default' : kw.trend === 'down' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Position #{kw.position} • {kw.clicks.toLocaleString()} clicks
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">#{kw.position}</div>
                      <p className="text-xs text-muted-foreground">Position</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

