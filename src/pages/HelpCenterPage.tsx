import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Search, 
  Zap, 
  Settings, 
  Code, 
  FileText,
  Shield,
  CreditCard,
  ArrowRight,
  Brain,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface HelpArticle {
  title: string;
  description: string;
  href: string;
  updated: string;
}

const helpCategories = {
  "getting-started": {
    title: "Getting Started",
    icon: Zap,
    articles: [
      {
        title: "Connect Google Search Console",
        description: "Step-by-step guide to connecting your GSC property",
        href: "/help/connect-search-console",
        updated: "2025-10-20",
      },
      {
        title: "Connect Google Analytics",
        description: "Integrate GA4 for deeper traffic insights",
        href: "/help/connect-analytics",
        updated: "2025-10-18",
      },
      {
        title: "Verify Your Website",
        description: "Domain verification methods and troubleshooting",
        href: "/help/verify-website",
        updated: "2025-10-15",
      },
    ] as HelpArticle[],
  },
  "keyword-intelligence": {
    title: "Keyword Intelligence",
    icon: Search,
    articles: [
      {
        title: "How Keyword Clustering Works",
        description: "Understanding semantic grouping and intent analysis",
        href: "/help/keyword-clustering-guide",
        updated: "2025-10-22",
      },
      {
        title: "Choosing Parent vs. Child Pages",
        description: "Internal linking strategy for clustered keywords",
        href: "/help/parent-child-pages",
        updated: "2025-10-20",
      },
      {
        title: "Mapping Search Intents",
        description: "Categorize informational, commercial, and transactional queries",
        href: "/help/search-intent-mapping",
        updated: "2025-10-18",
      },
    ] as HelpArticle[],
  },
  "onpage-tools": {
    title: "On-Page Tools",
    icon: FileText,
    articles: [
      {
        title: "Using the Title Simulator",
        description: "Optimize meta titles for desktop and mobile SERPs",
        href: "/help/title-simulator",
        updated: "2025-10-25",
      },
      {
        title: "Schema Generator FAQ",
        description: "Common schema markup questions answered",
        href: "/help/schema-faq",
        updated: "2025-10-24",
      },
      {
        title: "Hreflang Builder Guide",
        description: "International SEO tag implementation",
        href: "/help/hreflang-guide",
        updated: "2025-10-22",
      },
    ] as HelpArticle[],
  },
  "technical-seo": {
    title: "Technical SEO",
    icon: Code,
    articles: [
      {
        title: "Crawl Budget Basics",
        description: "How Googlebot allocates crawl resources",
        href: "/help/crawl-budget",
        updated: "2025-10-20",
      },
      {
        title: "Fixing 4xx/5xx Errors",
        description: "Diagnose and resolve server errors",
        href: "/help/fix-errors",
        updated: "2025-10-18",
      },
      {
        title: "Canonical Conflicts",
        description: "Resolve duplicate content issues",
        href: "/help/canonical-conflicts",
        updated: "2025-10-15",
      },
      {
        title: "Core Web Vitals Troubleshooting",
        description: "Improve LCP, INP, and CLS scores",
        href: "/help/cwv-troubleshooting",
        updated: "2025-10-28",
      },
    ] as HelpArticle[],
  },
  "content-aeo": {
    title: "Content & AEO",
    icon: Brain,
    articles: [
      {
        title: "Writing Extraction-Ready Intros",
        description: "Format content for LLM citation",
        href: "/help/extraction-ready-content",
        updated: "2025-10-27",
      },
      {
        title: "Updating Content with Changelogs",
        description: "Signal freshness to search engines and AI",
        href: "/help/content-changelogs",
        updated: "2025-10-26",
      },
      {
        title: "Measuring Perplexity Citations",
        description: "Track when AI engines cite your content",
        href: "/help/measure-citations",
        updated: "2025-10-25",
      },
    ] as HelpArticle[],
  },
  "billing": {
    title: "Billing & Accounts",
    icon: CreditCard,
    articles: [
      {
        title: "Plans and Pricing",
        description: "Understand our pricing tiers and features",
        href: "/pricing",
        updated: "2025-10-20",
      },
      {
        title: "Usage Caps and Overages",
        description: "How credits work and what happens when you exceed limits",
        href: "/help/usage-caps",
        updated: "2025-10-18",
      },
      {
        title: "Data Retention Policy",
        description: "How long we store your SEO data",
        href: "/help/data-retention",
        updated: "2025-10-15",
      },
    ] as HelpArticle[],
  },
  "security": {
    title: "Security & Privacy",
    icon: Shield,
    articles: [
      {
        title: "Data Handling & Privacy",
        description: "How we protect your data",
        href: "/privacy",
        updated: "2025-10-20",
      },
      {
        title: "Log Storage and Access",
        description: "What logs we keep and who can access them",
        href: "/help/log-storage",
        updated: "2025-10-18",
      },
      {
        title: "Deletion Requests (GDPR)",
        description: "How to request account and data deletion",
        href: "/gdpr",
        updated: "2025-10-15",
      },
    ] as HelpArticle[],
  },
};

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof helpCategories>("getting-started");

  return (
    <>
      <Helmet>
        <title>Help Center - AnotherSEOGuru Documentation</title>
        <meta 
          name="description" 
          content="Find answers to common questions, learn how to use our SEO tools, and get the most out of your subscription." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
            <div className="container mx-auto max-w-4xl text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                How Can We Help?
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Search our knowledge base or browse by category
              </p>
              
              {/* Search */}
              <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search for articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-6xl">
              <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as keyof typeof helpCategories)}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8">
                  {Object.entries(helpCategories).map(([key, category]) => {
                    const Icon = category.icon;
                    return (
                      <TabsTrigger key={key} value={key} className="gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{category.title}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {Object.entries(helpCategories).map(([key, category]) => (
                  <TabsContent key={key} value={key} className="space-y-4">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">{category.title}</h2>
                      <p className="text-muted-foreground">
                        {category.articles.length} articles in this category
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {category.articles.map((article, idx) => (
                        <Card key={idx} className="group hover:shadow-lg transition-all hover:border-primary/50">
                          <CardHeader>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {article.title}
                            </CardTitle>
                            <CardDescription>{article.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                Updated {article.updated}
                              </Badge>
                              <Link 
                                to={article.href}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                Read more
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </section>

          {/* Still Need Help */}
          <section className="py-12 px-4 bg-muted/30">
            <div className="container mx-auto max-w-4xl">
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-3">Still Need Help?</h3>
                  <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <Link to="/contact">
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      Contact Support
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
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

