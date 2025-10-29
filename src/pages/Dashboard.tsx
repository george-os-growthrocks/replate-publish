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
    // Handle OAuth callback from hash
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      
      if (hash.includes('access_token') && hash.includes('provider_token')) {
        console.log('🔗 OAuth callback detected, processing...');
        
        // Extract all tokens from hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const providerToken = params.get('provider_token');
        const refreshToken = params.get('refresh_token');
        const expiresAt = params.get('expires_at');
        
        console.log('🔑 Tokens found:', {
          accessToken: accessToken ? 'Yes' : 'No',
          providerToken: providerToken ? 'Yes' : 'No',
          refreshToken: refreshToken ? 'Yes' : 'No'
        });
        
        if (accessToken && providerToken) {
          try {
            // Use access token directly to get user info
            const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
            
            if (userError) {
              console.error('❌ Error getting user with access token:', userError);
              return;
            }
            
            if (user) {
              console.log('✅ User authenticated:', user.id);
              
              // Save to database with all available tokens
              const { error } = await supabase.from('user_oauth_tokens').upsert({
                user_id: user.id,
                provider: 'google',
                access_token: providerToken,
                refresh_token: refreshToken,
                expires_at: expiresAt ? new Date(parseInt(expiresAt) * 1000).toISOString() : new Date(Date.now() + 3600 * 1000).toISOString(),
                scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,provider',
                ignoreDuplicates: false
              });
              
              if (error) {
                console.error('❌ Failed to save token:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
              } else {
                console.log('✅ OAuth token saved successfully!');
              }
            }
          } catch (err) {
            console.error('❌ Error processing OAuth:', err);
          }
        }
        
        // Clean up the URL and refresh to update UI
        window.history.replaceState({}, '', '/dashboard');
        console.log('🔄 Refreshing page to update UI...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };
    
    handleOAuthCallback();
    
    // Get user email (only if no OAuth processing)
    if (!window.location.hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserEmail(session?.user?.email || "");
      });
    }
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
