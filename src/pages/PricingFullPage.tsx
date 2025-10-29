import React from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { Check, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
 
import { Database } from "@/integrations/supabase/types";

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];

const dynamicFeatureComparison = [
  {
    category: "Core Features",
    features: [
      { name: "Credits per Month", getValue: (plan: SubscriptionPlan) => plan.credits_per_month || 0 },
      { name: "Max Projects", getValue: (plan: SubscriptionPlan) => plan.max_projects || 0 },
      { name: "Max Team Members", getValue: (plan: SubscriptionPlan) => plan.max_team_members || 1 },
    ]
  },
  {
    category: "SEO Tools",
    features: [
      { name: "Keyword Research", getValue: (plan: SubscriptionPlan) => true },
      { name: "SERP Tracking", getValue: (plan: SubscriptionPlan) => true },
      { name: "Site Audit", getValue: (plan: SubscriptionPlan) => plan.name === 'Free' ? '1 site' : 'Unlimited' },
      { name: "Backlink Analysis", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Competitor Analysis", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Local SEO Suite", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
    ]
  },
  {
    category: "AI & Content",
    features: [
      { name: "AI Content Generation", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
      { name: "Content Repurposing", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' },
      { name: "AI Analytics", getValue: (plan: SubscriptionPlan) => plan.name !== 'Free' && plan.name !== 'Starter' },
    ]
  },
  {
    category: "Support & Extras",
    features: [
      { name: "Support", getValue: (plan: SubscriptionPlan) => {
        if (plan.name === 'Free') return 'Community';
        if (plan.name === 'Starter') return 'Email';
        if (plan.name === 'Professional') return 'Priority';
        return 'Dedicated';
      }},
      { name: "White-label Reports", getValue: (plan: SubscriptionPlan) => plan.name === 'Agency' || plan.name === 'Enterprise' },
      { name: "API Access", getValue: (plan: SubscriptionPlan) => plan.name === 'Agency' || plan.name === 'Enterprise' },
      { name: "Custom Integrations", getValue: (plan: SubscriptionPlan) => plan.name === 'Enterprise' },
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
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Compare All Plans
            </h2>

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

            {/* FAQ */}
            <div className="max-w-3xl mx-auto mt-20">
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
                Pricing FAQ
              </h2>

              <div className="space-y-6">
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
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">Is there a refund policy?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! We offer a 7-day money-back guarantee. If you're not satisfied, contact us for a full refund.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-2 text-foreground">Do you offer discounts for annual payments?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! Save 20% when you pay annually instead of monthly. Contact sales for details.
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

