import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { Crown, Zap, Calendar, CreditCard, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

export function SubscriptionSettings() {
  const { data: subscription, isLoading: isLoadingSub } = useSubscription();
  const { data: credits, isLoading: isLoadingCredits } = useCredits();

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

              {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <p className="font-semibold text-blue-700 dark:text-blue-400">Trial Active</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Trial ends on {new Date(subscription.trial_end).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/pricing">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

