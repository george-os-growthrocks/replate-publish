import { LayoutDashboard, Search, BarChart as BarChart3, Target, FileText, Link2, Globe, Zap, TrendingUp, Calendar, Settings, Upload, Sparkles, Bell, Brain, Mic, MapPin, DollarSign, FileSearch, BarChart, CircleHelp as HelpCircle, Users, Database } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface SEOSidebarProps {
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export function SEOSidebar({ onTabChange, activeTab }: SEOSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const overviewReportingItems = [
    { id: "overview", title: "Dashboard", icon: LayoutDashboard, color: "text-blue-600 dark:text-blue-400" },
    { id: "analytics", title: "Analytics Hub", icon: BarChart, color: "text-emerald-600 dark:text-emerald-400" },
    { id: "seo-report", title: "SEO Report", icon: FileSearch, color: "text-amber-600 dark:text-amber-400" },
  ];

  const aiIntelligenceItems = [
    { id: "ai-recommendations", title: "AI Recommendations", icon: Sparkles, color: "text-violet-600 dark:text-violet-400" },
    { id: "content-strategy", title: "Content Strategy", icon: Brain, color: "text-pink-600 dark:text-pink-400" },
    { id: "predictive-analytics", title: "Predictions & Forecasting", icon: TrendingUp, color: "text-cyan-600 dark:text-cyan-400" },
    { id: "serp-optimizer", title: "SERP Intelligence", icon: Target, color: "text-orange-600 dark:text-orange-400" },
  ];

  const keywordsRankingsItems = [
    { id: "keyword-research", title: "Keyword Research", icon: Search, color: "text-blue-600 dark:text-blue-400" },
    { id: "serp", title: "Rank Tracking", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
    { id: "competitors", title: "Competitor Analysis", icon: BarChart3, color: "text-red-600 dark:text-red-400" },
    { id: "opportunities", title: "Opportunities", icon: Zap, color: "text-yellow-600 dark:text-yellow-400" },
  ];

  const contentTechnicalItems = [
    { id: "calendar", title: "Content Calendar", icon: Calendar, color: "text-indigo-600 dark:text-indigo-400" },
    { id: "content-gaps", title: "Content Gaps", icon: Target, color: "text-purple-600 dark:text-purple-400" },
    { id: "content", title: "Content Score", icon: FileText, color: "text-teal-600 dark:text-teal-400" },
    { id: "audit", title: "Site Audit", icon: Globe, color: "text-rose-600 dark:text-rose-400" },
    { id: "backlinks", title: "Backlinks & Links", icon: Link2, color: "text-sky-600 dark:text-sky-400" },
    { id: "internal-linking", title: "Internal Linking", icon: Link2, color: "text-lime-600 dark:text-lime-400" },
  ];

  const integrationsSettingsItems = [
    { id: "integrations", title: "Google Tools", icon: Globe, color: "text-blue-600 dark:text-blue-400" },
    { id: "dataforseo-test", title: "API Settings", icon: Database, color: "text-slate-600 dark:text-slate-400" },
    { id: "multi-location", title: "Multi-Location", icon: MapPin, color: "text-green-600 dark:text-green-400" },
    { id: "revenue", title: "Revenue Attribution", icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400" },
  ];

  const isActive = (id: string) => activeTab === id;

  const renderMenuItems = (items: typeof overviewReportingItems) => (
    <SidebarMenu className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.id);
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              onClick={() => onTabChange(item.id)}
              className={`
                group relative flex items-center gap-3 rounded-xl px-4 py-3.5
                transition-all duration-200 ease-in-out
                ${active
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'hover:bg-accent/50 text-foreground hover:scale-[1.01]'
                }
              `}
            >
              <div className={`
                flex items-center justify-center w-9 h-9 rounded-lg
                transition-all duration-200
                ${active
                  ? 'bg-white/20 text-white'
                  : `bg-accent/50 ${item.color} group-hover:bg-accent`
                }
              `}>
                <Icon className="w-5 h-5" />
              </div>
              {!collapsed && (
                <span className={`
                  text-sm font-semibold truncate transition-colors
                  ${active ? 'text-white' : 'text-foreground'}
                `}>
                  {item.title}
                </span>
              )}
              {active && !collapsed && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar
      className={`
        ${collapsed ? "w-20" : "w-80"}
        border-r border-border bg-sidebar
        transition-all duration-300 ease-in-out
      `}
      collapsible="icon"
    >
      <SidebarContent className="mt-16 py-6 px-3 space-y-8 overflow-y-auto">
        {/* Overview & Reporting */}
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className={`
            px-4 py-2 text-xs font-bold uppercase tracking-wider
            text-muted-foreground
            ${collapsed ? 'text-center' : ''}
          `}>
            {collapsed ? '•' : 'Overview'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(overviewReportingItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI-Powered Intelligence */}
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className={`
            px-4 py-2 text-xs font-bold uppercase tracking-wider
            text-muted-foreground
            ${collapsed ? 'text-center' : ''}
          `}>
            {collapsed ? '•' : 'AI Intelligence'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(aiIntelligenceItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Keywords & Rankings */}
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className={`
            px-4 py-2 text-xs font-bold uppercase tracking-wider
            text-muted-foreground
            ${collapsed ? 'text-center' : ''}
          `}>
            {collapsed ? '•' : 'Keywords'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(keywordsRankingsItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content & Technical */}
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className={`
            px-4 py-2 text-xs font-bold uppercase tracking-wider
            text-muted-foreground
            ${collapsed ? 'text-center' : ''}
          `}>
            {collapsed ? '•' : 'Content'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(contentTechnicalItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Integrations & Settings */}
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className={`
            px-4 py-2 text-xs font-bold uppercase tracking-wider
            text-muted-foreground
            ${collapsed ? 'text-center' : ''}
          `}>
            {collapsed ? '•' : 'Settings'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(integrationsSettingsItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
