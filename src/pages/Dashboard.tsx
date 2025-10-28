import { useEffect, useState } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
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
      
      {/* Metrics Cards */}
      <DashboardMetricsCards />

      {/* Charts Section with Real Data */}
      <DashboardCharts />

      {/* Right Sidebar - Desktop shows sidebar, Mobile shows tabs */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-12 text-center">
            <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Your SEO Command Center</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Navigate to specific tools using the sidebar, or check your SEO Report for Google Search Console insights.
              </p>
            </div>
          </Card>
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
