import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      {/* Animated Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              The Most Advanced SEO Platform + AI Content Engine
            </div>
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-center mb-6 text-foreground">
            Dominate Search Rankings{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              with AI-Powered SEO
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            Track SERP rankings, analyze competitors, research keywords, monitor backlinks, run technical audits, and generate platform-optimized content—all in one powerful platform.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              asChild
              size="lg" 
              className="gradient-primary text-lg px-8 py-6 group"
            >
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
            >
              <Link to="#features">See Features</Link>
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-16">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Cancel anytime
            </div>
          </div>

          {/* Hero Image/Stats */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl border border-border bg-card p-8 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">50M+</div>
                  <div className="text-sm text-muted-foreground">Keywords</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">60+</div>
                  <div className="text-sm text-muted-foreground">SEO Checks</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">8+</div>
                  <div className="text-sm text-muted-foreground">Platforms</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">SERP Tracking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

