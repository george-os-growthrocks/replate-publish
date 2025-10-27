import React from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { Check, X } from "lucide-react";

const featureComparison = [
  {
    category: "Projects & Keywords",
    features: [
      { name: "Projects", starter: "5", pro: "25", enterprise: "Unlimited" },
      { name: "Tracked Keywords", starter: "100", pro: "Unlimited", enterprise: "Unlimited" },
      { name: "Ranking Updates", starter: "Daily", pro: "Hourly", enterprise: "Real-time" },
    ]
  },
  {
    category: "SEO Features",
    features: [
      { name: "Keyword Research", starter: true, pro: true, enterprise: true },
      { name: "SERP Tracking", starter: true, pro: true, enterprise: true },
      { name: "Site Audit", starter: "1 site", pro: "Unlimited", enterprise: "Unlimited" },
      { name: "Backlink Monitoring", starter: false, pro: true, enterprise: true },
      { name: "Competitor Analysis", starter: false, pro: true, enterprise: true },
      { name: "Local SEO", starter: false, pro: true, enterprise: true },
    ]
  },
  {
    category: "AI & Content",
    features: [
      { name: "AI Content Generation", starter: false, pro: true, enterprise: true },
      { name: "Platform Support", starter: "N/A", pro: "8 platforms", enterprise: "8 platforms" },
      { name: "Content Repurposing", starter: false, pro: true, enterprise: true },
    ]
  },
  {
    category: "Support & Extras",
    features: [
      { name: "Support", starter: "Email", pro: "Priority", enterprise: "24/7 Phone" },
      { name: "White-label Reports", starter: false, pro: false, enterprise: true },
      { name: "API Access", starter: false, pro: false, enterprise: true },
      { name: "Dedicated Manager", starter: false, pro: false, enterprise: true },
    ]
  }
];

export default function PricingFullPage() {
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
              Compare Plans
            </h2>

            <div className="max-w-6xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold text-foreground">Features</th>
                      <th className="text-center p-4 font-semibold text-foreground">Starter</th>
                      <th className="text-center p-4 font-semibold bg-primary/5 text-foreground">Professional</th>
                      <th className="text-center p-4 font-semibold text-foreground">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((category, catIndex) => (
                      <React.Fragment key={`cat-${catIndex}`}>
                        <tr className="bg-muted/30">
                          <td colSpan={4} className="p-4 font-semibold text-sm text-foreground">
                            {category.category}
                          </td>
                        </tr>
                        {category.features.map((feature, featIndex) => (
                          <tr key={`feat-${catIndex}-${featIndex}`} className="border-b border-border">
                            <td className="p-4 text-sm text-foreground">{feature.name}</td>
                            <td className="text-center p-4">
                              {typeof feature.starter === "boolean" ? (
                                feature.starter ? (
                                  <Check className="w-5 h-5 text-success mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-foreground">{feature.starter}</span>
                              )}
                            </td>
                            <td className="text-center p-4 bg-primary/5">
                              {typeof feature.pro === "boolean" ? (
                                feature.pro ? (
                                  <Check className="w-5 h-5 text-success mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm font-medium text-foreground">{feature.pro}</span>
                              )}
                            </td>
                            <td className="text-center p-4">
                              {typeof feature.enterprise === "boolean" ? (
                                feature.enterprise ? (
                                  <Check className="w-5 h-5 text-success mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-foreground">{feature.enterprise}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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

