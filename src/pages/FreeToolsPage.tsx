import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { freeToolsData, FreeTool } from "@/lib/free-tools-data";

export default function FreeToolsPage() {
  const categories = {
    "on-page": "On-Page Optimization",
    "technical": "Technical SEO",
    "content": "Content & AI",
    "research": "Keyword Research",
    "social": "Social Media",
  };

  const liveTools = freeToolsData.filter(t => t.status === "live");
  const comingSoonTools = freeToolsData.filter(t => t.status === "coming-soon");

  return (
    <>
      <Helmet>
        <title>Free SEO Tools - No Sign-Up Required | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Access 15+ free SEO tools: title simulator, schema generator, PAA extractor, CWV checker, hreflang builder, and more. No sign-up required." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto max-w-5xl text-center">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                15+ Free Tools
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Professional SEO Tools
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  100% Free Forever
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Ship better pages, fix technical issues, and make data-driven decisions. No sign-up, no fluff—just tools that work.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No Sign-Up Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Export Results</span>
                </div>
              </div>
            </div>
          </section>

          {/* Live Tools */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-3">Available Now</h2>
                <p className="text-muted-foreground">
                  {liveTools.length} tools ready to use—no account needed
                </p>
              </div>

              {Object.entries(categories).map(([categoryKey, categoryName]) => {
                const categoryTools = liveTools.filter(t => t.category === categoryKey);
                if (categoryTools.length === 0) return null;

                return (
                  <div key={categoryKey} className="mb-12">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      {categoryName}
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryTools.map((tool: FreeTool) => {
                        const Icon = tool.icon;
                        return (
                          <Card key={tool.id} className="group hover:shadow-lg transition-all hover:border-primary/50">
                            <CardHeader>
                              <div className="flex items-start justify-between mb-2">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                  <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <Badge variant="secondary" className="text-xs">FREE</Badge>
                              </div>
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {tool.title}
                              </CardTitle>
                              <CardDescription>{tool.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <Link to={tool.href} className="flex items-center justify-center gap-2">
                                  Try it Free
                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                              </Button>
                              {tool.relatedCourse && (
                                <p className="text-xs text-muted-foreground mt-3 text-center">
                                  Learn more: {tool.relatedCourse}
                                </p>
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

          {/* Coming Soon */}
          {comingSoonTools.length > 0 && (
            <section className="py-12 px-4 bg-muted/30">
              <div className="container mx-auto max-w-6xl">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-3">Coming Soon</h2>
                  <p className="text-muted-foreground">
                    We're building even more tools to supercharge your SEO workflow
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comingSoonTools.map((tool: FreeTool) => {
                    const Icon = tool.icon;
                    return (
                      <Card key={tool.id} className="opacity-75">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <Badge variant="outline">SOON</Badge>
                          </div>
                          <CardTitle className="text-lg">{tool.title}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-4xl">
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-12 text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    Want Even More Power?
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Unlock unlimited usage, advanced features, bulk processing, and professional reporting with a free account
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button asChild size="lg" className="gradient-primary">
                      <Link to="/auth">
                        Sign Up Free
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link to="/pricing">
                        View Pricing
                      </Link>
                    </Button>
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

