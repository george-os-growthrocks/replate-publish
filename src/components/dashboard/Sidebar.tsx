import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userEmail?: string;
  onSignOut: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ userEmail, onSignOut, collapsed = false, onToggle }: SidebarProps) {
  const [activeItem, setActiveItem] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "queries", label: "Search Queries", icon: Search },
    { id: "pages", label: "Top Pages", icon: FileText },
    { id: "properties", label: "Properties", icon: Globe },
    { id: "insights", label: "AI Insights", icon: Sparkles },
  ];

  const bottomItems = [
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Search Console</span>
              <span className="text-xs text-muted-foreground">Visualizer</span>
            </div>
          </div>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("h-8 w-8", collapsed && "mx-auto")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userEmail?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeItem === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center px-2"
            )}
            onClick={() => setActiveItem(item.id)}
          >
            <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
          onClick={onSignOut}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}

