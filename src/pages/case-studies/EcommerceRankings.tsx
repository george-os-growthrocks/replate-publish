import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, DollarSign, Calendar, CheckCircle2 } from "lucide-react";
import { RelatedLinksSection } from "@/components/blog/RelatedLinksSection";
import { BreadcrumbListJsonLd } from "@/components/seo";

export default function EcommerceRankingsCaseStudy() {
  const relatedLinks = [
    {
      title: "Keyword Research Tool",
      href: "/free-tools/keyword-clustering",
      description: "Cluster keywords like they did",
      type: "tool" as const
    },
    {
      title: "Ranking Tracker",
      href: "/ranking-tracker",
      description: "Track your rankings like this client",
      type: "tool" as const
    },
    {
      title: "Competitor Analysis Guide",
      href: "/blog/internal-linking-scale",
      description: "Learn competitor analysis strategies",
      type: "blog" as const
    }
  ];

  return (
    <>
      <Helmet>
        <title>Case Study: How an E-commerce Site Increased Organic Traffic by 247% in 6 Months | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Learn how a mid-size e-commerce retailer used keyword clustering, internal linking, and rank tracking to increase organic traffic by 247% and revenue by 189% in just 6 months." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/case-studies/ecommerce-organic-traffic-growth" />
        <meta property="og:title" content="Case Study: 247% Organic Traffic Growth in 6 Months" />
        <meta property="og:description" content="How an e-commerce site increased organic traffic by 247% and revenue by 189% using keyword research and rank tracking." />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content="2025-01-15T10:00:00Z" />
      </Helmet>
      <BreadcrumbListJsonLd 
        items={[
          { name: "Home", url: "https://anotherseoguru.com" },
          { name: "Case Studies", url: "https://anotherseoguru.com/case-studies" },
          { name: "E-commerce Traffic Growth", url: "https://anotherseoguru.com/case-studies/ecommerce-organic-traffic-growth" }
        ]} 
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        <article className="pt-20">
          {/* Hero */}
          <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
            <div className="container mx-auto max-w-4xl">
              <Badge className="mb-4 bg-success/10 text-success border-success/20">
                Case Study
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                How an E-commerce Site Increased Organic Traffic by{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  247% in 6 Months
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  January 15, 2025
                </div>
                <Badge variant="outline">E-commerce SEO</Badge>
                <Badge variant="outline">Keyword Research</Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-8 h-8 text-success" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">247%</div>
                        <div className="text-sm text-muted-foreground">Traffic Growth</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-8 h-8 text-primary" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">189%</div>
                        <div className="text-sm text-muted-foreground">Revenue Growth</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-secondary" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">12k+</div>
                        <div className="text-sm text-muted-foreground">New Keywords</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-4xl prose prose-slate dark:prose-invert max-w-none">
              <div className="space-y-8 text-foreground">
                <div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">The Challenge</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    A mid-size e-commerce retailer selling home and garden products was struggling with declining organic traffic. 
                    Despite having quality products and a well-designed website, they were losing rankings to competitors who 
                    had better keyword strategies and internal linking.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>Only ranking for 150 keywords (mostly branded)</li>
                    <li>Average position: 45+ for target terms</li>
                    <li>Organic traffic declining 15% quarter-over-quarter</li>
                    <li>No systematic approach to keyword research</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">The Strategy</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We implemented a three-pronged approach using AnotherSEOGuru's tools:
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-primary text-2xl mb-3">1</div>
                        <h3 className="font-bold mb-2 text-foreground">Keyword Clustering</h3>
                        <p className="text-sm text-muted-foreground">
                          Used our keyword clustering tool to identify 12,000+ relevant keywords and group them into 45 topic clusters
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-primary text-2xl mb-3">2</div>
                        <h3 className="font-bold mb-2 text-foreground">Internal Linking</h3>
                        <p className="text-sm text-muted-foreground">
                          Implemented strategic internal linking based on keyword clusters to boost topical authority
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-primary text-2xl mb-3">3</div>
                        <h3 className="font-bold mb-2 text-foreground">Rank Tracking</h3>
                        <p className="text-sm text-muted-foreground">
                          Monitored 500+ target keywords weekly to identify wins and opportunities
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">The Results</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                      <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Traffic Explosion</h3>
                        <p className="text-muted-foreground">
                          Organic traffic increased from 45,000 to 156,000 monthly visitors in 6 months—a 247% increase
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Revenue Growth</h3>
                        <p className="text-muted-foreground">
                          Organic revenue grew 189% from $125k to $362k monthly—attributed to better rankings and increased traffic quality
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Keyword Expansion</h3>
                        <p className="text-muted-foreground">
                          Rankings increased from 150 to 4,200+ keywords, with 312 now ranking in the top 10 positions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">Key Takeaways</h2>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <span><strong className="text-foreground">Keyword clustering</strong> is essential for e-commerce sites with large product catalogs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <span><strong className="text-foreground">Systematic internal linking</strong> based on topic clusters dramatically improves rankings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <span><strong className="text-foreground">Weekly rank tracking</strong> helps identify quick wins and adjust strategy in real-time</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-12 px-4 bg-muted/30 border-y">
            <div className="container mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Ready to Achieve Similar Results?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start using the same tools and strategies this client used to grow their organic traffic by 247%
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free 7-Day Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/free-tools/keyword-clustering">
                    Try Keyword Clustering Free
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <RelatedLinksSection links={relatedLinks} />
        </article>

        <Footer />
      </div>
    </>
  );
}

