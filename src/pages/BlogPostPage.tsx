import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Sparkles, TrendingUp, Zap, CheckCircle } from "lucide-react";

export default function BlogPostPage() {
  const { slug } = useParams();
  
  const siteUrl = "https://anotherseoguru.com";
  const pageUrl = `${siteUrl}/blog/announcing-anotherseoguru-launch`;
  const ogImage = `${siteUrl}/og/anotherseoguru-launch.jpg`;

  // JSON-LD: Article (BlogPosting)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": pageUrl,
    "headline": "Announcing AnotherSEOGuru: The Most Advanced AI SEO Platform + AI Content Engine",
    "description": "Unify SEO: keyword research, rank tracking, technical audits, on-page analysis, backlinks, and a powerful content engine.",
    "author": { "@type": "Organization", "name": "AnotherSEOGuru Team" },
    "publisher": {
      "@type": "Organization",
      "name": "AnotherSEOGuru",
      "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo-icon.png` }
    },
    "image": [ogImage],
    "datePublished": "2025-10-28T09:00:00+02:00",
    "dateModified": "2025-10-28T09:00:00+02:00",
    "keywords": [
      "AI SEO platform",
      "keyword research",
      "rank tracking",
      "technical SEO audit",
      "on-page SEO analysis",
      "backlink monitoring",
      "content engine",
      "local SEO",
      "e-commerce SEO"
    ]
  };

  // JSON-LD: Product (SoftwareApplication)
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AnotherSEOGuru",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "softwareVersion": "1.0.0",
    "description": "All-in-one AI SEO platform unifying keyword research, rank tracking, technical audits, on-page analysis, backlink monitoring, and a powerful content engine.",
    "url": siteUrl,
    "brand": { "@type": "Brand", "name": "AnotherSEOGuru" },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "29.00",
      "highPrice": "299.00",
      "offerCount": "3"
    },
    "publisher": { "@type": "Organization", "name": "AnotherSEOGuru" }
  };

  const title = "AnotherSEOGuru: The AI SEO Platform for Faster Growth";
  const description = "Unify SEO: keyword research, rank tracking, technical audits, on-page analysis, backlinks, and a powerful content engine. Start your free 7-day trial.";

  return (
    <>
      <Helmet>
        {/* Primary */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="AnotherSEOGuru" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Robots */}
        <meta name="robots" content="index,follow,max-image-preview:large" />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          {/* Hero */}
          <div className="container mx-auto px-4 mb-12">
            <div className="max-w-4xl mx-auto">
              {/* Meta */}
              <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  Product Launch
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  October 28, 2025
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  10 min read
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                Announcing AnotherSEOGuru: The Most Advanced{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  AI SEO Platform + AI Content Engine
                </span>
              </h1>

              {/* Author */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">AnotherSEOGuru Team</p>
                  <p className="text-sm text-muted-foreground">Product & Engineering</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="container mx-auto px-4 mb-12">
            <div className="max-w-5xl mx-auto">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border border-border" />
            </div>
          </div>

          {/* Content */}
          <article className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert prose-headings:text-foreground">
              
              {/* Introduction */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">🚀 We're Live—With Eyes Wide Open</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Let's cut through the noise. The average SEO stack is a Frankenstein of dashboards, CSVs, and "insights" that arrive after the drop. It's expensive, slow, and brittle. <strong className="text-foreground">AnotherSEOGuru</strong> fixes that by consolidating the end-to-end workflow into a single <strong className="text-foreground">AI SEO platform</strong>—from <strong className="text-foreground">keyword research</strong> and <strong className="text-foreground">rank tracking</strong> to <strong className="text-foreground">technical SEO audit</strong>, <strong className="text-foreground">on-page SEO analysis</strong>, <strong className="text-foreground">backlink monitoring</strong>, and a production-grade <strong className="text-foreground">AI content engine</strong>. Fewer tools, tighter feedback loops, faster compounding.
              </p>

              {/* The Problem */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">The Problem We're Solving</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Teams juggle 5–10 tools, lose context between strategy and execution, and ship content that misses search intent. Publishing across LinkedIn, X, Medium, YouTube, TikTok, and your blog? That's a treadmill. The result: slow cycles, shallow topical authority, and too many vanity graphs. We built AnotherSEOGuru so planning, execution, and measurement finally operate in one operating system.
              </p>

              {/* Core Features */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">25+ Capabilities—One Command Center</h2>
              
              {/* Traditional SEO */}
              <div className="rounded-xl border border-border bg-card p-6 my-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Traditional SEO—leveled up by AI</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Keyword Research & Clustering:</strong>
                      <span className="text-muted-foreground"> A deep dataset with AI keyword clustering, search intent analysis, topical maps, and keyword gap detection for precision roadmaps.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Rank Tracking & SERP Intelligence:</strong>
                      <span className="text-muted-foreground"> A resilient rank tracker across desktop, mobile, and tablet with SERP features, pixel rank, and competitor overlays—understand why positions move.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Technical SEO Audit:</strong>
                      <span className="text-muted-foreground"> 60+ checks including Core Web Vitals, mobile-friendliness, schema validation, indexability, canonicalization, and crawl budget signals.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">On-Page SEO Analysis:</strong>
                      <span className="text-muted-foreground"> Real-time scoring of title tags, meta descriptions, headers, entity coverage, and content optimization suggestions.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Backlink Monitoring:</strong>
                      <span className="text-muted-foreground"> Track referring domains, anchor text analysis, link velocity, and toxicity to protect authority before issues escalate.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* AI Content Engine */}
              <div className="rounded-xl border border-border bg-card p-6 my-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">AI Content Engine—built for omnichannel</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Content Repurposing:</strong>
                      <span className="text-muted-foreground"> Turn one hero asset into platform-native posts for Medium, LinkedIn, Reddit, X, YouTube, TikTok, Instagram, and SEO blogs with tone and length tailored to each channel.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">SEO Assistant:</strong>
                      <span className="text-muted-foreground"> A context-aware copilot trained on your site and performance data that translates diagnostics into actionable next steps.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Smart Content Briefs:</strong>
                      <span className="text-muted-foreground"> Automated briefs that align search intent, prevent keyword cannibalization, and enforce topical authority standards.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Advanced Intelligence */}
              <div className="rounded-xl border border-border bg-card p-6 my-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Advanced Intelligence—proactive, not reactive</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Competitor Analysis:</strong>
                      <span className="text-muted-foreground"> Identify content themes, keyword gaps, and SERP features competitors own—and define the shortest path to overtake them.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Algorithm Drop Detector:</strong>
                      <span className="text-muted-foreground"> Early-warning signals with impact radius, root-cause hypotheses, and recovery recommendations.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Local SEO & Maps:</strong>
                      <span className="text-muted-foreground"> Grid-based tracking for local SEO, Google Maps rankings, GBP insights, and citations hygiene.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">E-commerce SEO:</strong>
                      <span className="text-muted-foreground"> Monitor product schema, shopping SERP real estate, and price-linked visibility fluctuations that affect conversion.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Built for Modern Teams */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">Built for Modern Teams (and Non-Negotiable Speed)</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Under the hood: a type-safe frontend, real-time database and authentication, scalable job queues, and an AI layer optimized for relevance and latency. Native Search Console integration pipelines performance data into the same workspace you use to plan and publish—closing the loop from insight → experiment → outcome.
              </p>

              {/* Pricing */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">Pricing That Doesn't Punish Ambition</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                The market normalized $500–$2,000/month. We didn't.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Starter ($29/mo):</strong> For solopreneurs and small teams validating growth loops</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Professional ($99/mo):</strong> For agencies and scale-ups needing deep rank tracking, site audit, and reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground"><strong className="text-foreground">Enterprise ($299/mo):</strong> For large orgs with white-label SEO reporting, roles, and governance</span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every plan includes a <strong className="text-foreground">7-day free trial</strong> with full access. Cancel anytime. No gotchas.
              </p>

              {/* Why Teams Switch */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">Why Teams Switch (and Stay)</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Because outputs per marketer matter. Consolidating keyword research, rank tracking, technical SEO, on-page SEO analysis, backlink monitoring, and content operations shrinks cycle time and grows topical authority. You'll capture more SERP features, publish with consistent cadence, and align content with search intent—without spreadsheet acrobatics.
              </p>

              {/* What's Next */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">What's Next on the Roadmap</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We ship fast and course-correct with customer signal:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Deeper competitor timelines with daily SERP feature diffs and content velocity tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">A browser extension for instant on-page and schema diagnostics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Expanded API surfaces for custom pipelines and dashboards</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Mobile apps (iOS & Android) for alerting on rank changes and CWV health</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Team collaboration: approvals, roles, and content SLAs</span>
                </li>
              </ul>

              {/* Who We're For */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">Who We're For</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                If you care about visibility, conversion, and operational sanity, you'll feel at home—founders, in-house SEOs, and agencies alike. Whether you're eliminating technical SEO debt, scaling AI content, pushing local SEO, or optimizing e-commerce SEO, AnotherSEOGuru is designed to accelerate compounding growth.
              </p>

              {/* CTA */}
              <h2 className="text-3xl font-bold mt-12 mb-6 text-foreground">Start Your Free 7-Day Trial</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Kick the tires. Stress the crawlers. Track visibility score week over week. Experience what happens when your AI SEO platform and execution finally coexist.
                <br /><br />
                Start free—no credit card, no friction, no vanity metrics. Just clean insights, fast iteration, and measurable gains.
              </p>

              {/* Final CTA */}
              <div className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 to-secondary/10 p-8 my-12">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Ready to Dominate Search?</h3>
                <p className="text-muted-foreground mb-6">
                  Start your free 7-day trial today. No credit card required.
                </p>
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Footer Note */}
              <div className="border-t border-border pt-8 mt-12">
                <p className="text-sm text-muted-foreground text-center">
                  Questions? Email{" "}
                  <a href="mailto:support@anotherseoguru.com" className="text-primary hover:underline font-semibold">
                    support@anotherseoguru.com
                  </a>
                </p>
              </div>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
}
