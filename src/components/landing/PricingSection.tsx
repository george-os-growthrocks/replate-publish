import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Zap, Crown, Rocket, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreateCheckout, useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    priceMonthly: 69,
    priceYearly: 690, // 10 months (2 free)
    description: "Perfect for freelancers and small businesses",
    credits: "1,000 credits/month",
    features: [
      "3 SEO projects",
      "Keyword Research",
      "Rank Tracking (50 keywords)",
      "Content Repurpose (50/mo)",
      "Site Audit (1 site)",
      "Competitor Analysis (3)",
      "Email Support",
      "7-Day Free Trial"
    ],
    cta: "Start Free Trial",
    popular: false,
    color: "blue"
  },
  {
    name: "Pro",
    icon: Crown,
    priceMonthly: 99,
    priceYearly: 990, // 10 months (2 free)
    description: "For growing agencies and businesses",
    credits: "3,000 credits/month",
    features: [
      "10 SEO projects",
      "Unlimited Keywords",
      "Content Repurpose (200/mo)",
      "Site Audit (5 sites)",
      "Competitor Analysis (10)",
      "Backlink Analysis",
      "Local SEO Suite",
      "Priority Support",
      "White-Label Reports"
    ],
    cta: "Start Free Trial",
    popular: true,
    color: "primary"
  },
  {
    name: "Agency",
    icon: Rocket,
    priceMonthly: 299,
    priceYearly: 2990, // 10 months (2 free)
    description: "For large agencies and enterprises",
    credits: "10,000 credits/month",
    features: [
      "50 SEO projects",
      "Unlimited Everything",
      "15 team members",
      "Client Management",
      "Custom Branding",
      "API Access (50k calls/mo)",
      "Dedicated Account Manager",
      "24/7 Priority Support",
      "SLA Guarantee"
    ],
    cta: "Start Free Trial",
    popular: false,
    color: "amber"
  }
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckout();
  const { data: subscription } = useSubscription();

  const handleSelectPlan = (planName: string) => {
    createCheckout({ planName, billingCycle });
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const yearlyMonthly = yearly / 10; // 10 months paid
    const savings = ((monthly * 12 - yearly) / (monthly * 12) * 100).toFixed(0);
    return `Save ${savings}% (2 months free)`;
  };

  return (
    <section id="pricing" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            7-Day Free Trial on All Plans
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the perfect plan for your needs. Cancel anytime.
          </p>

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

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const displayPrice = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 10) : plan.priceMonthly;
            const currentPlanData = subscription?.plan || (subscription as any)?.subscription_plans;
            const isCurrentPlan = currentPlanData?.name === plan.name;

            return (
              <div
                key={index}
                className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                  plan.popular
                    ? "border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-2xl md:scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-xl"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold shadow-lg">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  
                  <div className="mb-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-foreground">${displayPrice}</span>
                      <span className="text-muted-foreground ml-2">/mo</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {calculateSavings(plan.priceMonthly, plan.priceYearly)}
                      </p>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {plan.credits}
                  </Badge>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => {
                    if (plan.name === "Agency") {
                      window.location.href = "/contact";
                    } else {
                      handleSelectPlan(plan.name);
                    }
                  }}
                  disabled={isCreatingCheckout || isCurrentPlan}
                  className={`w-full ${plan.popular ? "gradient-primary shadow-lg" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {isCreatingCheckout ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    plan.cta
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

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include 7-day free trial • No credit card required for trial • Cancel anytime
          </p>
          <p className="text-xs text-muted-foreground">
            Need a custom plan? <Link to="/contact" className="text-primary hover:underline">Contact our sales team</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
