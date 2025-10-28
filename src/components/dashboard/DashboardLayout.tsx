import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFilters } from "@/contexts/FilterContext";
import PropertySelector from "@/components/dashboard/PropertySelector";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandIcon } from "@/components/BrandLogo";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Search,
  Globe,
  Monitor,
  RefreshCw,
  Link as LinkIcon,
  Bell,
  Target,
  MapPin,
  ShoppingCart,
  Gauge,
  Link2,
  Eye,
  Activity,
  Brain,
  Smartphone,
  Key,
  Layers,
  Users,
  Lightbulb,
  AlertCircle,
  Zap,
  FileSearch,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const { dateRange, setDateRange, device, setDevice, country, setCountry, propertyUrl, setPropertyUrl } = useFilters();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setUserEmail(session.user.email || "");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      } else if (session) {
        setUserEmail(session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen border-r border-border bg-background flex flex-col transition-all duration-200",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <BrandIcon size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AnotherSEOGuru</span>
                <span className="text-xs text-muted-foreground">SEO Platform</span>
              </div>
            </div>
          ) : (
            <BrandIcon size="sm" className="mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn("h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted", sidebarCollapsed && "mx-auto")}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                {userEmail?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{userEmail}</p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4 px-2">
            {/* Dashboard */}
            <div>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start rounded-xl text-sm transition-colors",
                  location.pathname === "/dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </Button>
            </div>

            {/* Search Console */}
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Search Console
              </h3>
            )}
            <div className="space-y-1">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/queries" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/queries")}>
                <Search className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Queries</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/pages" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/pages")}>
                <FileText className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Pages</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/countries" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/countries")}>
                <Globe className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Countries</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/devices" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/devices")}>
                <Smartphone className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Devices</span>}
              </Button>
            </div>

            {/* Keywords */}
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Keywords
              </h3>
            )}
            <div className="space-y-1">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/keyword-research" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/keyword-research")}>
                <Key className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Research</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/keyword-clustering" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/keyword-clustering")}>
                <Layers className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Clustering</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/ranking-tracker" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/ranking-tracker")}>
                <TrendingUp className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Rank Tracker</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/serp-analysis" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/serp-analysis")}>
                <Target className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>SERP Analysis</span>}
              </Button>
            </div>

            {/* Competitive */}
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Competitive
              </h3>
            )}
            <div className="space-y-1">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/competitor-analysis" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/competitor-analysis")}>
                <Users className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Competitors</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/content-gap" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/content-gap")}>
                <Lightbulb className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Content Gap</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/cannibalization" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/cannibalization")}>
                <AlertCircle className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Cannibalization</span>}
              </Button>
            </div>

            {/* Link Building */}
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Link Building
              </h3>
            )}
            <div className="space-y-1">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/backlinks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/backlinks")}>
                <Link2 className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Backlinks</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/link-opportunities" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/link-opportunities")}>
                <Zap className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Opportunities</span>}
              </Button>
            </div>

            {/* On-Page & Technical */}
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                On-Page & Technical
              </h3>
            )}
            <div className="space-y-1">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/site-audit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/site-audit")}>
                <Shield className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Site Audit</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/onpage-seo" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/onpage-seo")}>
                <FileSearch className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>OnPage Analysis</span>}
              </Button>
            </div>

            {/* Specialized */}
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Specialized
              </h3>
            )}
            <div className="space-y-1">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/local-seo" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/local-seo")}>
                <MapPin className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Local SEO</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/shopping" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/shopping")}>
                <ShoppingCart className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>E-commerce</span>}
              </Button>
            </div>

            {/* AI Tools */}
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Tools
              </h3>
            )}
            <div className="space-y-1">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/repurpose" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/repurpose")}>
                <Sparkles className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Content Repurpose</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/seo-intelligence" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/seo-intelligence")}>
                <Brain className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Intelligence</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/llm-citations" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/llm-citations")}>
                <Activity className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>LLM Citations</span>}
              </Button>
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/alerts" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/alerts")}>
                <Bell className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Alerts</span>}
              </Button>
            </div>

            {/* Settings */}
            <div className="pt-2 border-t border-border">
              <Button variant="ghost" className={cn("w-full justify-start rounded-xl text-sm transition-colors", location.pathname === "/settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground", sidebarCollapsed && "justify-center px-2")} onClick={() => navigate("/settings")}>
                <Settings className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>Settings</span>}
              </Button>
            </div>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={handleSignOut}
          >
            <LogOut className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar with Filters - Edge to Edge */}
        <div className="sticky top-0 z-40 border-b border-border bg-background backdrop-blur">
          <div className="px-6 py-3 flex items-center gap-3">
            <PropertySelector
              onPropertySelect={setPropertyUrl}
              selectedProperty={propertyUrl}
            />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Select value={device} onValueChange={(v: any) => setDevice(v)}>
              <SelectTrigger className="h-9 w-[130px] rounded-xl hover:bg-muted text-xs">
                <Monitor className="h-3.5 w-3.5 mr-1.5 opacity-80" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Devices</SelectItem>
                <SelectItem value="DESKTOP">Desktop</SelectItem>
                <SelectItem value="MOBILE">Mobile</SelectItem>
                <SelectItem value="TABLET">Tablet</SelectItem>
              </SelectContent>
            </Select>
            {country !== "ALL" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCountry("ALL")}
                className="h-9 rounded-xl hover:bg-muted text-xs"
              >
                Clear Country Filter
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-6 py-6 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}

