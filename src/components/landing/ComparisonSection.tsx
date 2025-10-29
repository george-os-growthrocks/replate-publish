import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";

const competitors = [
  { name: "Ahrefs", price: "$99/mo", features: ["Keyword Research", "Backlinks", "Site Audit", "Rank Tracking", "Content Analysis", "❌ AI Content", "❌ AI Overviews"] },
  { name: "SEMrush", price: "$119/mo", features: ["Keyword Research", "Backlinks", "Site Audit", "Rank Tracking", "Content Analysis", "❌ AI Content", "❌ AI Overviews"] },
  { name: "SurferSEO", price: "$89/mo", features: ["Content Analysis", "Content Editor", "AI Content (Limited)", "❌ Rank Tracking", "❌ Backlinks", "❌ Site Audit", "❌ AI Overviews"] },
];

export function ComparisonSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How We Compare to
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Top SEO Tools</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              More features, better AI, lower cost. See why teams are switching from expensive alternatives.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center p-4 font-semibold text-foreground">
                      <div className="font-bold text-primary">AnotherSEOGuru</div>
                      <div className="text-sm text-muted-foreground font-normal">$29-199/mo</div>
                    </th>
                    {competitors.map((comp) => (
                      <th key={comp.name} className="text-center p-4 font-semibold text-foreground">
                        <div>{comp.name}</div>
                        <div className="text-sm text-muted-foreground font-normal">{comp.price}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">Keyword Research</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <Check className="w-5 h-5 text-success mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">Rank Tracking</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <Check className="w-5 h-5 text-success mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">Backlink Monitoring</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <Check className="w-5 h-5 text-success mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">Technical SEO Audit</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <Check className="w-5 h-5 text-success mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">AI Content Generation</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">AI Overview Optimization</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">15+ Free SEO Tools</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4 text-foreground font-medium">Unified Dashboard</td>
                    <td className="p-4 text-center">
                      <Check className="w-5 h-5 text-success mx-auto" />
                    </td>
                    {competitors.map(() => (
                      <td key={Math.random()} className="p-4 text-center">
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Card className="inline-block p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <p className="text-lg font-semibold text-foreground mb-2">
                Save $500+/month with the all-in-one solution
              </p>
              <p className="text-sm text-muted-foreground">
                Get everything you need without juggling multiple subscriptions
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

