import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription, useCredits, useCreateCheckout } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { Crown, Zap, Calendar, CreditCard, TrendingUp, ArrowRight, Sparkles, Rocket } from "lucide-react";
import { getFeaturesForPlan, getPlanName, type PlanName } from "@/lib/feature-access";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export function SubscriptionSettings() {
  const { data: subscription, isLoading: isLoadingSub } = useSubscription();
  const { data: credits, isLoading: isLoadingCredits } = useCredits();
  const { userPlan, isActive } = useFeatureAccess();
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckout();

  if (isLoadingSub || isLoadingCredits) {
    return <div>Loading...</div>;
  }

  const planData = subscription?.plan || (subscription as any)?.subscription_plans;
  const planName = planData?.name || "Free";
  const planIcon = planName === "Pro" ? Crown : planName === "Agency" ? Sparkles : Zap;
  const PlanIcon = planIcon;

  const creditsUsedPercent = credits?.total_credits 
    ? (credits.used_credits / credits.total_credits) * 100 
    : 0;

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
                    <Button asChild size="sm" className="gradient-primary">
                      <Link to="/pricing">
                        {isUrgent ? "Add Payment Method" : "Upgrade Plan"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                );
              })()}

              {/* Upgrade Options */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  {userPlan !== 'Enterprise' && (
                    <Button 
                      asChild 
                      variant="outline" 
                      className="flex-1 gradient-primary"
                    >
                      <Link to="/pricing">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {userPlan === 'Free' ? 'Upgrade to Starter' : 
                         userPlan === 'Starter' ? 'Upgrade to Pro' :
                         userPlan === 'Pro' ? 'Upgrade to Agency' :
                         'Upgrade Plan'}
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1" disabled>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                </div>

                {/* Available Plans Quick Access */}
                {userPlan !== 'Enterprise' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(userPlan === 'Free' || userPlan === 'Starter') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (userPlan === 'Free') {
                            createCheckout({ planName: 'Starter', billingCycle: 'monthly' });
                          } else {
                            createCheckout({ planName: 'Pro', billingCycle: 'monthly' });
                          }
                        }}
                        disabled={isCreatingCheckout}
                      >
                        {userPlan === 'Free' ? (
                          <>
                            <Zap className="w-3 h-3 mr-1" />
                            Starter $29/mo
                          </>
                        ) : (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            Pro $79/mo
                          </>
                        )}
                      </Button>
                    )}
                    {(userPlan === 'Free' || userPlan === 'Starter' || userPlan === 'Pro') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (userPlan === 'Free' || userPlan === 'Starter') {
                            createCheckout({ planName: 'Pro', billingCycle: 'monthly' });
                          } else {
                            createCheckout({ planName: 'Agency', billingCycle: 'monthly' });
                          }
                        }}
                        disabled={isCreatingCheckout}
                      >
                        {userPlan === 'Free' || userPlan === 'Starter' ? (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            Pro $79/mo
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
              <Button asChild className="gradient-primary">
                <Link to="/pricing">
                  Upgrade to Pro
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
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

          {credits && credits.available_credits < credits.total_credits * 0.2 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold mb-1">
                Running Low on Credits
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                You've used {creditsUsedPercent.toFixed(0)}% of your monthly allowance
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/pricing">
                  Upgrade for More Credits
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Features */}
      {planData && planData.features && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>
              {isActive ? `${getFeaturesForPlan(userPlan).length} features available` : 'Subscribe to unlock features'}
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
                      const count = getFeaturesForPlan(userPlan).filter(f => 
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

