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
              The AI SEO Platform That Beats ChatGPT for Search Rankings
            </div>
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-center mb-6 text-foreground">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Track Rankings • Analyze Competitors
            </span>
            <br />
            <span className="text-foreground">
              Generate AI Content • Optimize for AI Overviews
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground text-center max-w-3xl mx-auto mb-4">
            All powered by <strong className="text-foreground">OpenAI, Claude & Gemini</strong>
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-8">
            The complete AI SEO platform: keyword research, rank tracking, technical audits, 
            on-page analysis, backlink monitoring, and a production-grade AI content engine.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              asChild
              size="lg" 
              className="gradient-primary text-lg px-8 py-6 group"
            >
              <Link to="/auth">
                Start Free 7-Day Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
            >
              <Link to="/features">View All Features</Link>
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Free 7-day trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Cancel anytime
            </div>
          </div>

          {/* Powered By Badges with Real Logos */}
          <div className="mb-16">
            <p className="text-xs text-muted-foreground text-center mb-4 uppercase tracking-wider">Powered By</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {/* OpenAI */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
                <img 
                  src="/assets/openai.webp" 
                  alt="OpenAI" 
                  className="w-5 h-5"
                />
                <span className="text-xs md:text-sm font-semibold text-foreground">OpenAI</span>
              </div>
              
              {/* Anthropic (Claude) */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
                <img 
                  src="/assets/Claude_A.png" 
                  alt="Anthropic Claude" 
                  className="w-5 h-5"
                />
                <span className="text-xs md:text-sm font-semibold text-foreground">Claude</span>
              </div>
              
              {/* Google (Gemini) */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
                <img 
                  src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" 
                  alt="Google Gemini" 
                  className="w-5 h-5"
                />
                <span className="text-xs md:text-sm font-semibold text-foreground">Gemini</span>
              </div>
              
              {/* Perplexity */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
                <img 
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png" 
                  alt="Perplexity AI" 
                  className="w-5 h-5"
                />
                <span className="text-xs md:text-sm font-semibold text-foreground">Perplexity</span>
              </div>
              
              {/* Enterprise APIs */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-gray-400 to-gray-600" />
                <span className="text-xs md:text-sm font-semibold text-foreground">Enterprise APIs</span>
              </div>
            </div>
          </div>

          {/* Hero Stats */}
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
                  <div className="text-sm text-muted-foreground">AI Platforms</div>
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
