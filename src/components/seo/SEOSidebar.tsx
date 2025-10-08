import { LayoutDashboard, Search, ChartBar as BarChart3, Target, FileText, Link2, Globe, Zap, TrendingUp, Calendar, Settings, Upload, Sparkles, Bell, Brain, Mic, MapPin, DollarSign, FileSearch, ChartBar as BarChart, CircleHelp as HelpCircle, Users, Database } from "lucide-react";
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

  // ✅ CONSOLIDATED SIDEBAR - Phase 1 Cleanup
  const overviewReportingItems = [
    { id: "overview", title: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", title: "Analytics Hub", icon: BarChart }, // Merged analytics + advanced
    { id: "seo-report", title: "SEO Report", icon: FileSearch },
  ];

  const aiIntelligenceItems = [
    { id: "ai-recommendations", title: "AI Recommendations", icon: Sparkles },
    { id: "content-strategy", title: "Content Strategy", icon: Brain },
    { id: "predictive-analytics", title: "Predictions & Forecasting", icon: TrendingUp }, // Merged predictions
    { id: "serp-optimizer", title: "SERP Intelligence", icon: Target }, // Merged SERP tools
  ];

  const keywordsRankingsItems = [
    { id: "keyword-research", title: "Keyword Research", icon: Search }, // Unified view
    { id: "serp", title: "Rank Tracking", icon: TrendingUp },
    { id: "competitors", title: "Competitor Analysis", icon: BarChart3 },
    { id: "opportunities", title: "Opportunities", icon: Zap },
  ];

  const contentTechnicalItems = [
    { id: "calendar", title: "Content Calendar", icon: Calendar },
    { id: "content-gaps", title: "Content Gaps", icon: Target },
    { id: "content", title: "Content Score", icon: FileText },
    { id: "audit", title: "Site Audit", icon: Globe },
    { id: "backlinks", title: "Backlinks & Links", icon: Link2 },
    { id: "internal-linking", title: "Internal Linking", icon: Link2 },
  ];

  const integrationsSettingsItems = [
    { id: "integrations", title: "Google Tools", icon: Globe },
    { id: "dataforseo-test", title: "API Settings", icon: Database },
    { id: "multi-location", title: "Multi-Location", icon: MapPin },
    { id: "revenue", title: "Revenue Attribution", icon: DollarSign },
  ];

  const isActive = (id: string) => activeTab === id;

  const renderMenuItems = (items: typeof overviewReportingItems) => (
    <SidebarMenu className="space-y-1 px-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              onClick={() => onTabChange(item.id)}
              className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                isActive(item.id) 
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${
                isActive(item.id) ? 'text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400'
              }`} />
              {!collapsed && (
                <span className={`text-sm font-medium ${
                  isActive(item.id) ? 'text-white dark:text-gray-900' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {item.title}
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-80"} border-r bg-white dark:bg-gray-900`} collapsible="icon">
      <SidebarContent className="mt-30 pt-6 space-y-6 px-3">
        {/* Overview & Reporting */}
        <SidebarGroup className="space-y-3">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Overview & Reporting
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(overviewReportingItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI-Powered Intelligence */}
        <SidebarGroup className="space-y-3">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            AI Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(aiIntelligenceItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Keywords & Rankings */}
        <SidebarGroup className="space-y-3">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Keywords & Rankings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(keywordsRankingsItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content & Technical */}
        <SidebarGroup className="space-y-3">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Content & Technical
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(contentTechnicalItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Integrations & Settings */}
        <SidebarGroup className="space-y-3">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Integrations & Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(integrationsSettingsItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
