import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles, BookOpen, HelpCircle, Zap, TrendingUp } from "lucide-react";
import { freeToolsData, FreeTool } from "@/lib/free-tools-data";
import { ToolSEOSection } from "@/components/seo/ToolSEOSection";

// Related blog posts for tools
const relatedBlogPosts = [
  {
    slug: "google-search-operators-2025",
    title: "Google Search Operators: 2025 Master List & SEO Playbook",
    excerpt: "The 2025 field guide to Google search operators—what works, what's flaky, what's dead—and 21 real SEO workflows.",
    category: "Technical SEO",
    date: "October 29, 2025",
    readTime: "12 min read",
  },
  {
    slug: "free-seo-tools-2026",
    title: "Free SEO Tools 2026: 10 Game-Changing Tools to Boost Your Rankings",
    excerpt: "Discover the best free SEO tools for 2026 — AI Overview Checker, Keyword Clustering, Heading Analyzer, and more.",
    category: "SEO Tools",
    date: "October 29, 2025",
    readTime: "9 min read",
  },
  {
    slug: "hreflang-guide",
    title: "Hreflang Without Tears: ccTLDs vs. Subfolders vs. Subdomains",
    excerpt: "A pragmatic framework for choosing your international URL strategy—with hreflang templates that actually work.",
    category: "International SEO",
    date: "October 28, 2025",
    readTime: "8 min read",
  },
  {
    slug: "internal-linking-scale",
    title: "Internal Linking at Scale: From GSC Exports to Smart Anchors",
    excerpt: "Use queries, clusters, and templates to deploy internal links that move rankings—minus the manual pain.",
    category: "Content Strategy",
    date: "October 28, 2025",
    readTime: "10 min read",
  },
];

// FAQs about free tools
const faqs = [
  {
    question: "Are these SEO tools really free?",
    answer: "Yes! All tools on this page are completely free to use with no sign-up required. Some tools have daily usage limits to prevent abuse, but you can create a free account to unlock higher limits and save your results."
  },
  {
    question: "Do I need to sign up to use these tools?",
    answer: "No sign-up is required for most tools. However, creating a free account gives you benefits like higher daily limits, result history, bulk processing, and access to premium features."
  },
  {
    question: "How often are these tools updated?",
    answer: "We continuously update our tools based on Google algorithm changes, user feedback, and SEO best practices. All tools are kept current with 2025 SEO standards and Google API changes."
  },
  {
    question: "Can I use these tools for client work?",
    answer: "Absolutely! These tools are perfect for agencies and freelancers. For white-label reports, unlimited usage, and advanced features, check out our Pro and Agency plans."
  },
  {
    question: "Are the results accurate?",
    answer: "Yes. Our tools use official Google APIs (PageSpeed Insights, Search Console API) and industry-standard SEO libraries. The same data sources used by premium SEO platforms—just without the subscription fee."
  },
  {
    question: "Can I export results?",
    answer: "Yes! Every tool supports CSV export, and many include JSON output for developers. Sign up for a free account to unlock bulk exports and access your result history."
  },
  {
    question: "What's the difference between free and paid accounts?",
    answer: "Free accounts get access to all tools with generous daily limits. Paid plans offer unlimited usage, priority support, bulk processing, white-label reports, API access, and advanced analytics."
  },
  {
    question: "How do these tools compare to Ahrefs, SEMrush, or SurferSEO?",
    answer: "Our tools focus on specific, high-value tasks without the bloat. While premium platforms offer comprehensive suites, our free tools excel at their specific functions—often with better UX and faster results. Perfect for focused optimization tasks."
  },
];

export default function FreeToolsPage() {
  const categories = {
    "on-page": "On-Page Optimization",
    "technical": "Technical SEO",
    "content": "Content & AI",
    "research": "Keyword Research",
    "social": "Social Media",
  };

  const allTools = freeToolsData.filter(t => t.status === "live");
  const toolCount = allTools.length;

  return (
    <>
      <Helmet>
        <title>Free SEO Tools - No Sign-Up Required | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content={`Access ${toolCount}+ free SEO tools: title simulator, schema generator, PAA extractor, CWV checker, hreflang builder, search operators builder, and more. No sign-up required.`}
        />
        <meta 
          name="keywords" 
          content="free SEO tools, meta tags generator, schema generator, PAA extractor, heading analyzer, robots.txt generator, CWV checker, hreflang builder, search operators, keyword clustering"
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools" />
        <meta property="og:title" content="Free SEO Tools - No Sign-Up Required | AnotherSEOGuru" />
        <meta property="og:description" content={`Access ${toolCount}+ professional SEO tools available for free. No sign-up required.`} />
        <meta property="og:url" content="https://anotherseoguru.com/free-tools" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free SEO Tools - AnotherSEOGuru" />
        <meta name="twitter:description" content={`${toolCount}+ professional SEO tools available for free. No sign-up required.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-20">
          {/* Hero */}
          <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-12">
                <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1.5">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {toolCount}+ Free Tools Available
                </Badge>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight">
                  Professional SEO Tools
                  <span className="block mt-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    100% Free Forever
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                  Ship better pages, fix technical issues, and make data-driven decisions. No sign-up, no fluff—just tools that actually work.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-8 text-sm md:text-base mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <span className="font-medium">No Sign-Up Required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <span className="font-medium">100% Free</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <span className="font-medium">Export Results</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <span className="font-medium">Latest 2025 Updates</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {[
                  { label: "On-Page Tools", count: allTools.filter(t => t.category === "on-page").length },
                  { label: "Technical SEO", count: allTools.filter(t => t.category === "technical").length },
                  { label: "Research Tools", count: allTools.filter(t => t.category === "research").length },
                  { label: "Content & AI", count: allTools.filter(t => t.category === "content").length },
                ].map((stat, idx) => (
                  <Card key={idx} className="text-center border-border">
                    <CardContent className="p-6">
                      <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {stat.count}
                      </div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* All Tools by Category */}
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  All Free SEO Tools
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {toolCount} professional tools ready to use—no account needed. Browse by category or search for what you need.
                </p>
              </div>

              {Object.entries(categories).map(([categoryKey, categoryName]) => {
                const categoryTools = allTools.filter(t => t.category === categoryKey);
                if (categoryTools.length === 0) return null;

                return (
                  <div key={categoryKey} className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full" />
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                        {categoryName}
                      </h3>
                      <Badge variant="secondary" className="ml-auto">
                        {categoryTools.length} {categoryTools.length === 1 ? "tool" : "tools"}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryTools.map((tool: FreeTool) => {
                        const Icon = tool.icon;
                        return (
                          <Card 
                            key={tool.id} 
                            className="group hover:shadow-xl transition-all hover:border-primary/50 hover:-translate-y-1 bg-card"
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                                  <Icon className="w-7 h-7 text-primary" />
                                </div>
                                <Badge className="bg-success/10 text-success border-success/20">
                                  FREE
                                </Badge>
                              </div>
                              <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2">
                                {tool.title}
                              </CardTitle>
                              <CardDescription className="text-base leading-relaxed">
                                {tool.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <Button asChild className="w-full gradient-primary group/btn">
                                <Link to={tool.href} className="flex items-center justify-center gap-2">
                                  Try it Now
                                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                              </Button>
                              {tool.relatedCourse && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <BookOpen className="w-3 h-3" />
                                  <span>Related: <Link to="/blog" className="text-primary hover:underline">{tool.relatedCourse}</Link></span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Related Blog Posts */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="container mx-auto max-w-6xl">
              <div className="flex items-center gap-3 mb-8">
                <BookOpen className="w-8 h-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Learn More: Related Blog Posts
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
                Deep dive into SEO strategies, tool workflows, and optimization techniques covered in our blog.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {relatedBlogPosts.map((post) => (
                  <Card key={post.slug} className="group hover:shadow-lg transition-all hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {post.readTime}
                        </span>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2">
                        <Link to={`/blog/${post.slug}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="leading-relaxed">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/blog/${post.slug}`}>
                          Read Article
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-10">
                <Button asChild variant="outline" size="lg">
                  <Link to="/blog">
                    View All Blog Posts
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* FAQs Section */}
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center gap-3 mb-8">
                <HelpCircle className="w-8 h-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-10">
                Everything you need to know about our free SEO tools.
              </p>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq, idx) => (
                  <AccordionItem 
                    key={idx} 
                    value={`item-${idx}`}
                    className="border border-border rounded-lg px-6 bg-card"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-5xl">
              <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/20 overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,white,transparent)]" />
                <CardContent className="p-12 text-center relative">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Upgrade Available</span>
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                    Want Even More Power?
                  </h2>
                  <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                    Unlock unlimited usage, advanced features, bulk processing, professional reporting, and API access with a free account. Plus get priority support and white-label reports.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="gradient-primary text-lg px-8">
                      <Link to="/auth">
                        Sign Up Free
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="text-lg px-8">
                      <Link to="/pricing">
                        View Pricing Plans
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span>Unlimited Usage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span>Bulk Processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span>API Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span>White-Label Reports</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}