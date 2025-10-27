import { 
  Search, 
  TrendingUp, 
  Link2, 
  Target, 
  Activity, 
  Sparkles, 
  Settings, 
  MapPin, 
  ShoppingCart, 
  Lightbulb, 
  AlertTriangle,
  Brain
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Keyword Research & Clustering",
    description: "Access 50M+ keywords with difficulty scores, search volumes, and intelligent clustering to find profitable opportunities."
  },
  {
    icon: TrendingUp,
    title: "SERP Tracking & Analysis",
    description: "Monitor your rankings 24/7 across desktop and mobile. Track competitors and identify SERP features to dominate."
  },
  {
    icon: Link2,
    title: "Backlink Monitoring",
    description: "Track your backlink profile with quality scoring, anchor text analysis, and competitor gap identification."
  },
  {
    icon: Target,
    title: "Competitor Analysis",
    description: "Spy on competitors' keywords, content strategies, backlinks, and ranking patterns to stay ahead."
  },
  {
    icon: Activity,
    title: "Ranking Tracker",
    description: "Track unlimited keywords with historical data, position changes, and visibility trends over time."
  },
  {
    icon: Sparkles,
    title: "AI Content Generation",
    description: "Generate platform-optimized content for Medium, LinkedIn, Reddit, X, YouTube, TikTok, Instagram, and blogs."
  },
  {
    icon: Settings,
    title: "Technical SEO Audits",
    description: "Run comprehensive site audits with 60+ checks including Core Web Vitals, mobile-friendliness, and technical issues."
  },
  {
    icon: MapPin,
    title: "Local SEO & Google Maps",
    description: "Track local rankings, monitor Google Maps positions, manage citations, and optimize for local pack."
  },
  {
    icon: ShoppingCart,
    title: "Shopping & Product Research",
    description: "Analyze product listings, track shopping ads, monitor competitor prices, and optimize for e-commerce."
  },
  {
    icon: Lightbulb,
    title: "Content Gap Analysis",
    description: "Discover keyword opportunities, identify content gaps, detect cannibalization, and plan your content strategy."
  },
  {
    icon: AlertTriangle,
    title: "Algorithm Drop Detector",
    description: "Get instant alerts for Google algorithm updates, analyze impact on your rankings, and receive recovery recommendations."
  },
  {
    icon: Brain,
    title: "SEO Intelligence Dashboard",
    description: "AI-powered insights, personalized recommendations, and predictive analytics to optimize your SEO strategy."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dominate SEO
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            The most comprehensive SEO platform with 12+ powerful features, all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

