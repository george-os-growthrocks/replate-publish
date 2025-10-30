import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription, useCredits, useCreateCheckout } from "@/hooks/useSubscription";
import { useUsageMeters, useMonthlyUsage } from "@/hooks/useUsageMeters";
import { Link } from "react-router-dom";
import { Crown, Zap, Calendar, CreditCard, TrendingUp, ArrowRight, Sparkles, Rocket, Users, FileSearch, Globe, FileText } from "lucide-react";
import { getFeaturesForPlan, getPlanName, type PlanName } from "@/lib/feature-access";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { calculateOverageStatus } from "@/lib/overage-policy";

export function SubscriptionSettings() {
  const { data: subscription, isLoading: isLoadingSub } = useSubscription();
  const { data: credits, isLoading: isLoadingCredits } = useCredits();
  const { data: monthlyUsage } = useMonthlyUsage();
  const { userPlan, isActive } = useFeatureAccess();
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckout();

  if (isLoadingSub || isLoadingCredits) {
    return <div>Loading...</div>;
  }

  const planData = subscription?.plan || (subscription as any)?.subscription_plans;
  const planName = planData?.name || "Free";
  const normalizedPlanName = getPlanName({ name: planName } as any);
  const planIcon = planName === "Growth" || planName === "Pro" ? Crown : 
                  planName === "Agency" ? Rocket : 
                  planName === "Scale" ? Sparkles : 
                  Zap;
  const PlanIcon = planIcon;

  const creditsUsedPercent = credits?.total_credits 
    ? (credits.used_credits / credits.total_credits) * 100 
    : 0;

  // Get plan limits
  const maxSeats = (planData as any)?.max_seats || 1;
  const seatCount = subscription?.seat_count || 1;
  const maxTrackedKeywords = (planData as any)?.max_tracked_keywords_daily || 0;
  const maxCrawlUrls = (planData as any)?.max_crawl_urls_monthly || 0;
  const maxReports = (planData as any)?.max_reports_monthly || 0;

  // Calculate overage status
  const overageStatus = credits ? calculateOverageStatus(credits.used_credits, credits.total_credits) : null;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlanIcon className="w-5 h-5 text-primary" />
            Current Plan: {planName}
          </CardTitle>
          <CardDescription>
            {subscription?.status === 'trialing' ? 'Trial Period' : 
             subscription?.status === 'active' ? 'Active Subscription' : 
             'No Active Subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Billing Cycle</p>
                  <p className="font-semibold capitalize">{subscription.billing_cycle}</p>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>

              {subscription.current_period_end && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Period Ends</p>
                  <p className="font-semibold">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (() => {
                const trialEnd = new Date(subscription.trial_end);
                const daysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysRemaining <= 2;
                
                return (
                  <div className={`p-4 rounded-lg border ${
                    isUrgent 
                      ? "bg-red-500/10 border-red-500/20" 
                      : daysRemaining <= 4
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-primary/10 border-primary/20"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-4 h-4 ${
                        isUrgent ? "text-red-600 dark:text-red-400" :
                        daysRemaining <= 4 ? "text-amber-600 dark:text-amber-400" :
                        "text-primary"
                      }`} />
                      <p className={`font-semibold ${
                        isUrgent ? "text-red-700 dark:text-red-400" :
                        daysRemaining <= 4 ? "text-amber-700 dark:text-amber-400" :
                        "text-foreground"
                      }`}>
                        {daysRemaining === 1 
                          ? "Last Day of Trial!" 
                          : `${daysRemaining} Days Left in Trial`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your free trial ends on {trialEnd.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}. {isUrgent 
                        ? "Add a payment method now to continue your subscription."
                        : "Upgrade now to keep all features after your trial ends."}
                    </p>
                    <Button 
                      size="sm" 
                      className="gradient-primary"
                      onClick={() => {
                        if (planName === 'Launch') {
                          createCheckout({ planName: 'Growth', billingCycle: 'monthly' });
                        } else {
                          createCheckout({ planName: planName, billingCycle: subscription?.billing_cycle || 'monthly' });
                        }
                      }}
                      disabled={isCreatingCheckout}
                    >
                      {isCreatingCheckout ? (
                        <>Processing...</>
                      ) : (
                        <>
                          {isUrgent ? "Add Payment Method" : "Upgrade Plan"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                );
              })()}

              {/* Upgrade Options */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  {normalizedPlanName !== 'Scale' && (
                    <Button 
                      variant="outline" 
                      className="flex-1 gradient-primary"
                      onClick={() => {
                        const nextPlan = normalizedPlanName === 'Free' ? 'Launch' : 
                                       normalizedPlanName === 'Launch' ? 'Growth' :
                                       normalizedPlanName === 'Growth' ? 'Agency' :
                                       'Launch';
                        createCheckout({ 
                          planName: nextPlan, 
                          billingCycle: subscription?.billing_cycle || 'monthly' 
                        });
                      }}
                      disabled={isCreatingCheckout}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {isCreatingCheckout ? 'Processing...' : 
                       normalizedPlanName === 'Free' ? 'Upgrade to Launch' : 
                       normalizedPlanName === 'Launch' ? 'Upgrade to Growth' :
                       normalizedPlanName === 'Growth' ? 'Upgrade to Agency' :
                       'Upgrade Plan'}
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1" disabled>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                </div>

                {/* Available Plans Quick Access */}
                {normalizedPlanName !== 'Scale' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(normalizedPlanName === 'Free' || normalizedPlanName === 'Launch') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (normalizedPlanName === 'Free') {
                            createCheckout({ planName: 'Launch', billingCycle: 'monthly' });
                          } else {
                            createCheckout({ planName: 'Growth', billingCycle: 'monthly' });
                          }
                        }}
                        disabled={isCreatingCheckout}
                      >
                        {normalizedPlanName === 'Free' ? (
                          <>
                            <Zap className="w-3 h-3 mr-1" />
                            Launch $29/mo
                          </>
                        ) : (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            Growth $79/mo
                          </>
                        )}
                      </Button>
                    )}
                    {(normalizedPlanName === 'Free' || normalizedPlanName === 'Launch' || normalizedPlanName === 'Growth') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (normalizedPlanName === 'Free' || normalizedPlanName === 'Launch') {
                            createCheckout({ planName: 'Growth', billingCycle: 'monthly' });
                          } else {
                            createCheckout({ planName: 'Agency', billingCycle: 'monthly' });
                          }
                        }}
                        disabled={isCreatingCheckout}
                      >
                        {normalizedPlanName === 'Free' || normalizedPlanName === 'Launch' ? (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            Growth $79/mo
                          </>
                        ) : (
                          <>
                            <Rocket className="w-3 h-3 mr-1" />
                            Agency $149/mo
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                You're on the free plan with limited features
              </p>
              <Button 
                className="gradient-primary"
                onClick={() => {
                  createCheckout({ planName: 'Launch', billingCycle: 'monthly' });
                }}
                disabled={isCreatingCheckout}
              >
                {isCreatingCheckout ? 'Processing...' : (
                  <>
                    Upgrade to Launch
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Credits Usage</CardTitle>
          <CardDescription>
            Monthly allowance resets on {credits?.last_reset_at ? new Date(credits.last_reset_at).toLocaleDateString() : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Credits Used</span>
              <span className="font-semibold">
                {credits?.used_credits?.toLocaleString() || 0} / {credits?.total_credits?.toLocaleString() || 0}
              </span>
            </div>
            <Progress value={creditsUsedPercent} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {credits?.available_credits?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-amber-500">
                {credits?.used_credits?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground">Used</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {credits?.total_credits?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {overageStatus && overageStatus.shouldWarn && (
            <div className={`p-4 rounded-lg border ${
              overageStatus.threshold === 110 
                ? "bg-red-500/10 border-red-500/20" 
                : overageStatus.threshold === 100
                ? "bg-orange-500/10 border-orange-500/20"
                : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <p className={`text-sm font-semibold mb-1 ${
                overageStatus.threshold === 110 
                  ? "text-red-700 dark:text-red-400"
                  : overageStatus.threshold === 100
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-amber-700 dark:text-amber-400"
              }`}>
                {overageStatus.threshold === 110 
                  ? "Credit Limit Exceeded - Usage Paused"
                  : overageStatus.threshold === 100
                  ? "Credit Limit Reached"
                  : "Running Low on Credits"}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                You've used {overageStatus.percentageUsed.toFixed(0)}% of your monthly allowance
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/pricing">
                  {overageStatus.threshold === 110 ? "Top Up Credits" : "Upgrade for More Credits"}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Meters */}
      {isActive && (maxTrackedKeywords > 0 || maxCrawlUrls > 0 || maxReports > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>
              Your plan's monthly usage limits and current usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {maxTrackedKeywords > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tracked Keywords (Daily)</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {monthlyUsage?.tracked_keywords || 0} / {maxTrackedKeywords}
                  </span>
                </div>
                <Progress 
                  value={maxTrackedKeywords > 0 ? ((monthlyUsage?.tracked_keywords || 0) / maxTrackedKeywords) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            )}
            
            {maxCrawlUrls > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Crawl Budget (Monthly)</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {(monthlyUsage?.crawled_urls || 0).toLocaleString()} / {maxCrawlUrls.toLocaleString()} URLs
                  </span>
                </div>
                <Progress 
                  value={maxCrawlUrls > 0 ? ((monthlyUsage?.crawled_urls || 0) / maxCrawlUrls) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            )}
            
            {maxReports > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Reports (Monthly)</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {monthlyUsage?.reports_rendered || 0} / {maxReports}
                  </span>
                </div>
                <Progress 
                  value={maxReports > 0 ? ((monthlyUsage?.reports_rendered || 0) / maxReports) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seats */}
      {isActive && maxSeats > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Team Seats
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Seat management and team collaboration features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Seats</p>
                <p className="text-2xl font-bold">{seatCount} / {maxSeats}</p>
              </div>
              <Badge variant={seatCount >= maxSeats ? "destructive" : "secondary"}>
                {seatCount >= maxSeats ? 'Limit Reached' : `${maxSeats - seatCount} remaining`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Team features coming soon. Each logged-in user counts as one seat.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plan Features */}
      {planData && planData.features && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>
              {isActive ? `${getFeaturesForPlan(normalizedPlanName).length} features available` : 'Subscribe to unlock features'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {planData.features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            
            {/* Feature Categories */}
            {isActive && (
              <div className="mt-6 pt-6 border-t space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Available Feature Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Research', 'Content', 'Technical', 'Competitive', 'Advanced', 'Reporting'].map((cat) => {
                      const count = getFeaturesForPlan(normalizedPlanName).filter(f => 
                        f.category.toLowerCase() === cat.toLowerCase()
                      ).length;
                      return count > 0 ? (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}: {count}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

