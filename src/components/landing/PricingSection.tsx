import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check, Zap, Crown, Rocket, Sparkles, CheckCircle, 
  ArrowRight, ArrowUpRight, Play, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreateCheckout, useSubscription } from "@/hooks/useSubscription";
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

// Fallback plans
const fallbackPlans: Partial<SubscriptionPlan>[] = [
  {
    id: 'launch',
    name: 'Launch',
    price_monthly: 29,
    price_yearly: 290,
    credits_per_month: 1200,
    max_projects: 3,
  },
  {
    id: 'growth',
    name: 'Growth',
    price_monthly: 79,
    price_yearly: 790,
    credits_per_month: 6000,
    max_projects: 10,
  },
  {
    id: 'agency',
    name: 'Agency',
    price_monthly: 149,
    price_yearly: 1490,
    credits_per_month: 20000,
    max_projects: 30,
  },
  {
    id: 'scale',
    name: 'Scale',
    price_monthly: 399,
    price_yearly: 3990,
    credits_per_month: 0,
    max_projects: 999,
  }
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckout();
  const { data: subscription } = useSubscription();

  const plans = fallbackPlans as SubscriptionPlan[];

  const handleSelectPlan = (planName: string) => {
    if (planName === 'Scale') {
      window.location.href = '/contact';
      return;
    }

    // For authenticated users, create checkout
    if (subscription) {
      createCheckout(
        { planName, billingCycle },
        {
          onSuccess: () => {
            // Redirect handled in useCreateCheckout
          },
          onError: () => {
            // Error handled in useCreateCheckout
          }
        }
      );
    } else {
      // For non-authenticated users, redirect to auth
      localStorage.setItem('selected_plan', planName);
      localStorage.setItem('selected_billing', billingCycle);
      window.location.href = '/auth';
    }
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const savings = ((monthly * 12 - yearly) / (monthly * 12) * 100).toFixed(0);
    return savings;
  };

  return (
    <section id="pricing" className="relative overflow-hidden py-24 px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      <div className="container mx-auto relative z-10">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center mb-16">
          <Badge className="mb-6 px-4 py-1.5 text-sm bg-gradient-to-r from-primary to-secondary text-white border-0">
            <Sparkles className="w-3 h-3 mr-2" />
            7-Day Free Trial on All Plans
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
              Pricing for Everyone
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your business. Scale as you grow with flexible pricing and powerful features.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
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
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans
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
                      <div className="space-y-2 mb-6 min-h-[180px]">
                        {planConfig.features.slice(0, 5).map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                        {planConfig.features.length > 5 && (
                          <div className="text-xs text-muted-foreground italic pt-2">
                            +{planConfig.features.length - 5} more features
                          </div>
                        )}
                      </div>
                      
                      {/* CTA */}
                      <Button 
                        onClick={() => handleSelectPlan(plan.name)}
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
        </div>

        {/* Bottom CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            Launch plan includes 7-day free trial • No credit card required • Cancel anytime
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gradient-primary">
              <Link to="/pricing">
                View Full Pricing Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/features">
                See All Features
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
