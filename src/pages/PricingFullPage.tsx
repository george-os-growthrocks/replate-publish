import React from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFeaturesForPlan, type PlanName, FEATURES } from "@/lib/feature-access";
 
import { Database } from "@/integrations/supabase/types";

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];

// Enhanced feature comparison using feature-access system
const getFeatureComparison = () => {
  const plans: PlanName[] = ['Starter', 'Pro', 'Agency', 'Enterprise'];
  const categories = ['research', 'content', 'technical', 'competitive', 'advanced', 'reporting'] as const;
  
  const comparison = categories.map(category => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    features: FEATURES
      .filter(f => f.category === category)
      .map(feature => ({
        name: feature.name,
        planAccess: plans.reduce((acc, plan) => {
          const planFeatures = getFeaturesForPlan(plan);
          acc[plan] = planFeatures.some(pf => pf.key === feature.key);
          return acc;
        }, {} as Record<PlanName, boolean>)
      }))
  }));

  return comparison;
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
        name: "Max Team Members", 
        getValue: (plan: SubscriptionPlan) => plan.max_team_members || 1 
      },
      {
        name: "7-Day Free Trial",
        getValue: (plan: SubscriptionPlan) => plan.name !== 'Free'
      },
    ]
  },
  {
    category: "Research Features",
    features: [
      { name: "Keyword Research", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "SERP Analysis", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "Keyword Clustering", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "People Also Ask Extractor", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "Rank Tracking", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
    ]
  },
  {
    category: "Content Tools",
    features: [
      { name: "Content Repurposing", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "AI Content Briefs", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Meta Description Generator", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "ChatGPT Citation Optimization", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
    ]
  },
  {
    category: "Technical SEO",
    features: [
      { name: "Technical SEO Audit", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "Site Crawler", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "Core Web Vitals Checker", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "Schema Validator", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
    ]
  },
  {
    category: "Competitive Analysis",
    features: [
      { name: "Competitor Analysis", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Backlink Analysis", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Content Gap Analysis", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Competitor Monitoring", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Local SEO Suite", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
    ]
  },
  {
    category: "Advanced Features",
    features: [
      { name: "AI Overview Checker", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "AI Overview Optimization", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Bulk URL Analyzer", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Automated Reports", getValue: (plan: SubscriptionPlan) => plan.name === 'Agency' || plan.name === 'Enterprise' },
    ]
  },
  {
    category: "Support & Extras",
    features: [
      { name: "Support", getValue: (plan: SubscriptionPlan) => {
        if (plan.name === 'Free') return 'Community';
        if (plan.name === 'Starter') return 'Email';
        if (plan.name === 'Professional' || plan.name === 'Pro') return 'Priority';
        return 'Dedicated';
      }},
      { name: "White-label Reports", getValue: (plan: SubscriptionPlan) => plan.name === 'Agency' || plan.name === 'Enterprise' },
      { name: "API Access", getValue: (plan: SubscriptionPlan) => plan.name === 'Agency' || plan.name === 'Enterprise' },
    ]
  }
];

function ComparisonTable({ plans }: { plans: SubscriptionPlan[] }) {
  if (plans.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-semibold text-foreground">Features</th>
              {plans.map((plan) => (
                <th 
                  key={plan.id} 
                  className={`text-center p-4 font-semibold text-foreground ${
                    plan.name === 'Professional' ? 'bg-primary/5' : ''
                  }`}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dynamicFeatureComparison.map((category, catIndex) => (
              <React.Fragment key={`cat-${catIndex}`}>
                <tr className="bg-muted/30">
                  <td colSpan={plans.length + 1} className="p-4 font-semibold text-sm text-foreground">
                    {category.category}
                  </td>
                </tr>
                {category.features.map((feature, featIndex) => (
                  <tr key={`feat-${catIndex}-${featIndex}`} className="border-b border-border">
                    <td className="p-4 text-sm text-foreground">{feature.name}</td>
                    {plans.map((plan) => {
                      const value = feature.getValue(plan);
                      return (
                        <td 
                          key={plan.id} 
                          className={`text-center p-4 ${
                            plan.name === 'Professional' ? 'bg-primary/5' : ''
                          }`}
                        >
                          {typeof value === "boolean" ? (
                            value ? (
                              <Check className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className={`text-sm ${
                              plan.name === 'Professional' ? 'font-medium' : ''
                            } text-foreground`}>{value}</span>
                          )}
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
    </div>
  );
}

export default function PricingFullPage() {
  // Fetch plans from database
  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription_plans_comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    }
  });

  return (
    <>
      <Helmet>
        <title>Pricing - AnotherSEOGuru</title>
        <meta name="description" content="Simple, transparent pricing for AnotherSEOGuru. Choose the perfect plan for your SEO needs. All plans include 7-day free trial." />
        <link rel="canonical" href="https://anotherseoguru.com/pricing" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <PricingSection />

          {/* Feature Comparison */}
          <div className="container mx-auto px-4 mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Compare All Plans
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                All plans include a 7-day free trial with full access to all features. 
                Sign in with Google to start your trial - no credit card required.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading comparison table...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Unable to load plans for comparison.</p>
              </div>
            ) : (
              <ComparisonTable plans={plans} />
            )}

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto mt-20 mb-16">
              <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Ready to Start Your 7-Day Free Trial?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Sign in with Google to activate your free trial. No credit card required. 
                  Get full access to all features for 7 days, then choose your plan.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/auth">
                    <Button size="lg" className="gradient-primary shadow-lg text-base px-8">
                      Sign In with Google - Start Trial
                    </Button>
                  </a>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-base px-8"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    View Plans Above
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    No credit card required
                  </span>
                  <span className="mx-4">•</span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Cancel anytime
                  </span>
                  <span className="mx-4">•</span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Full feature access
                  </span>
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto mt-20">
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
                Pricing FAQ
              </h2>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">How does the 7-day free trial work?</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in with Google to start your trial. You'll automatically get the Starter plan with a 7-day free trial, 
                    which gives you full access to all features. No credit card required. After 7 days, you can choose to upgrade 
                    to keep your access or your account will remain on the Free plan.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">Why do I need to sign in with Google?</h3>
                  <p className="text-sm text-muted-foreground">
                    AnotherSEOGuru requires Google Search Console data to provide its core features. Signing in with Google 
                    allows us to securely access your Search Console data (with your permission) and assign your free trial automatically.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">Can I change plans later?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted-foreground">
                    We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. 
                    Payment is only required after your 7-day trial ends if you choose to continue.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">Is there a refund policy?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! We offer a 7-day money-back guarantee for paid plans. If you're not satisfied, contact us for a full refund.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">Do you offer discounts for annual payments?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! Save up to 17% when you pay annually instead of monthly. The discount is automatically applied at checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}

