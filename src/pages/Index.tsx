import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Target, TrendingUp, Zap, BarChart3, Link2, 
  Globe, Brain, FileText, Eye, Users, Smartphone,
  CheckCircle2, ArrowRight, Star, Sparkles, Award,
  Instagram, Youtube, Clock, MapPin, ShoppingCart
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      } else {
        setIsLoading(false);
      }
    });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Search,
      title: "Keyword Research",
      description: "Discover high-value keywords with search volume, competition, and trends",
      credits: 2,
      category: "Research"
    },
    {
      icon: Eye,
      title: "SERP Analysis",
      description: "Analyze Google search results with AI Overview, People Also Ask, and ranking features",
      credits: 3,
      category: "Analysis"
    },
    {
      icon: Target,
      title: "Competitor Analysis",
      description: "Spy on competitors' keywords, backlinks, and traffic strategies",
      credits: 5,
      category: "Intelligence"
    },
    {
      icon: Link2,
      title: "Backlink Analysis",
      description: "Discover and analyze backlink profiles for any domain",
      credits: 10,
      category: "Links"
    },
    {
      icon: BarChart3,
      title: "Rank Tracking",
      description: "Monitor your keyword positions across search engines daily",
      credits: 1,
      category: "Tracking"
    },
    {
      icon: Brain,
      title: "AI SEO Chat",
      description: "Get instant SEO advice from AI trained on your data",
      credits: 1,
      category: "AI"
    },
    {
      icon: Sparkles,
      title: "Content Repurpose",
      description: "Transform content for different platforms with AI",
      credits: 5,
      category: "Content"
    },
    {
      icon: FileText,
      title: "Answer The Public",
      description: "Find questions people ask about your topics",
      credits: 5,
      category: "Research"
    },
    {
      icon: Globe,
      title: "Local SEO",
      description: "Optimize for local search with GEO-specific insights",
      credits: 5,
      category: "Local"
    },
    {
      icon: ShoppingCart,
      title: "Shopping Analysis",
      description: "Optimize product listings for Google Shopping",
      credits: 3,
      category: "E-commerce"
    },
    {
      icon: Youtube,
      title: "YouTube SEO",
      description: "Optimize videos for YouTube search and discovery",
      credits: 3,
      category: "Social"
    },
    {
      icon: Instagram,
      title: "Instagram SEO",
      description: "Optimize hashtags and content for Instagram discovery",
      credits: 2,
      category: "Social"
    },
    {
      icon: Smartphone,
      title: "TikTok SEO",
      description: "Optimize for TikTok's search algorithm and trends",
      credits: 2,
      category: "Social"
    },
    {
      icon: Award,
      title: "Site Audit",
      description: "Complete technical SEO audit with actionable fixes",
      credits: 20,
      category: "Technical"
    },
    {
      icon: TrendingUp,
      title: "On-Page SEO",
      description: "Analyze and optimize individual pages for search",
      credits: 3,
      category: "On-Page"
    },
  ];

  const benefits = [
    "Real-time Google Search Console integration",
    "AI-powered insights and recommendations",
    "Competitor intelligence and monitoring",
    "Advanced SERP features simulation",
    "Multi-platform social media SEO",
    "GEO-specific local optimization",
    "Automated rank tracking",
    "White-label PDF reports",
  ];

  const stats = [
    { label: "Active Users", value: "10K+" },
    { label: "Keywords Tracked", value: "500K+" },
    { label: "Reports Generated", value: "50K+" },
    { label: "Average Rank Improvement", value: "+23%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI & DataForSEO
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AnotherSEOGuru
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            The Ultimate All-in-One SEO Platform
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Analyze Google SERP with AI Overview, optimize for YouTube, Instagram, TikTok, 
            track competitors, and dominate search rankings across all platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-primary text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              View Demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">15+ Powerful SEO Tools</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to dominate search rankings
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{feature.credits} credits</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                    <Badge variant="outline" className="text-xs">{feature.category}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose AnotherSEOGuru?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                <p className="text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary to-secondary text-white">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Dominate Search Rankings?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join 10,000+ marketers who use AnotherSEOGuru to grow their organic traffic
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <Star className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 AnotherSEOGuru. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
