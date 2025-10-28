import { useEffect, useState } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DashboardMetricsCards } from "@/components/dashboard/DashboardMetricsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardRightSidebar } from "@/components/dashboard/DashboardRightSidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || "");
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      {userEmail && <DashboardHero userEmail={userEmail} />}
      
      {/* Quick Actions */}
      <QuickActions />
      
      {/* Metrics Cards */}
      <DashboardMetricsCards />

      {/* Charts Section with Real Data */}
      <DashboardCharts />

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <RecentActivityFeed limit={15} />
        </div>
        
        {/* Desktop: Traditional Sidebar */}
        <div className="hidden lg:block">
          <DashboardRightSidebar />
        </div>
      </div>

      {/* Mobile: Tabs for Sidebar Content */}
      <div className="lg:hidden">
        <DashboardRightSidebar />
      </div>
    </div>
  );
};

export default Dashboard;
