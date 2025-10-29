import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, FileText, Calendar, CheckCircle2, Zap } from "lucide-react";
import { RelatedLinksSection } from "@/components/blog/RelatedLinksSection";
import { BreadcrumbListJsonLd } from "@/components/seo";

export default function SaaSContentStrategyCaseStudy() {
  const relatedLinks = [
    {
      title: "PAA Extractor Tool",
      href: "/free-tools/paa-extractor",
      description: "Extract questions like they did",
      type: "tool" as const
    },
    {
      title: "Content Gap Analysis",
      href: "/content-gap",
      description: "Find content opportunities",
      type: "tool" as const
    },
    {
      title: "AI Content Generation",
      href: "/repurpose",
      description: "Create content faster",
      type: "tool" as const
    }
  ];

  return (
    <>
      <Helmet>
        <title>Case Study: How a SaaS Company Generated 10,000+ Leads from SEO Content | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Learn how a B2B SaaS company used PAA extraction, content gap analysis, and AI content generation to create 120+ blog posts and generate 10,000+ leads in 8 months." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/case-studies/saas-content-lead-generation" />
        <meta property="og:title" content="Case Study: 10,000+ Leads from SEO Content Strategy" />
        <meta property="og:description" content="How a SaaS company generated 10,000+ leads using PAA extraction, content gap analysis, and AI-powered content." />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content="2025-01-20T10:00:00Z" />
      </Helmet>
      <BreadcrumbListJsonLd 
        items={[
          { name: "Home", url: "https://anotherseoguru.com" },
          { name: "Case Studies", url: "https://anotherseoguru.com/case-studies" },
          { name: "SaaS Content Strategy", url: "https://anotherseoguru.com/case-studies/saas-content-lead-generation" }
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
                How a SaaS Company Generated{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  10,000+ Leads from SEO Content
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  January 20, 2025
                </div>
                <Badge variant="outline">Content Strategy</Badge>
                <Badge variant="outline">B2B SaaS</Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">120+</div>
                        <div className="text-sm text-muted-foreground">Blog Posts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-8 h-8 text-success" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">10,200+</div>
                        <div className="text-sm text-muted-foreground">Leads Generated</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-8 h-8 text-secondary" />
                      <div>
                        <div className="text-3xl font-bold text-foreground">85%</div>
                        <div className="text-sm text-muted-foreground">Faster Creation</div>
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
                    A B2B SaaS company in the project management space needed to scale content production to compete 
                    with established players. Their content team was overwhelmed, and they couldn't keep up with 
                    answering common customer questions that were ranking opportunities.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>Only publishing 2-3 blog posts per month</li>
                    <li>Missing answers to 200+ common customer questions</li>
                    <li>No systematic way to find content gaps</li>
                    <li>Competitors ranking for long-tail questions they should own</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">The Strategy</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    We implemented a data-driven content strategy using AnotherSEOGuru:
                  </p>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl font-bold text-primary">1</div>
                          <div>
                            <h3 className="font-bold mb-2 text-foreground">PAA Extraction</h3>
                            <p className="text-muted-foreground">
                              Used our PAA Extractor to identify 500+ questions customers were asking on Google. 
                              Grouped them into 15 main content pillars.
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
                            <h3 className="font-bold mb-2 text-foreground">Content Gap Analysis</h3>
                            <p className="text-muted-foreground">
                              Analyzed competitor content to find opportunities where we could provide better, 
                              more comprehensive answers.
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
                            <h3 className="font-bold mb-2 text-foreground">AI-Powered Content Creation</h3>
                            <p className="text-muted-foreground">
                              Used our AI content generation to create first drafts 85% faster, allowing the team 
                              to focus on editing and optimization rather than writing from scratch.
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
                        <h3 className="font-bold text-foreground mb-1">Content Velocity</h3>
                        <p className="text-muted-foreground">
                          Increased from 2-3 posts/month to 15+ posts/month. Published 120 high-quality articles in 8 months.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Lead Generation</h3>
                        <p className="text-muted-foreground">
                          Generated 10,200+ leads from organic content, with a 12% conversion rate on gated resources.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Rankings & Traffic</h3>
                        <p className="text-muted-foreground">
                          Organic traffic increased 312%, ranking #1-3 for 45+ target questions within 6 months.
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
                      <span><strong className="text-foreground">Question-based content</strong> generated 3x more leads than generic blog posts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <span><strong className="text-foreground">AI content generation</strong> allowed the team to scale without hiring more writers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <span><strong className="text-foreground">Systematic gap analysis</strong> ensured every piece of content had a clear ranking target</span>
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
                Ready to Scale Your Content Strategy?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Use the same tools and strategies this SaaS company used to generate 10,000+ leads
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free 7-Day Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/free-tools/paa-extractor">
                    Try PAA Extractor Free
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

