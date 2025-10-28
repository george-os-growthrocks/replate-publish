import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, TrendingUp, Settings, HelpCircle, CreditCard, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, useCredits } from "@/hooks/useSubscription";

export function DashboardRightSidebar() {
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();

  const planName = subscription?.plan?.name || 'Free';
  const isFreePlan = planName === 'Free';

  // Fetch real recent activity
  const { data: recentActivityData } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) return [];
      
      return data.map(activity => ({
        action: activity.activity_description,
        time: getTimeAgo(new Date(activity.created_at)),
        icon: getActivityIcon(activity.activity_type)
      }));
    }
  });

  const recentActivity = recentActivityData && recentActivityData.length > 0 
    ? recentActivityData 
    : [
        { action: 'Welcome to AnotherSEOGuru!', time: 'Just now', icon: '👋' },
        { action: 'Start by creating a project', time: 'Now', icon: '📁' },
      ];
  
  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  function getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'content_generated': '✨',
      'ranking_improved': '🎯',
      'backlink_detected': '🔗',
      'audit_completed': '🔍',
      'project_created': '📁',
      'keyword_tracked': '📊',
    };
    return icons[type] || '📌';
  }

  // AI Insights
  const aiInsights = [
    { 
      title: 'Quick Win Opportunity', 
      description: '3 keywords in position 11-20 with high search volume. Optimize to reach page 1.',
      priority: 'high'
    },
    { 
      title: 'Content Gap Detected', 
      description: 'Competitors rank for 15 keywords you\'re missing. Create content to capture this traffic.',
      priority: 'medium'
    },
    { 
      title: 'Technical Issue', 
      description: '12 pages have slow Core Web Vitals. Fix LCP to improve rankings.',
      priority: 'high'
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* AI Insights */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          {aiInsights.map((insight, idx) => (
            <div 
              key={idx}
              className={`p-3 sm:p-4 rounded-lg border ${
                insight.priority === 'high' 
                  ? 'bg-amber-500/5 border-amber-500/20' 
                  : 'bg-blue-500/5 border-blue-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                <h4 className="font-semibold text-xs sm:text-sm">{insight.title}</h4>
                <Badge 
                  variant={insight.priority === 'high' ? 'default' : 'secondary'}
                  className="text-[10px] sm:text-xs flex-shrink-0"
                >
                  {insight.priority}
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                {insight.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-2 sm:space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                <span className="text-lg sm:text-xl flex-shrink-0">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{activity.action}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card className={isFreePlan ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20" : ""}>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Your Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Plan</span>
              <Badge variant={isFreePlan ? "outline" : "default"}>{planName}</Badge>
            </div>
            {credits && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Credits</span>
                <span className="font-semibold">
                  {credits.available_credits.toLocaleString()} / {credits.total_credits.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {isFreePlan && (
            <>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
                <p className="font-semibold mb-2 text-xs sm:text-sm">Upgrade to Pro</p>
                <ul className="space-y-1 mb-2 sm:mb-3">
                  <li className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span>3,000 credits/month</span>
                  </li>
                  <li className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span>Unlimited keywords</span>
                  </li>
                  <li className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span>White-label reports</span>
                  </li>
                </ul>
                <Button asChild size="sm" className="w-full gradient-primary text-xs sm:text-sm h-8 sm:h-9">
                  <Link to="/pricing">
                    Upgrade Now
                    <ArrowRight className="w-3 h-3 ml-1.5 sm:ml-2" />
                  </Link>
                </Button>
              </div>
            </>
          )}

          {!isFreePlan && subscription && (
            <div className="text-center">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/settings">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button asChild variant="ghost" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm" size="sm">
            <Link to="/settings">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm" size="sm">
            <Link to="/help">
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              Help Center
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm" size="sm">
            <Link to="/pricing">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              View Plans
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

