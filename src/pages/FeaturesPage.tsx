import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  ArrowRight, Search, TrendingUp, Link2, Target, Activity, Sparkles, 
  Settings, MapPin, ShoppingCart, Lightbulb, AlertTriangle, Brain,
  BarChart3, Eye, RefreshCw, Gauge, FileText, Bell, Zap, LineChart,
  Globe, Users, Shield, CheckCircle, Clock, TrendingDown, Rocket,
  Crown, Star, ArrowUpRight, Play, Code, Lock, Unlock, Timer,
  Sparkle, Layers, Database, GitBranch, BarChart2
} from "lucide-react";
import { FEATURES, getFeaturesForPlan, type PlanName } from "@/lib/feature-access";

const planFeatures = {
  Launch: {
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    highlight: "Perfect for Freelancers",
    description: "Essential SEO tools to get started",
    features: [
      "Keyword Research & Ideas (50M+ database)",
      "Autocomplete Expansions",
      "PAA / Answer The Public",
      "Keyword Clustering (AI-powered)",
      "SERP Overview (top 10 analysis)",
      "Rank Tracking (250 keywords/day)",
      "Meta Generator (titles & descriptions)",
      "Lite Tech Audit (1k URLs per crawl)",
      "Sample CWV (up to 50 URLs/mo)",
      "Schema Validator",
      "AI Overview Checker (Basic)",
    ],
    limits: {
      projects: 3,
      credits: "1,200",
      keywords: "250/day",
      crawl: "10k URLs/mo",
      reports: 5
    }
  },
  Growth: {
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    highlight: "Most Popular",
    description: "Everything freelancers need + team collaboration",
    features: [
      "Everything in Launch",
      "AI Content Briefs",
      "SERP Similarity Analysis",
      "Competitor Analysis",
      "Content Gap Discovery",
      "Backlink Lookups",
      "Local SEO Audit (light)",
      "Bulk URL Analyzer",
      "Scheduled Reports",
      "Priority Chat Support",
    ],
    limits: {
      seats: 3,
      projects: 10,
      credits: "6,000",
      keywords: "1,250/day",
      crawl: "100k URLs/mo",
      reports: 20
    }
  },
  Agency: {
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    highlight: "For Agencies",
    description: "Scale your agency with automation & white-label",
    features: [
      "Everything in Growth",
      "White-Label Reports",
      "API Access (read)",
      "Competitor Monitoring (automated)",
      "Backlink Monitoring (continuous)",
      "AI Overview Optimization",
      "Citation Optimization",
      "Workflow Automations",
      "Priority Support",
    ],
    limits: {
      seats: 10,
      projects: 30,
      credits: "20,000",
      keywords: "5,000/day",
      crawl: "400k URLs/mo",
      reports: 60
    }
  },
  Scale: {
    icon: Sparkles,
    color: "from-indigo-500 to-purple-500",
    highlight: "Enterprise",
    description: "Custom solutions for large organizations",
    features: [
      "Everything in Agency",
      "SSO/SAML Integration",
      "Custom Limits (contracted)",
      "Private Data Retention",
      "SLAs & DPAs",
      "Audit Logs",
      "Dedicated Customer Success Manager",
      "Custom Connectors",
    ],
    limits: {
      seats: "Custom",
      projects: "Custom",
      credits: "Custom",
      keywords: "Custom",
      crawl: "Custom",
      reports: "Custom"
    }
  }
};

const featureCategories = [
  {
    category: "Keyword Intelligence",
    icon: Search,
    description: "Discover and cluster keywords like never before",
    features: [
      {
        name: "50M+ Keyword Database",
        description: "Access the largest keyword database with search volumes, CPC, and difficulty scores",
        icon: Database,
        plan: "Launch" as PlanName
      },
      {
        name: "AI-Powered Clustering",
        description: "Automatically group related keywords by intent and similarity using advanced ML algorithms",
        icon: Sparkle,
        plan: "Launch" as PlanName
      },
      {
        name: "Autocomplete Expansions",
        description: "Get real-time keyword suggestions from Google's autocomplete across 50+ languages",
        icon: Layers,
        plan: "Launch" as PlanName
      },
      {
        name: "PAA & Answer The Public",
        description: "Discover what questions people actually ask about your topics",
        icon: Lightbulb,
        plan: "Launch" as PlanName
      },
      {
        name: "SERP Similarity",
        description: "Compare SERP landscapes to find keyword opportunities and content gaps",
        icon: GitBranch,
        plan: "Growth" as PlanName
      }
    ]
  },
  {
    category: "Rank Tracking & SERP Analysis",
    icon: TrendingUp,
    description: "Track rankings 24/7 with intelligent insights",
    features: [
      {
        name: "Real-Time Rank Tracking",
        description: "Monitor thousands of keywords daily with position history, CTR analysis, and trend alerts",
        icon: Activity,
        plan: "Launch" as PlanName
      },
      {
        name: "SERP Feature Detection",
        description: "Track featured snippets, People Also Ask, image packs, and other SERP features",
        icon: Eye,
        plan: "Launch" as PlanName
      },
      {
        name: "AI Overview Rankings",
        description: "Check and optimize your appearance in Google's AI Overviews (Gemini, ChatGPT, Perplexity)",
        icon: Brain,
        plan: "Launch" as PlanName
      },
      {
        name: "AI Overview Optimization",
        description: "Advanced optimization strategies to maximize AI Overview citations and visibility",
        icon: Sparkles,
        plan: "Agency" as PlanName
      },
      {
        name: "LLM Citation Tracker",
        description: "Track if your domain appears in ChatGPT, Claude, Gemini, and Perplexity responses",
        icon: Target,
        plan: "Launch" as PlanName
      }
    ]
  },
  {
    category: "AI Content Engine",
    icon: Brain,
    description: "Generate and optimize content with AI",
    features: [
      {
        name: "Content Repurposing",
        description: "Transform one piece of content into 8+ platform-optimized versions (Medium, LinkedIn, X, YouTube, TikTok, Instagram, Reddit, SEO blog)",
        icon: RefreshCw,
        plan: "Launch" as PlanName
      },
      {
        name: "AI Content Briefs",
        description: "Generate comprehensive, SEO-optimized content briefs with keyword targeting, competitor analysis, and structure recommendations",
        icon: FileText,
        plan: "Growth" as PlanName
      },
      {
        name: "Meta Generator",
        description: "AI-powered title tags and meta descriptions optimized for CTR and rankings",
        icon: Zap,
        plan: "Launch" as PlanName
      },
      {
        name: "SEO AI Assistant",
        description: "Context-aware chatbot trained on your SEO data, providing personalized recommendations 24/7",
        icon: Sparkles,
        plan: "Launch" as PlanName
      },
      {
        name: "Citation Optimization",
        description: "Optimize content to maximize citations in AI responses (ChatGPT, Gemini, Claude)",
        icon: TrendingUp,
        plan: "Agency" as PlanName
      }
    ]
  },
  {
    category: "Technical SEO",
    icon: Settings,
    description: "Complete technical audits and optimizations",
    features: [
      {
        name: "Site Crawler & Audit",
        description: "Crawl up to 1k URLs per run with 60+ technical SEO checks including Core Web Vitals, mobile-friendliness, and schema validation",
        icon: Gauge,
        plan: "Launch" as PlanName
      },
      {
        name: "Core Web Vitals",
        description: "Sample CWV checks for key pages (up to 50 URLs/mo on Launch, unlimited on higher plans)",
        icon: BarChart3,
        plan: "Launch" as PlanName
      },
      {
        name: "Schema Validator",
        description: "Validate and test structured data markup across your entire site",
        icon: CheckCircle,
        plan: "Launch" as PlanName
      },
      {
        name: "Bulk URL Analyzer",
        description: "Analyze hundreds of URLs simultaneously for on-page SEO factors",
        icon: Layers,
        plan: "Growth" as PlanName
      },
      {
        name: "Technical Issue Detection",
        description: "Automatically identify indexability issues, redirect chains, duplicate content, and more",
        icon: AlertTriangle,
        plan: "Launch" as PlanName
      }
    ]
  },
  {
    category: "Competitive Intelligence",
    icon: Target,
    description: "Outsmart your competitors",
    features: [
      {
        name: "Competitor Analysis",
        description: "Spy on competitors' keywords, content strategies, backlinks, and ranking patterns",
        icon: Eye,
        plan: "Growth" as PlanName
      },
      {
        name: "Content Gap Analysis",
        description: "Discover keywords and topics where competitors rank but you don't. Prioritized by search volume and difficulty",
        icon: Lightbulb,
        plan: "Growth" as PlanName
      },
      {
        name: "Cannibalization Detection",
        description: "AI-powered detection of pages competing for the same keywords with consolidation recommendations",
        icon: RefreshCw,
        plan: "Launch" as PlanName
      },
      {
        name: "Backlink Analysis",
        description: "Analyze backlink profiles, identify toxic links, discover link opportunities from competitors",
        icon: Link2,
        plan: "Growth" as PlanName
      },
      {
        name: "Competitor Monitoring",
        description: "Automated daily tracking of competitor rankings, backlinks, and content changes",
        icon: Bell,
        plan: "Agency" as PlanName
      },
      {
        name: "Backlink Monitoring",
        description: "Continuous monitoring of your backlink profile with quality scoring and alerts",
        icon: Activity,
        plan: "Agency" as PlanName
      }
    ]
  },
  {
    category: "Reporting & Automation",
    icon: FileText,
    description: "Professional reports and workflow automation",
    features: [
      {
        name: "Scheduled Reports",
        description: "Automatically generate and email SEO reports on your schedule",
        icon: Clock,
        plan: "Growth" as PlanName
      },
      {
        name: "White-Label Reports",
        description: "Fully branded PDF reports with your logo for client presentations",
        icon: Shield,
        plan: "Agency" as PlanName
      },
      {
        name: "API Access",
        description: "Integrate SEO data into your own tools and dashboards (read access)",
        icon: Code,
        plan: "Agency" as PlanName
      },
      {
        name: "Workflow Automations",
        description: "Build custom automations with triggers and actions for repetitive SEO tasks",
        icon: GitBranch,
        plan: "Agency" as PlanName
      },
      {
        name: "Advanced Analytics",
        description: "Custom date ranges, device segmentation, country targeting, and performance trending",
        icon: BarChart2,
        plan: "Launch" as PlanName
      }
    ]
  },
  {
    category: "Specialized SEO",
    icon: MapPin,
    description: "Local, e-commerce, and specialized features",
    features: [
      {
        name: "Local SEO Audit",
        description: "Complete local SEO analysis including Google Maps rankings, citations, and NAP consistency",
        icon: MapPin,
        plan: "Growth" as PlanName
      },
      {
        name: "Shopping & Product Research",
        description: "Analyze product listings, track shopping ads, monitor competitor prices",
        icon: ShoppingCart,
        plan: "Launch" as PlanName
      },
      {
        name: "Google Search Console Integration",
        description: "Direct integration with real GSC data for clicks, impressions, CTR, and position metrics",
        icon: Globe,
        plan: "Launch" as PlanName
      }
    ]
  }
];

const stats = [
  { label: "Keywords Tracked", value: "50M+", icon: Database },
  { label: "Technical Checks", value: "60+", icon: Settings },
  { label: "Content Platforms", value: "8+", icon: RefreshCw },
  { label: "AI Models Tracked", value: "4", icon: Brain },
];

const socialProof = [
  {
    quote: "AnotherSEOGuru saved us 20+ hours per week on keyword research and reporting. The ROI was immediate.",
    author: "Sarah Chen",
    role: "SEO Manager",
    company: "Tech Startup"
  },
  {
    quote: "The AI content briefs are game-changing. Our content team produces better-quality articles in half the time.",
    author: "Marcus Johnson",
    role: "Content Director",
    company: "Digital Agency"
  },
  {
    quote: "Finally, an SEO tool that combines real GSC data with AI insights. This is what we've been waiting for.",
    author: "Emily Rodriguez",
    role: "Freelance SEO Consultant",
    company: "Independent"
  }
];

export default function FeaturesPage() {
  return (
    <>
      <Helmet>
        <title>25+ Powerful SEO Features - AnotherSEOGuru | Try Free for 7 Days</title>
        <meta 
          name="description" 
          content="Discover 25+ cutting-edge SEO features: AI content generation, rank tracking, competitor analysis, technical audits, and more. The most advanced SEO platform. Start your 7-day free trial today!" 
        />
        <meta name="keywords" content="SEO features, AI SEO tools, keyword research, rank tracking, content generation, technical SEO audit, competitor analysis" />
        <link rel="canonical" href="https://anotherseoguru.com/features" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-20">
          {/* Hero Section - Stunning & Unique */}
          <section className="relative overflow-hidden py-24 px-4">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[120px] animate-pulse delay-1000" />
            
            <div className="container mx-auto relative z-10">
              <div className="max-w-5xl mx-auto text-center">
                {/* Badge */}
                <Badge className="mb-6 px-4 py-1.5 text-sm bg-gradient-to-r from-primary to-secondary text-white border-0">
                  <Sparkles className="w-3 h-3 mr-2" />
                  The Most Advanced SEO Platform
                </Badge>
                
                <h1 className="text-6xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
                  Everything You Need to{" "}
                  <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent animate-gradient">
                    Dominate Search
                  </span>
                </h1>
                
                <p className="text-2xl md:text-3xl text-muted-foreground mb-4 font-light">
                  25+ powerful features. AI-powered insights. Real-time tracking.
                </p>
                
                <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Combine traditional SEO tools with cutting-edge AI to research keywords, track rankings, 
                  generate content, analyze competitors, and automate workflows—all in one beautiful platform.
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-all">
                      <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="text-lg px-8 py-6 h-auto gradient-primary shadow-lg hover:shadow-xl transition-all">
                    <Link to="/auth">
                      <Play className="w-5 h-5 mr-2" />
                      Start Free 7-Day Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2">
                    <Link to="/pricing">
                      View Pricing Plans
                      <ArrowUpRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>7-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Full access to all features</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features by Category - Interactive Cards */}
          {featureCategories.map((category, categoryIndex) => (
            <section key={categoryIndex} className="py-20 px-4">
              <div className="container mx-auto max-w-7xl">
                {/* Category Header */}
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 mb-6">
                    <category.icon className="w-6 h-6 text-primary" />
                    <span className="text-lg font-semibold text-primary">{category.category}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                    {category.category}
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {category.description}
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.features.map((feature, index) => {
                    const PlanIcon = planFeatures[feature.plan]?.icon || Zap;
                    const planColor = planFeatures[feature.plan]?.color || "from-blue-500 to-cyan-500";
                    
                    return (
                      <Card
                        key={index}
                        className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                      >
                        {/* Gradient Overlay on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${planColor} opacity-0 group-hover:opacity-5 transition-opacity`} />
                        
                        <CardContent className="p-6 relative z-10">
                          {/* Icon & Plan Badge */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${planColor} flex items-center justify-center shadow-lg`}>
                              <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <Badge className={`bg-gradient-to-r ${planColor} text-white border-0`}>
                              <PlanIcon className="w-3 h-3 mr-1" />
                              {feature.plan}
                            </Badge>
                          </div>
                          
                          {/* Title */}
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                            {feature.name}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-muted-foreground leading-relaxed mb-4">
                            {feature.description}
                          </p>
                          
                          {/* Arrow on Hover */}
                          <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-medium mr-2">Learn more</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}

          {/* Plan Comparison - Visual Feature Matrix */}
          <section className="py-20 px-4 bg-muted/30">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-16">
                <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                  Compare Plans
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  Choose the Perfect Plan for You
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Every plan includes all features. Higher plans unlock more usage limits, seats, projects, and priority support.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(planFeatures).map(([planName, plan]) => {
                  const PlanIcon = plan.icon;
                  const isPopular = planName === 'Growth';
                  
                  return (
                    <Card
                      key={planName}
                      className={`relative overflow-hidden border-2 ${
                        isPopular 
                          ? 'border-primary shadow-2xl scale-105' 
                          : 'border-border hover:border-primary/50'
                      } transition-all`}
                    >
                      {isPopular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 text-xs font-bold">
                          MOST POPULAR
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        {/* Plan Header */}
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                          <PlanIcon className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-2 text-foreground">{planName}</h3>
                        <p className="text-sm text-primary font-semibold mb-1">{plan.highlight}</p>
                        <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                        
                        {/* Limits */}
                        <div className="space-y-3 mb-6 pb-6 border-b">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Projects</span>
                            <span className="font-semibold">{plan.limits.projects}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Credits/mo</span>
                            <span className="font-semibold">{plan.limits.credits}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Keywords/day</span>
                            <span className="font-semibold">{plan.limits.keywords}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Crawl Budget</span>
                            <span className="font-semibold">{plan.limits.crawl}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Reports/mo</span>
                            <span className="font-semibold">{plan.limits.reports}</span>
                          </div>
                          {plan.limits.seats && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Seats</span>
                              <span className="font-semibold">{plan.limits.seats}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Features List */}
                        <div className="space-y-2 mb-6">
                          {plan.features.slice(0, 5).map((feature, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 5 && (
                            <div className="text-xs text-muted-foreground italic">
                              +{plan.features.length - 5} more features
                            </div>
                          )}
                        </div>
                        
                        {/* CTA */}
                        <Button 
                          asChild 
                          className={`w-full ${
                            isPopular 
                              ? 'gradient-primary' 
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                          size="lg"
                        >
                          <Link to="/auth">
                            {planName === 'Scale' ? 'Contact Sales' : 'Start Free Trial'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Social Proof Section */}
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  Loved by SEO Professionals Worldwide
                </h2>
                <p className="text-xl text-muted-foreground">
                  Join thousands of businesses using AnotherSEOGuru to dominate search rankings
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {socialProof.map((testimonial, i) => (
                  <Card key={i} className="border-2 hover:border-primary/50 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 leading-relaxed italic">
                        "{testimonial.quote}"
                      </p>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Unique Selling Points */}
          <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  Why AnotherSEOGuru Stands Out
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-6 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">AI-Powered Intelligence</h3>
                    <p className="text-muted-foreground">
                      Our AI is trained on billions of search queries and SERP data, giving you insights your competitors can't access.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">Real GSC Data</h3>
                    <p className="text-muted-foreground">
                      Direct integration with Google Search Console means you work with real performance data, not estimates.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-6 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">8+ Platform Content</h3>
                    <p className="text-muted-foreground">
                      One content piece automatically optimized for Medium, LinkedIn, X, YouTube, TikTok, Instagram, Reddit, and SEO.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Final CTA - Conversion Focused */}
          <section className="py-24 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
            
            <div className="container mx-auto max-w-4xl relative z-10">
              <Card className="border-2 border-primary/30 bg-card/80 backdrop-blur-lg shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-8 flex items-center justify-center shadow-lg">
                    <Rocket className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                    Ready to Dominate Search Rankings?
                  </h2>
                  
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Join thousands of SEO professionals using AnotherSEOGuru to boost rankings, 
                    automate workflows, and generate AI-optimized content. Start your 7-day free trial today.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Button asChild size="lg" className="text-lg px-10 py-7 h-auto gradient-primary shadow-xl hover:shadow-2xl transition-all">
                      <Link to="/auth">
                        <Play className="w-6 h-6 mr-2" />
                        Start Free 7-Day Trial
                        <ArrowRight className="w-6 h-6 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="text-lg px-10 py-7 h-auto border-2">
                      <Link to="/pricing">
                        Compare All Plans
                        <ArrowUpRight className="w-6 h-6 ml-2" />
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Full access to all 25+ features
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      No credit card required
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Cancel anytime
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      1,200 credits to start
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
