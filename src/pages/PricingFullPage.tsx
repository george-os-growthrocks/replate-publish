import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Loader2, Zap, Crown, Rocket, Sparkles, CheckCircle, 
  ArrowRight, ArrowUpRight, Play, Star, Sparkle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateCheckout, useSubscription } from "@/hooks/useSubscription";
import { getFeaturesForPlan, type PlanName, FEATURES } from "@/lib/feature-access";
import { Database } from "@/integrations/supabase/types";

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];

const planFeatures = {
  Launch: {
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    highlight: "Perfect for Freelancers",
    description: "Essential SEO tools to get started",
    price: { monthly: 29, yearly: 290 },
    features: [
      "Keyword Research & Ideas (50M+ database)",
      "Autocomplete Expansions",
      "PAA / Answer The Public",
      "Keyword Clustering (AI-powered)",
      "SERP Overview (top 10 analysis)",
      "Rank Tracking (250 keywords/day)",
      "Meta Generator (titles & descriptions)",
      "Lite Tech Audit (1k URLs per crawl)",
      "Sample CWV (up to 50 URLs/mo)",
      "Schema Validator",
      "AI Overview Checker (Basic)",
    ],
    limits: {
      projects: 3,
      credits: "1,200",
      keywords: "250/day",
      crawl: "10k URLs/mo",
      reports: 5
    }
  },
  Growth: {
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    highlight: "Most Popular",
    description: "Everything freelancers need + team collaboration",
    price: { monthly: 79, yearly: 790 },
    features: [
      "Everything in Launch",
      "AI Content Briefs",
      "SERP Similarity Analysis",
      "Competitor Analysis",
      "Content Gap Discovery",
      "Backlink Lookups",
      "Local SEO Audit (light)",
      "Bulk URL Analyzer",
      "Scheduled Reports",
      "Priority Chat Support",
    ],
    limits: {
      seats: 3,
      projects: 10,
      credits: "6,000",
      keywords: "1,250/day",
      crawl: "100k URLs/mo",
      reports: 20
    }
  },
  Agency: {
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    highlight: "For Agencies",
    description: "Scale your agency with automation & white-label",
    price: { monthly: 149, yearly: 1490 },
    features: [
      "Everything in Growth",
      "White-Label Reports",
      "API Access (read)",
      "Competitor Monitoring (automated)",
      "Backlink Monitoring (continuous)",
      "AI Overview Optimization",
      "Citation Optimization",
      "Workflow Automations",
      "Priority Support",
    ],
    limits: {
      seats: 10,
      projects: 30,
      credits: "20,000",
      keywords: "5,000/day",
      crawl: "400k URLs/mo",
      reports: 60
    }
  },
  Scale: {
    icon: Sparkles,
    color: "from-indigo-500 to-purple-500",
    highlight: "Enterprise",
    description: "Custom solutions for large organizations",
    price: { monthly: 399, yearly: 3990 },
    features: [
      "Everything in Agency",
      "SSO/SAML Integration",
      "Custom Limits (contracted)",
      "Private Data Retention",
      "SLAs & DPAs",
      "Audit Logs",
      "Dedicated Customer Success Manager",
      "Custom Connectors",
    ],
    limits: {
      seats: "Custom",
      projects: "Custom",
      credits: "Custom",
      keywords: "Custom",
      crawl: "Custom",
      reports: "Custom"
    }
  }
};

const dynamicFeatureComparison = [
  {
    category: "Core Limits",
    features: [
      { 
        name: "Credits per Month", 
        getValue: (plan: SubscriptionPlan) => plan.credits_per_month || 0 
      },
      { 
        name: "Max Projects", 
        getValue: (plan: SubscriptionPlan) => plan.max_projects || 0 
      },
      {
        name: "Seats",
        getValue: (plan: SubscriptionPlan) => (plan as any).max_seats || 1
      },
      {
        name: "Tracked Keywords (daily)",
        getValue: (plan: SubscriptionPlan) => (plan as any).max_tracked_keywords_daily || 0
      },
      {
        name: "Crawl Budget (monthly)",
        getValue: (plan: SubscriptionPlan) => {
          const crawlBudget = (plan as any).max_crawl_urls_monthly || 0;
          return crawlBudget > 0 ? `${(crawlBudget / 1000).toFixed(0)}k URLs` : 'N/A';
        }
      },
      {
        name: "Reports (monthly)",
        getValue: (plan: SubscriptionPlan) => (plan as any).max_reports_monthly || 0
      },
    ]
  }
];

function ComparisonTable({ plans }: { plans: SubscriptionPlan[] }) {
  if (plans.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="border-2 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border bg-muted/30">
                  <th className="text-left p-6 font-bold text-lg text-foreground">Features</th>
                  {plans.map((plan) => {
                    const planConfig = planFeatures[plan.name as keyof typeof planFeatures];
                    const isPopular = plan.name === 'Growth';
                    return (
                      <th 
                        key={plan.id} 
                        className={`text-center p-6 font-bold text-lg text-foreground ${
                          isPopular ? 'bg-primary/10' : ''
                        }`}
                      >
                        {plan.name}
                        {isPopular && (
                          <Badge className="mt-2 bg-gradient-to-r from-primary to-secondary text-white border-0">
                            Most Popular
                          </Badge>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {dynamicFeatureComparison.map((category, catIndex) => (
                  <React.Fragment key={`cat-${catIndex}`}>
                    <tr className="bg-muted/20">
                      <td colSpan={plans.length + 1} className="p-4 font-bold text-base text-foreground">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featIndex) => (
                      <tr key={`feat-${catIndex}-${featIndex}`} className="border-b border-border hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-sm text-foreground font-medium">{feature.name}</td>
                        {plans.map((plan) => {
                          const value = feature.getValue(plan);
                          const isPopular = plan.name === 'Growth';
                          return (
                            <td 
                              key={plan.id} 
                              className={`text-center p-4 ${
                                isPopular ? 'bg-primary/5' : ''
                              }`}
                            >
                              <span className="font-semibold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PricingFullPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckout();
  const { data: subscription } = useSubscription();

  // Fetch plans from database
  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription_plans_comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .in('name', ['Launch', 'Growth', 'Agency', 'Scale'])
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    }
  });

  const handleSelectPlan = async (planName: string, planId: string) => {
    if (planName === 'Scale') {
      window.location.href = '/contact';
      return;
    }

    // Check authentication directly
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User is authenticated - redirect to dashboard for upgrade
        // Store the selected plan for dashboard to handle
        localStorage.setItem('selected_upgrade_plan', planName);
        localStorage.setItem('selected_upgrade_billing', billingCycle);
        window.location.href = '/dashboard?tab=subscription';
        return;
      } else {
        // User is not authenticated, redirect to auth with plan selection
        localStorage.setItem('selected_plan', planName);
        localStorage.setItem('selected_billing', billingCycle);
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Default to redirecting to auth if auth check fails
      localStorage.setItem('selected_plan', planName);
      localStorage.setItem('selected_billing', billingCycle);
      window.location.href = '/auth';
    }
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const yearlyMonthly = yearly / 10;
    const savings = ((monthly * 12 - yearly) / (monthly * 12) * 100).toFixed(0);
    return savings;
  };

  // Use fallback plans if database is empty
  const displayPlans = plans.length > 0 ? plans : [
    { id: 'launch', name: 'Launch', price_monthly: 29, price_yearly: 290, credits_per_month: 1200, max_projects: 3 } as SubscriptionPlan,
    { id: 'growth', name: 'Growth', price_monthly: 79, price_yearly: 790, credits_per_month: 6000, max_projects: 10 } as SubscriptionPlan,
    { id: 'agency', name: 'Agency', price_monthly: 149, price_yearly: 1490, credits_per_month: 20000, max_projects: 30 } as SubscriptionPlan,
    { id: 'scale', name: 'Scale', price_monthly: 399, price_yearly: 3990, credits_per_month: 0, max_projects: 999 } as SubscriptionPlan,
  ];

  return (
    <>
      <Helmet>
        <title>Pricing Plans - AnotherSEOGuru | 7-Day Free Trial</title>
        <meta name="description" content="Simple, transparent pricing for AnotherSEOGuru. Choose Launch, Growth, Agency, or Scale. All plans include 7-day free trial. Start today!" />
        <link rel="canonical" href="https://anotherseoguru.com/pricing" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-20">
          {/* Hero Section - Stunning & Unique */}
          <section className="relative overflow-hidden py-24 px-4">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[120px] animate-pulse delay-1000" />
            
            <div className="container mx-auto relative z-10">
              <div className="max-w-5xl mx-auto text-center">
                {/* Badge */}
                <Badge className="mb-6 px-4 py-1.5 text-sm bg-gradient-to-r from-primary to-secondary text-white border-0">
                  <Sparkles className="w-3 h-3 mr-2" />
                  7-Day Free Trial on Launch Plan
                </Badge>
                
                <h1 className="text-6xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
                  Simple, Transparent
                  <span className="block bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent animate-gradient">
                    Pricing for Everyone
                  </span>
                </h1>
                
                <p className="text-2xl md:text-3xl text-muted-foreground mb-4 font-light">
                  Choose the perfect plan. Scale as you grow.
                </p>
                
                <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Launch plan includes a 7-day free trial with full access to all features.
                  No credit card required. Cancel anytime.
                </p>
                
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-12">
                  <span className={`text-lg font-medium transition-colors ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Monthly
                  </span>
                  <Switch
                    checked={billingCycle === 'yearly'}
                    onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                    className="scale-125"
                  />
                  <span className={`text-lg font-medium transition-colors ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Yearly
                  </span>
                  {billingCycle === 'yearly' && (
                    <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                      Save 17%
                    </Badge>
                  )}
                </div>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Full feature access</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Money-back guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Cards */}
          <section className="py-20 px-4 bg-muted/30">
            <div className="container mx-auto max-w-7xl">
              {isLoading ? (
                <div className="flex justify-center items-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mr-4" />
                  <span className="text-lg text-muted-foreground">Loading pricing plans...</span>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayPlans
                    .filter(plan => plan.name !== 'Free')
                    .map((plan) => {
                      const planConfig = planFeatures[plan.name as keyof typeof planFeatures];
                      if (!planConfig) return null;
                      
                      const PlanIcon = planConfig.icon;
                      const isPopular = plan.name === 'Growth';
                      const price = billingCycle === 'yearly' 
                        ? Math.round(planConfig.price.yearly / 10) 
                        : planConfig.price.monthly;
                      const savings = billingCycle === 'yearly' 
                        ? calculateSavings(planConfig.price.monthly, planConfig.price.yearly)
                        : 0;
                      const currentPlanData = subscription?.plan;
                      const isCurrentPlan = currentPlanData?.name === plan.name;
                      
                      return (
                        <Card
                          key={plan.id}
                          className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                            isPopular 
                              ? 'border-primary shadow-2xl scale-105 lg:scale-110' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {isPopular && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1.5 text-xs font-bold shadow-lg">
                              MOST POPULAR
                            </div>
                          )}
                          
                          {/* Gradient Overlay */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${planConfig.color} opacity-5`} />
                          
                          <CardContent className="p-6 relative z-10">
                            {/* Plan Header */}
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${planConfig.color} flex items-center justify-center mb-4 shadow-lg`}>
                              <PlanIcon className="w-8 h-8 text-white" />
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-1 text-foreground">{plan.name}</h3>
                            <p className="text-sm text-primary font-semibold mb-1">{planConfig.highlight}</p>
                            <p className="text-sm text-muted-foreground mb-6">{planConfig.description}</p>
                            
                            {/* Pricing */}
                            <div className="mb-6">
                              <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-5xl font-bold text-foreground">${price}</span>
                                <span className="text-muted-foreground text-lg">/mo</span>
                              </div>
                              {billingCycle === 'yearly' && savings > 0 && (
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                  Save {savings}% (2 months free)
                                </p>
                              )}
                              {billingCycle === 'yearly' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Billed ${planConfig.price.yearly} annually
                                </p>
                              )}
                            </div>
                            
                            {/* Limits */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-border">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Projects</span>
                                <span className="font-semibold text-foreground">{planConfig.limits.projects}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Credits/mo</span>
                                <span className="font-semibold text-foreground">{planConfig.limits.credits}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Keywords/day</span>
                                <span className="font-semibold text-foreground">{planConfig.limits.keywords}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Crawl Budget</span>
                                <span className="font-semibold text-foreground">{planConfig.limits.crawl}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Reports/mo</span>
                                <span className="font-semibold text-foreground">{planConfig.limits.reports}</span>
                              </div>
                              {planConfig.limits.seats && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Seats</span>
                                  <span className="font-semibold text-foreground">{planConfig.limits.seats}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Features List */}
                            <div className="space-y-2 mb-6 min-h-[200px]">
                              {planConfig.features.slice(0, 6).map((feature, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground">{feature}</span>
                                </div>
                              ))}
                              {planConfig.features.length > 6 && (
                                <div className="text-xs text-muted-foreground italic pt-2">
                                  +{planConfig.features.length - 6} more features
                                </div>
                              )}
                            </div>
                            
                            {/* CTA */}
                            <Button 
                              onClick={() => handleSelectPlan(plan.name, plan.id)}
                              disabled={isCreatingCheckout || isCurrentPlan}
                              className={`w-full text-base h-12 ${
                                isPopular 
                                  ? 'gradient-primary shadow-lg' 
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                              size="lg"
                            >
                              {isCreatingCheckout ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : isCurrentPlan ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Current Plan
                                </>
                              ) : plan.name === 'Scale' ? (
                                <>
                                  Contact Sales
                                  <ArrowUpRight className="w-4 h-4 ml-2" />
                                </>
                              ) : plan.name === 'Launch' ? (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Free Trial
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                              ) : (
                                <>
                                  Choose Plan
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                              )}
                            </Button>
                            
                            {isCurrentPlan && (
                              <p className="text-xs text-center text-muted-foreground mt-3">
                                Manage in <Link to="/settings?tab=subscription" className="text-primary hover:underline">Settings</Link>
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          </section>

          {/* Feature Comparison Table */}
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-16">
                <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                  Compare Plans
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  Detailed Plan Comparison
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Every plan includes all features. Higher plans unlock more usage limits, seats, projects, and priority support.
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mr-4" />
                  <span className="text-muted-foreground">Loading comparison...</span>
                </div>
              ) : (
                <ComparisonTable plans={displayPlans.filter(p => p.name !== 'Free')} />
              )}
            </div>
          </section>

          {/* Final CTA - Conversion Focused */}
          <section className="py-24 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
            
            <div className="container mx-auto max-w-4xl relative z-10">
              <Card className="border-2 border-primary/30 bg-card/80 backdrop-blur-lg shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-8 flex items-center justify-center shadow-lg">
                    <Rocket className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                    Ready to Start Your Free Trial?
                  </h2>
                  
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Join thousands of SEO professionals using AnotherSEOGuru to boost rankings, 
                    automate workflows, and generate AI-optimized content. Start your 7-day free trial today.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Button asChild size="lg" className="text-lg px-10 py-7 h-auto gradient-primary shadow-xl hover:shadow-2xl transition-all">
                      <Link to="/auth">
                        <Play className="w-6 h-6 mr-2" />
                        Sign In with Google - Start Trial
                        <ArrowRight className="w-6 h-6 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="text-lg px-10 py-7 h-auto border-2">
                      <Link to="/features">
                        View All Features
                        <ArrowUpRight className="w-6 h-6 ml-2" />
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Full access to all 25+ features
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      No credit card required
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Cancel anytime
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      1,200 credits to start
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-3xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  Pricing FAQ
                </h2>
                <p className="text-xl text-muted-foreground">
                  Everything you need to know about our pricing
                </p>
              </div>

              <div className="space-y-6">
                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground">How does the 7-day free trial work?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Sign in with Google to start your trial. You'll automatically get the Launch plan with a 7-day free trial, 
                      which gives you full access to all features. No credit card required. After 7 days, you can choose to upgrade 
                      to keep your access or your account will remain on the Free plan.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground">Why do I need to sign in with Google?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      AnotherSEOGuru requires Google Search Console data to provide its core features. Signing in with Google 
                      allows us to securely access your Search Console data (with your permission) and assign your free trial automatically.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground">Can I change plans later?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Yes! You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately 
                      with prorated billing for upgrades.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground">What payment methods do you accept?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. 
                      Payment is only required after your 7-day trial ends if you choose to continue.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground">Is there a refund policy?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Yes! We offer a 7-day money-back guarantee for paid plans. If you're not satisfied, contact us within 7 days 
                      of your first payment for a full refund.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-foreground">Do you offer discounts for annual payments?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Yes! Save 17% when you pay annually instead of monthly (equivalent to 2 months free). 
                      The discount is automatically applied at checkout when you select yearly billing.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
