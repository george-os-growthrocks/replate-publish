import { useEffect, useState } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { DashboardMetricsCards } from "@/components/dashboard/DashboardMetricsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardRightSidebar } from "@/components/dashboard/DashboardRightSidebar";
import { useSubscription } from "@/hooks/useSubscription";
 
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const { data: subscription, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useSubscription();

  // Calculate trial days remaining
  const isTrialing = subscription?.status === 'trialing' && subscription?.trial_end;
  const trialDaysRemaining = isTrialing && subscription.trial_end
    ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;


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

      {/* Trial Status Banner */}
      {isTrialing && trialDaysRemaining !== null && trialDaysRemaining > 0 && (
        <Alert className={trialDaysRemaining <= 2 
          ? "border-red-500/20 bg-red-500/10" 
          : trialDaysRemaining <= 4
          ? "border-amber-500/20 bg-amber-500/10"
          : "border-primary/20 bg-primary/10"
        }>
          <Clock className={trialDaysRemaining <= 2 ? "h-4 w-4 text-red-600 dark:text-red-400" :
            trialDaysRemaining <= 4 ? "h-4 w-4 text-amber-600 dark:text-amber-400" :
            "h-4 w-4 text-primary"} />
          <AlertTitle className={trialDaysRemaining <= 2 ? "text-red-700 dark:text-red-400" :
            trialDaysRemaining <= 4 ? "text-amber-700 dark:text-amber-400" :
            "text-foreground"}>
            {trialDaysRemaining === 1 
              ? "Last Day of Free Trial!" 
              : `${trialDaysRemaining} Days Left in Your Free Trial`}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className={trialDaysRemaining <= 2 ? "text-red-700/80 dark:text-red-300" :
              trialDaysRemaining <= 4 ? "text-amber-700/80 dark:text-amber-300" :
              "text-muted-foreground"}>
              {trialDaysRemaining <= 2 
                ? "Your trial ends tomorrow. Add a payment method to keep all features."
                : trialDaysRemaining <= 4
                ? "Your trial ends soon. Upgrade now to continue enjoying all Starter plan features."
                : `You're on a 7-day free trial of the Starter plan. Full access to 500 credits and all features.`}
            </span>
            <Button asChild size="sm" className="gradient-primary whitespace-nowrap">
              <Link to="/pricing">
                {trialDaysRemaining <= 2 ? "Add Payment Method" : "Upgrade Now"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
