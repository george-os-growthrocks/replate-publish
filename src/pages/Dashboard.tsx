import { useEffect, useState } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardMetricsCards } from "@/components/dashboard/DashboardMetricsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardRightSidebar } from "@/components/dashboard/DashboardRightSidebar";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
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

      {/* Right Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Your SEO Command Center</h3>
              <p className="text-muted-foreground">
                Navigate to specific tools using the sidebar, or check your SEO Report for Google Search Console insights.
              </p>
            </div>
          </Card>
        </div>
        
        <div>
          <DashboardRightSidebar />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
