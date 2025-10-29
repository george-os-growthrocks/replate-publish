import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Zap, Crown, Rocket, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreateCheckout, useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDebugLog } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { UserSubscription, SubscriptionPlan as HookSubscriptionPlan } from "@/hooks/useSubscription";

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
type Json = Database['public']['Tables']['subscription_plans']['Row']['features'];

const iconMap = {
  'Starter': Zap,
  'Professional': Crown,
  'Agency': Rocket,
  'Enterprise': Rocket
};

const getPlanIcon = (planName: string) => {
  return iconMap[planName as keyof typeof iconMap] || Rocket;
};

const formatFeatures = (features: Json | string[], planName: string, credits: number, maxProjects: number) => {
  // Convert Json or string array to string array safely
  let featureList: string[] = [];
  
  if (Array.isArray(features)) {
    // Handle both string[] and Json (which might be stored as string array)
    if (features.every(item => typeof item === 'string')) {
      featureList = [...features as string[]];
    }
  }
  
  // Add dynamic features based on plan data
  if (credits > 0) {
    featureList.unshift(`${credits.toLocaleString()} credits/month`);
  }
  if (maxProjects > 0) {
    featureList.unshift(`${maxProjects} SEO projects`);
  }
  
  return featureList;
};

// Fallback plans in case database fails
const fallbackPlans: SubscriptionPlan[] = [
  {
    id: 'starter-fallback',
    name: 'Starter',
    stripe_product_id: null,
    stripe_price_id: null,
    price_monthly: 29,
    price_yearly: 290,
    features: ['All SEO Tools', 'Social Media SEO', 'SERP Preview', 'Email Support', 'Keyword Research', 'Rank Tracking', 'Site Audit', 'Backlink Analysis', 'Competitor Analysis', '7-Day Free Trial'] as unknown as Json,
    limits: { max_keywords: 500, max_reports: 50 },
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_price_id_monthly: 'price_starter_monthly',
    stripe_price_id_yearly: 'price_starter_yearly',
    credits_per_month: 500,
    max_projects: 3,
    max_team_members: 1,
    has_ai_tools: false,
    has_api_access: false,
    has_team_features: false,
    has_white_label: false,
    has_unlimited_credits: false
  },
  {
    id: 'professional-fallback',
    name: 'Professional',
    stripe_product_id: null,
    stripe_price_id: null,
    price_monthly: 79,
    price_yearly: 790,
    features: ['Everything in Starter', 'GA4 Analytics', 'Unlimited Keywords', 'Content Repurpose (200 generations)', 'Site Audit (5 sites)', 'Competitor Analysis (10 competitors)', 'Backlink Analysis', 'Local SEO Suite', 'Priority Support', 'White-Label Reports', 'Export Reports', '7-Day Free Trial'] as unknown as Json,
    limits: { max_keywords: 2000, max_reports: 500 },
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_price_id_monthly: 'price_pro_monthly',
    stripe_price_id_yearly: 'price_pro_yearly',
    credits_per_month: 1500,
    max_projects: 10,
    max_team_members: 5,
    has_ai_tools: true,
    has_api_access: false,
    has_team_features: false,
    has_white_label: true,
    has_unlimited_credits: false
  },
  {
    id: 'agency-fallback',
    name: 'Agency',
    stripe_product_id: null,
    stripe_price_id: null,
    price_monthly: 149,
    price_yearly: 1490,
    features: ['Everything in Professional', 'White-label Reports', 'Team Collaboration', 'API Access', 'Advanced Analytics', 'Custom Dashboards', 'Multi-location Tracking', 'Priority Phone Support', 'Dedicated Account Manager', 'Custom Integrations', '7-Day Free Trial'] as unknown as Json,
    limits: { max_keywords: 10000, max_reports: -1 },
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_price_id_monthly: 'price_agency_monthly',
    stripe_price_id_yearly: 'price_agency_yearly',
    credits_per_month: 3500,
    max_projects: 50,
    max_team_members: 20,
    has_ai_tools: true,
    has_api_access: true,
    has_team_features: true,
    has_white_label: true,
    has_unlimited_credits: true
  },
  {
    id: 'enterprise-fallback',
    name: 'Enterprise',
    stripe_product_id: null,
    stripe_price_id: null,
    price_monthly: 299,
    price_yearly: 2990,
    features: ['Everything in Agency', 'Custom Integration', 'SLA Guarantee', 'Custom Limits', 'Unlimited Projects', 'Unlimited Team Members', 'White-glove Support', 'Priority Development', 'Custom Training', 'Dedicated Success Manager', '7-Day Free Trial'] as unknown as Json,
    limits: { max_keywords: -1, max_reports: -1 },
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_price_id_monthly: 'price_enterprise_monthly',
    stripe_price_id_yearly: 'price_enterprise_yearly',
    credits_per_month: 10000,
    max_projects: 100,
    max_team_members: 50,
    has_ai_tools: true,
    has_api_access: true,
    has_team_features: true,
    has_white_label: true,
    has_unlimited_credits: true
  }
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckout();
  const { data: subscription } = useSubscription();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[CHECKOUT DEBUG] ${message}`);
  };

  // Use fallback plans directly (database API is not working)
  const plans = fallbackPlans;
  const isLoading = false;
  const error = null;
  const refetch = () => window.location.reload();

  const handleSelectPlan = (planName: string) => {
    // Stripe checkout is skipped for now - just signup
    // Store plan selection for future use
    localStorage.setItem('selected_plan', planName);
    localStorage.setItem('selected_billing', billingCycle);
    
    // Redirect to signup if not authenticated
    if (!subscription) {
      addLog(`Redirecting to signup...`);
      window.location.href = '/signup';
      return;
    }
    
    // If already logged in, just go to dashboard
    addLog(`Already logged in, going to dashboard...`);
    window.location.href = '/dashboard';
  };

  const calculateSavings = (monthly: number, yearly: number | null) => {
    if (!yearly) return '';
    const yearlyMonthly = yearly / 10; // 10 months paid
    const savings = ((monthly * 12 - yearly) / (monthly * 12) * 100).toFixed(0);
    return `Save ${savings}% (2 months free)`;
  };

  return (
    <section id="pricing">
      {/* Hero Section */}
      <div className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            7-Day Free Trial on All Plans
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pricing for Everyone
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your business. Scale as you grow with flexible pricing and powerful features.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>7-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>No Setup Fees</span>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="ml-2">Save 17%</Badge>
          </div>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">

        {/* Free Plan Banner */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative p-6 md:p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold">
              🎉 Free Forever Plan
            </div>
            <div className="text-center mb-6 mt-2">
              <h3 className="text-2xl font-bold text-foreground mb-2">Start Free - No Credit Card Required</h3>
              <p className="text-muted-foreground">Get started with our free plan and upgrade when you're ready</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">5 Essential SEO Tools</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">100 Credits One-time</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">1 SEO Project</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Basic Keyword Research</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Community Support</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">100 Keyword Tracking</span>
              </div>
            </div>
            <div className="flex justify-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary shadow-lg">
                  Sign Up Free - Start Now
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium text-foreground mb-2">Loading pricing plans...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch the latest pricing information.</p>
            <Button 
              onClick={() => refetch()} 
              className="mt-4"
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-destructive mb-2">Unable to load pricing plans</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Please try again later.'}
            </p>
            <Button 
              onClick={() => refetch()} 
              className="mt-2"
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-foreground mb-2">No pricing plans available</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please contact support for assistance.
            </p>
            <Button 
              onClick={() => refetch()} 
              className="mt-2"
              variant="outline"
              size="sm"
            >
              Reload
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.name);
            const price = billingCycle === 'yearly' ? plan.price_yearly || 0 : plan.price_monthly;
            const displayPrice = billingCycle === 'yearly' ? Math.round((plan.price_yearly || 0) / 10) : plan.price_monthly;
            const currentPlanData = subscription?.plan as HookSubscriptionPlan | undefined;
            const isCurrentPlan = currentPlanData?.name === plan.name;
            const features = formatFeatures(
              plan.features, 
              plan.name, 
              plan.credits_per_month || 0, 
              plan.max_projects || 0
            );
            const isPopular = plan.name === 'Professional';

            return (
              <div
                key={index}
                className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                  isPopular
                    ? "border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl lg:scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold shadow-lg">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="inline-flex p-2 rounded-xl bg-primary/10 mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {plan.name === 'Starter' && 'Perfect for freelancers and small businesses'}
                    {plan.name === 'Professional' && 'For growing agencies and businesses'}
                    {plan.name === 'Agency' && 'For large agencies and enterprises'}
                    {plan.name === 'Enterprise' && 'For large enterprises with custom needs'}
                  </p>
                  
                  <div className="mb-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-foreground">${displayPrice}</span>
                      <span className="text-muted-foreground ml-1 text-sm">/mo</span>
                    </div>
                    {billingCycle === 'yearly' && plan.price_yearly && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {calculateSavings(plan.price_monthly, plan.price_yearly)}
                      </p>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {plan.max_team_members > 1 && `${plan.max_team_members} team • `}
                    7-Day Free Trial
                  </Badge>
                </div>

                <ul className="space-y-2 mb-6">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => {
                    if (plan.name === "Enterprise" || plan.name === "Agency") {
                      window.location.href = "/contact";
                    } else {
                      handleSelectPlan(plan.name);
                    }
                  }}
                  disabled={isCreatingCheckout || isCurrentPlan || isLoading}
                  className={`w-full ${isPopular ? "gradient-primary shadow-lg" : ""}`}
                  variant={isPopular ? "default" : "outline"}
                >
                  {isCreatingCheckout ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Start Free Trial"
                  )}
                </Button>
                
                {isCurrentPlan && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Manage in Settings
                  </p>
                )}
              </div>
            );
          })}
        </div>
        )}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include 7-day free trial • No credit card required for trial • Cancel anytime
          </p>
          <p className="text-xs text-muted-foreground">
            Need a custom plan? <Link to="/contact" className="text-primary hover:underline">Contact our sales team</Link>
          </p>
        </div>

        {/* Debug Console */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowDebug(!showDebug)}
            size="sm"
            variant="outline"
            className="mb-2 shadow-lg"
          >
            {showDebug ? 'Hide' : 'Show'} Debug Console {debugLogs.length > 0 && `(${debugLogs.length})`}
          </Button>
          
          {showDebug && (
            <div className="bg-black/95 text-green-400 rounded-lg p-4 max-w-2xl max-h-96 overflow-y-auto font-mono text-xs shadow-2xl border border-green-500/30">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-green-500/30">
                <span className="text-green-300 font-bold">🔍 Checkout Debug Console</span>
                <Button
                  onClick={() => setDebugLogs([])}
                  size="sm"
                  variant="ghost"
                  className="h-6 text-green-400 hover:text-green-300"
                >
                  Clear
                </Button>
              </div>
              {debugLogs.length === 0 ? (
                <p className="text-green-500/50">No logs yet. Click "Start Free Trial" to see debug info...</p>
              ) : (
                <div className="space-y-1">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="text-green-400 break-all">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}
