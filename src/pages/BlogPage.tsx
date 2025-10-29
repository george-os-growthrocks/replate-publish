import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { BreadcrumbListJsonLd } from "@/components/seo";

const blogPosts = [
  {
    slug: "free-seo-tools-2026",
    title: "Free SEO Tools 2026: 10 Game-Changing Tools to Boost Your Rankings Instantly",
    excerpt: "Discover the best free SEO tools for 2026 — AI Overview Checker, Keyword Clustering, Heading Analyzer, Schema Generator, and more.",
    author: "SEO Team",
    date: "October 29, 2025",
    readTime: "9 min read",
    category: "SEO Tools",
    image: "/hero-image.jpg"
  },
  {
    slug: "free-seo-toolkit-2026",
    title: "The Ultimate Free SEO Toolkit for 2026 (No Sign-Up, No Fluff)",
    excerpt: "Build your free SEO stack: title sim, PAA extractor, schema generator, CWV pulse, log analyzer, and more. Templates + metrics you can use today.",
    author: "SEO Team",
    date: "October 28, 2025",
    readTime: "8 min read",
    category: "SEO Tools",
    image: "/hero-image.jpg"
  },
  {
    slug: "llm-seo-chatgpt-perplexity",
    title: "LLM SEO: How to Get Cited by ChatGPT & Perplexity",
    excerpt: "A field guide to earning citations in ChatGPT and Perplexity: Q&A formatting, freshness, source-worthiness, schema, and measurement.",
    author: "SEO Team",
    date: "October 28, 2025",
    readTime: "7 min read",
    category: "AI Search",
    image: "/hero-image.jpg"
  },
  {
    slug: "log-file-seo-guide",
    title: "Log-File SEO: The Fastest Way to Find Crawl Waste",
    excerpt: "Learn to parse access logs, spot crawl traps, and fix budget-draining patterns—step by step with sample queries.",
    author: "SEO Team",
    date: "October 28, 2025",
    readTime: "9 min read",
    category: "Technical SEO",
    image: "/hero-image.jpg"
  },
  {
    slug: "hreflang-guide",
    title: "Hreflang Without Tears: ccTLDs vs. Subfolders vs. Subdomains",
    excerpt: "A pragmatic framework for choosing your international URL strategy—with hreflang templates that actually work.",
    author: "SEO Team",
    date: "October 28, 2025",
    readTime: "8 min read",
    category: "International SEO",
    image: "/hero-image.jpg"
  },
  {
    slug: "internal-linking-scale",
    title: "Internal Linking at Scale: From GSC Exports to Smart Anchors",
    excerpt: "Use queries, clusters, and templates to deploy internal links that move rankings—minus the manual pain.",
    author: "SEO Team",
    date: "October 28, 2025",
    readTime: "10 min read",
    category: "Content Strategy",
    image: "/hero-image.jpg"
  },
  {
    slug: "announcing-anotherseoguru-launch",
    title: "Announcing AnotherSEOGuru: The Most Advanced SEO Platform + AI Content Engine",
    excerpt: "We're thrilled to announce the launch of AnotherSEOGuru - a revolutionary SEO platform that combines 25+ powerful SEO tools with cutting-edge AI content generation.",
    author: "AnotherSEOGuru Team",
    date: "October 27, 2025",
    readTime: "8 min read",
    category: "Product Launch",
    image: "/hero-image.jpg"
  }
];

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title>SEO Blog - Expert Tips & Updates | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Stay updated with the latest SEO trends, tips, and strategies. Learn from experts about keyword research, rank tracking, content optimization, and more." 
        />
        <meta 
          name="keywords" 
          content="SEO blog, SEO tips, SEO strategy, keyword research, rank tracking, content optimization, technical SEO, AI SEO" 
        />
        <link rel="canonical" href="https://anotherseoguru.com/blog" />
        <meta property="og:title" content="SEO Blog - Expert Tips & Updates | AnotherSEOGuru" />
        <meta property="og:description" content="Stay updated with the latest SEO trends, tips, and strategies. Expert insights on keyword research, rank tracking, and content optimization." />
        <meta property="og:url" content="https://anotherseoguru.com/blog" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SEO Blog - AnotherSEOGuru" />
        <meta name="twitter:description" content="Expert SEO insights, tips, and strategies to dominate search rankings." />
      </Helmet>
      <BreadcrumbListJsonLd 
        items={[
          { name: "Home", url: "https://anotherseoguru.com" },
          { name: "Blog", url: "https://anotherseoguru.com/blog" }
        ]} 
      />
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          {/* Hero */}
          <div className="container mx-auto px-4 mb-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                SEO{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Blog
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Expert insights, tips, and strategies to dominate search rankings
              </p>
            </div>
          </div>

          {/* Blog Posts Grid */}
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <Link
                  key={index}
                  to={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  {/* Featured Image */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

