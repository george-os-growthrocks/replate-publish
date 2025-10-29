import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, FileText, Zap, Calendar } from "lucide-react";
import { BreadcrumbListJsonLd } from "@/components/seo";

const caseStudies = [
  {
    slug: "ecommerce-organic-traffic-growth",
    title: "247% Organic Traffic Growth in 6 Months",
    excerpt: "How an e-commerce retailer used keyword clustering and rank tracking to increase traffic by 247% and revenue by 189%.",
    company: "E-commerce Retailer",
    industry: "E-commerce",
    results: ["247% traffic increase", "189% revenue growth", "12k+ new keywords"],
    icon: TrendingUp,
    color: "success"
  },
  {
    slug: "saas-content-lead-generation",
    title: "10,000+ Leads from SEO Content Strategy",
    excerpt: "How a B2B SaaS company used PAA extraction and AI content generation to create 120+ posts and generate 10,200+ leads.",
    company: "B2B SaaS",
    industry: "SaaS",
    results: ["10,200+ leads", "120+ blog posts", "312% traffic increase"],
    icon: FileText,
    color: "primary"
  },
  {
    slug: "technical-seo-audit-traffic-growth",
    title: "156% Traffic Increase from Technical SEO",
    excerpt: "How fixing 87 technical SEO issues led to 156% organic traffic growth in just 4 months.",
    company: "Media Company",
    industry: "Media",
    results: ["156% traffic growth", "87 issues fixed", "4 months"],
    icon: Zap,
    color: "secondary"
  }
];

export default function CaseStudiesPage() {
  return (
    <>
      <Helmet>
        <title>SEO Case Studies - Real Results from Real Clients | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="See how businesses achieved 156-247% organic traffic growth using AnotherSEOGuru. Real case studies from e-commerce, SaaS, and media companies." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/case-studies" />
        <meta property="og:title" content="SEO Case Studies - Real Results | AnotherSEOGuru" />
        <meta property="og:description" content="See how businesses achieved 156-247% organic traffic growth using our SEO tools and strategies." />
        <meta property="og:type" content="website" />
      </Helmet>
      <BreadcrumbListJsonLd 
        items={[
          { name: "Home", url: "https://anotherseoguru.com" },
          { name: "Case Studies", url: "https://anotherseoguru.com/case-studies" }
        ]} 
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-32 pb-20">
          {/* Hero */}
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-4xl text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Real Results
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                SEO Case Studies:
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Real Results from Real Clients
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Learn how businesses achieved 156-247% organic traffic growth using AnotherSEOGuru's tools and strategies.
              </p>
            </div>
          </section>

          {/* Case Studies Grid */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="grid md:grid-cols-3 gap-8">
                {caseStudies.map((study, index) => {
                  const Icon = study.icon;
                  return (
                    <Link
                      key={index}
                      to={`/case-studies/${study.slug}`}
                      className="group"
                    >
                      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                        <CardContent className="p-6">
                          <div className={`w-12 h-12 rounded-xl bg-${study.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-6 h-6 text-${study.color}`} />
                          </div>
                          <Badge variant="outline" className="mb-3">{study.industry}</Badge>
                          <h2 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                            {study.title}
                          </h2>
                          <p className="text-muted-foreground mb-6">
                            {study.excerpt}
                          </p>
                          <div className="space-y-2 mb-6">
                            {study.results.map((result, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full bg-${study.color}`} />
                                <span className="text-muted-foreground">{result}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                            Read Case Study
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
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
                Start using the same tools and strategies our clients used to grow their organic traffic
              </p>
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/auth">
                  Start Free 7-Day Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

