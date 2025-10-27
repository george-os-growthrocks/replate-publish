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

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "queries", label: "Search Queries", icon: Search, path: "/queries" },
    { id: "pages", label: "Pages", icon: FileText, path: "/pages" },
    { id: "countries", label: "Countries", icon: Globe, path: "/countries" },
    { id: "devices", label: "Devices", icon: Monitor, path: "/devices" },
    { id: "cannibalization", label: "Cannibalization", icon: Sparkles, path: "/cannibalization" },
    { id: "link-opportunities", label: "Link Opportunities", icon: LinkIcon, path: "/link-opportunities" },
    { id: "keyword-research", label: "Keyword Research", icon: TrendingUp, path: "/keyword-research" },
    { id: "competitor-analysis", label: "Competitor Analysis", icon: Target, path: "/competitor-analysis" },
    { id: "local-seo", label: "Local SEO", icon: MapPin, path: "/local-seo" },
    { id: "shopping", label: "Shopping", icon: ShoppingCart, path: "/shopping" },
    { id: "onpage-seo", label: "OnPage SEO", icon: Gauge, path: "/onpage-seo" },
    { id: "backlinks", label: "Backlinks", icon: Link2, path: "/backlinks" },
    { id: "serp-analysis", label: "SERP Analysis", icon: Eye, path: "/serp-analysis" },
    { id: "site-audit", label: "Site Audit", icon: BarChart3, path: "/site-audit" },
    { id: "repurpose", label: "Repurpose Content", icon: RefreshCw, path: "/repurpose" },
    { id: "keyword-clustering", label: "Keyword Clustering", icon: Sparkles, path: "/keyword-clustering" },
    { id: "content-gap", label: "Content Gap Analysis", icon: Target, path: "/content-gap" },
    { id: "ranking-tracker", label: "Ranking Tracker", icon: Activity, path: "/ranking-tracker" },
    { id: "seo-intelligence", label: "SEO Intelligence", icon: Brain, path: "/seo-intelligence" },
    { id: "alerts", label: "Alerts", icon: Bell, path: "/alerts" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

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

  const activeItem = menuItems.find((item) => item.path === location.pathname)?.id || "dashboard";

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
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide text-foreground">Search Console</span>
                <span className="text-xs text-muted-foreground">CRM</span>
              </div>
            </div>
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
        <nav className="flex-1 overflow-y-auto p-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-xl text-sm transition-colors",
                activeItem === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={cn("h-[18px] w-[18px]", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
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

