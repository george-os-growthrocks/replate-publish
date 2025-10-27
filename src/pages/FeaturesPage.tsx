import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, Search, TrendingUp, Link2, Target, Activity, Sparkles, 
  Settings, MapPin, ShoppingCart, Lightbulb, AlertTriangle, Brain,
  BarChart3, Eye, RefreshCw, Gauge, FileText, Bell, Zap, LineChart,
  Globe, Users, Shield, CheckCircle, Clock, TrendingDown
} from "lucide-react";

const features = [
  {
    category: "Core SEO Tools",
    icon: Search,
    items: [
      {
        icon: Search,
        title: "Keyword Research & Clustering",
        description: "Access 50M+ keywords with difficulty scores, search volumes, CPC data, and intelligent AI-powered clustering to identify profitable keyword opportunities.",
        benefits: ["50M+ keyword database", "AI clustering", "Search volume & CPC", "Competitor gap analysis"]
      },
      {
        icon: TrendingUp,
        title: "SERP Tracking & Analysis",
        description: "Monitor your rankings 24/7 across desktop, mobile, and tablet. Track SERP features, competitor positions, and get instant alerts for ranking changes.",
        benefits: ["Real-time tracking", "SERP feature detection", "Competitor monitoring", "Position history"]
      },
      {
        icon: Activity,
        title: "Ranking Tracker",
        description: "Track unlimited keywords with historical data, position changes, visibility trends, and automated reporting.",
        benefits: ["Unlimited keywords", "Historical data", "Automated reports", "Visibility metrics"]
      },
      {
        icon: Eye,
        title: "SERP Analysis",
        description: "Deep dive into search results with featured snippets analysis, PAA detection, local pack insights, and SERP feature optimization recommendations.",
        benefits: ["Featured snippet analysis", "PAA opportunities", "Local pack insights", "Optimization tips"]
      }
    ]
  },
  {
    category: "Technical SEO",
    icon: Settings,
    items: [
      {
        icon: BarChart3,
        title: "Full Site Audit",
        description: "Comprehensive crawl with 60+ technical SEO checks including Core Web Vitals, mobile-friendliness, schema markup, and indexability issues.",
        benefits: ["60+ SEO checks", "Core Web Vitals", "Mobile testing", "Schema validation"]
      },
      {
        icon: Gauge,
        title: "OnPage SEO Analysis",
        description: "Real-time analysis of title tags, meta descriptions, headings, content quality, internal linking, and on-page optimization recommendations.",
        benefits: ["Content scoring", "Meta tag analysis", "Internal linking", "Optimization tips"]
      },
      {
        icon: FileText,
        title: "Page Analysis",
        description: "Detailed performance metrics for each URL including clicks, impressions, CTR, average position, and improvement opportunities.",
        benefits: ["Performance metrics", "CTR analysis", "Position tracking", "Quick wins"]
      }
    ]
  },
  {
    category: "Backlink Intelligence",
    icon: Link2,
    items: [
      {
        icon: Link2,
        title: "Backlink Monitoring",
        description: "Track your backlink profile with quality scoring, anchor text analysis, referring domains, dofollow/nofollow tracking, and toxic link detection.",
        benefits: ["Quality scoring", "Anchor text analysis", "Toxic link detection", "New/lost links"]
      },
      {
        icon: Lightbulb,
        title: "Link Opportunities",
        description: "Discover high-quality link building opportunities from competitors, broken links, resource pages, and guest post opportunities.",
        benefits: ["Competitor backlinks", "Broken link finder", "Resource pages", "Guest post sites"]
      }
    ]
  },
  {
    category: "Competitor Intelligence",
    icon: Target,
    items: [
      {
        icon: Target,
        title: "Competitor Analysis",
        description: "Spy on competitors' keywords, content strategies, backlinks, ranking patterns, and identify gaps in your strategy.",
        benefits: ["Keyword gaps", "Content gaps", "Backlink gaps", "Traffic estimates"]
      },
      {
        icon: Lightbulb,
        title: "Content Gap Analysis",
        description: "Discover keywords and topics where competitors rank but you don't. Identify content opportunities and prioritize by search volume and difficulty.",
        benefits: ["Missing keywords", "Topic clusters", "Priority scoring", "Content briefs"]
      },
      {
        icon: RefreshCw,
        title: "Cannibalization Detection",
        description: "Identify pages competing for the same keywords, consolidate content, and fix keyword cannibalization issues automatically.",
        benefits: ["Auto-detection", "Consolidation tips", "Priority ranking", "Content briefs"]
      }
    ]
  },
  {
    category: "AI Content Engine",
    icon: Sparkles,
    items: [
      {
        icon: RefreshCw,
        title: "Content Repurposing",
        description: "Transform one piece of content into 8+ platform-optimized versions for Medium, LinkedIn, Reddit, X, YouTube, TikTok, Instagram, and SEO blogs.",
        benefits: ["8+ platforms", "AI optimization", "Tone adaptation", "SEO optimization"]
      },
      {
        icon: Brain,
        title: "SEO AI Assistant",
        description: "Context-aware AI chatbot trained on your SEO data, providing personalized recommendations, keyword suggestions, and strategy insights.",
        benefits: ["Trained on your data", "Personalized advice", "Strategy insights", "24/7 available"]
      },
      {
        icon: Sparkles,
        title: "Keyword Clustering",
        description: "AI-powered grouping of related keywords into topic clusters with search intent classification and content planning recommendations.",
        benefits: ["Intent classification", "Topic clusters", "N-gram similarity", "Content planning"]
      }
    ]
  },
  {
    category: "Local & E-commerce",
    icon: MapPin,
    items: [
      {
        icon: MapPin,
        title: "Local SEO & Google Maps",
        description: "Track local rankings, monitor Google Maps positions, manage citations, analyze reviews, and optimize for local pack appearances.",
        benefits: ["Local pack tracking", "Maps monitoring", "Citation management", "Review analysis"]
      },
      {
        icon: ShoppingCart,
        title: "Shopping & Product Research",
        description: "Analyze product listings, track shopping ads, monitor competitor prices, optimize product pages, and discover trending products.",
        benefits: ["Product tracking", "Price monitoring", "Competitor analysis", "Trend detection"]
      }
    ]
  },
  {
    category: "Performance & Alerts",
    icon: Bell,
    items: [
      {
        icon: Brain,
        title: "SEO Intelligence Dashboard",
        description: "AI-powered insights, performance predictions, algorithm impact analysis, and personalized recommendations based on your data.",
        benefits: ["AI predictions", "Algorithm alerts", "Deep insights", "Smart recommendations"]
      },
      {
        icon: AlertTriangle,
        title: "Algorithm Drop Detector",
        description: "Instant alerts for Google algorithm updates, analyze impact on your rankings, and receive recovery recommendations.",
        benefits: ["Update alerts", "Impact analysis", "Recovery tips", "Historical data"]
      },
      {
        icon: Bell,
        title: "Performance Alerts",
        description: "Real-time notifications for ranking changes, CTR opportunities, new backlinks, technical issues, and content opportunities.",
        benefits: ["Real-time alerts", "Custom triggers", "Email & in-app", "Priority scoring"]
      }
    ]
  },
  {
    category: "Integrations & Reporting",
    icon: Globe,
    items: [
      {
        icon: Globe,
        title: "Google Search Console Integration",
        description: "Direct integration with GSC for clicks, impressions, CTR, position data, and enhanced analytics with AI insights.",
        benefits: ["Real GSC data", "Enhanced analytics", "Historical comparison", "Export capabilities"]
      },
      {
        icon: BarChart3,
        title: "Advanced Analytics",
        description: "Deep dive analytics with custom date ranges, device segmentation, country targeting, and performance trending.",
        benefits: ["Custom reports", "Device breakdown", "Country analysis", "Trend detection"]
      },
      {
        icon: FileText,
        title: "White-Label Reports",
        description: "Generate branded PDF reports with your logo, custom branding, and client-ready presentations. (Enterprise only)",
        benefits: ["Custom branding", "PDF export", "Scheduled delivery", "Client portals"]
      }
    ]
  }
];

export default function FeaturesPage() {
  return (
    <>
      <Helmet>
        <title>All Features - AnotherSEOGuru | Complete SEO Platform</title>
        <meta 
          name="description" 
          content="Discover all 25+ powerful SEO features: keyword research, rank tracking, site audits, backlink monitoring, AI content generation, competitor analysis, and more. Try free for 7 days!" 
        />
        <meta name="keywords" content="SEO tools, keyword research, rank tracker, site audit, backlink checker, competitor analysis, AI content, local SEO" />
        <link rel="canonical" href="https://anotherseoguru.com/features" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          {/* Hero */}
          <div className="container mx-auto px-4 mb-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Dominate SEO
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                25+ powerful features combining traditional SEO tools with cutting-edge AI. 
                All in one beautiful, easy-to-use platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free 7-Day Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  7-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>

          {/* Features by Category */}
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-20">
              <div className="container mx-auto px-4">
                {/* Category Header */}
                <div className="max-w-4xl mx-auto text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <category.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">{category.category}</span>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
                  {category.items.map((feature, index) => (
                    <div
                      key={index}
                      className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                    >
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <feature.icon className="w-7 h-7 text-primary" />
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Benefits List */}
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* CTA Section */}
          <div className="container mx-auto px-4 mt-20">
            <div className="max-w-4xl mx-auto text-center rounded-3xl border border-border bg-card p-12">
              <Zap className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Ready to Dominate Search Rankings?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of businesses using AnotherSEOGuru to boost their SEO performance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free 7-Day Trial - No Credit Card Required
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                ✓ Full access to all features • ✓ Cancel anytime • ✓ No hidden fees
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
