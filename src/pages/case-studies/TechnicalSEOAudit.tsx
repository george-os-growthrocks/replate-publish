import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, AlertTriangle, Calendar, CheckCircle2, Zap } from "lucide-react";
import { RelatedLinksSection } from "@/components/blog/RelatedLinksSection";
import { BreadcrumbListJsonLd } from "@/components/seo";

export default function TechnicalSEOAuditCaseStudy() {
  const relatedLinks = [
    {
      title: "Site Audit Tool",
      href: "/site-audit",
      description: "Run comprehensive technical audits",
      type: "tool" as const
    },
    {
      title: "CWV Pulse Checker",
      href: "/free-tools/cwv-pulse",
      description: "Monitor Core Web Vitals",
      type: "tool" as const
    },
    {
      title: "Technical SEO Guide",
      href: "/blog/log-file-seo-guide",
      description: "Learn technical SEO best practices",
      type: "blog" as const
    }
  ];

  return (
    <>
      <Helmet>
        <title>Case Study: Technical SEO Fix Leads to 156% Organic Traffic Increase | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="How a media company fixed 87 technical SEO issues and increased organic traffic by 156% in 4 months. Learn about crawl budget optimization, Core Web Vitals, and technical audits." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/case-studies/technical-seo-audit-traffic-growth" />
        <meta property="og:title" content="Case Study: 156% Traffic Growth from Technical SEO Fixes" />
        <meta property="og:description" content="How fixing 87 technical SEO issues led to 156% organic traffic increase in just 4 months." />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content="2025-01-25T10:00:00Z" />
      </Helmet>
      <BreadcrumbListJsonLd 
        items={[
          { name: "Home", url: "https://anotherseoguru.com" },
          { name: "Case Studies", url: "https://anotherseoguru.com/case-studies" },
          { name: "Technical SEO Audit", url: "https://anotherseoguru.com/case-studies/technical-seo-audit-traffic-growth" }
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
                Technical SEO Fix Leads to{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  156% Organic Traffic Increase
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  January 25, 2025
                </div>
                <Badge variant="outline">Technical SEO</Badge>
                <Badge variant="outline">Site Audit</Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-8 h-8 text-success" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">156%</div>
                        <div className="text-sm text-muted-foreground">Traffic Growth</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-8 h-8 text-destructive" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">87</div>
                        <div className="text-sm text-muted-foreground">Issues Fixed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-8 h-8 text-primary" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">4</div>
                        <div className="text-sm text-muted-foreground">Months</div>
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
                    A mid-size media company with 2,000+ articles was experiencing declining organic traffic despite 
                    publishing quality content regularly. Initial investigations revealed multiple technical SEO issues 
                    preventing Google from properly crawling and indexing their content.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>87 technical SEO issues identified in initial audit</li>
                    <li>Core Web Vitals failing (LCP: 4.2s, INP: 380ms)</li>
                    <li>60% of site pages not being indexed</li>
                    <li>Crawl budget wasted on duplicate and low-value pages</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">The Strategy</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    We used AnotherSEOGuru's site audit and technical SEO tools to identify and fix issues systematically:
                  </p>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl font-bold text-primary">1</div>
                          <div>
                            <h3 className="font-bold mb-2 text-foreground">Comprehensive Site Audit</h3>
                            <p className="text-muted-foreground">
                              Ran our 60+ point technical SEO audit to identify crawl issues, indexability problems, 
                              schema errors, and performance bottlenecks.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl font-bold text-primary">2</div>
                          <div>
                            <h3 className="font-bold mb-2 text-foreground">Core Web Vitals Optimization</h3>
                            <p className="text-muted-foreground">
                              Used CWV Pulse to monitor performance across the site, identifying and fixing LCP, INP, 
                              and CLS issues that were impacting rankings.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl font-bold text-primary">3</div>
                          <div>
                            <h3 className="font-bold mb-2 text-foreground">Crawl Budget Optimization</h3>
                            <p className="text-muted-foreground">
                              Fixed robots.txt, eliminated duplicate content, and ensured Google was prioritizing 
                              high-value pages for crawling.
                            </p>
                          </div>
                        </div>
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
                        <h3 className="font-bold text-foreground mb-1">Traffic Recovery</h3>
                        <p className="text-muted-foreground">
                          Organic traffic increased 156% from 89k to 228k monthly visitors in just 4 months, 
                          with most growth happening after technical fixes were implemented.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Indexation Improvement</h3>
                        <p className="text-muted-foreground">
                          Indexed pages increased from 1,200 to 2,100 (75% increase), with 95% of high-priority 
                          content now properly indexed.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Core Web Vitals Fixed</h3>
                        <p className="text-muted-foreground">
                          LCP improved from 4.2s to 2.1s, INP from 380ms to 120ms, and CLS from 0.15 to 0.02. 
                          All metrics now pass Google's thresholds.
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
                      <span><strong className="text-foreground">Technical SEO issues</strong> can completely negate great content efforts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <span><strong className="text-foreground">Core Web Vitals optimization</strong> led to immediate ranking improvements</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <span><strong className="text-foreground">Systematic auditing</strong> helped prioritize fixes that had the biggest impact</span>
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
                Ready to Fix Your Technical SEO Issues?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Use the same audit tools and strategies that led to 156% traffic growth
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free 7-Day Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/site-audit">
                    Run Site Audit
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

