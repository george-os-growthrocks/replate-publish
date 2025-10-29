import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Target, Users, Zap, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us - AnotherSEOGuru</title>
        <meta name="description" content="Learn about AnotherSEOGuru's mission to democratize professional SEO tools and AI-powered content generation for businesses of all sizes." />
        <link rel="canonical" href="https://anotherseoguru.com/about" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                About{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  AnotherSEOGuru
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                We're on a mission to democratize professional SEO tools and make world-class search optimization accessible to everyone.
              </p>
            </div>

            {/* Story */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="prose prose-lg dark:prose-invert prose-headings:text-foreground mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  AnotherSEOGuru was born from frustration with expensive, complex SEO tools that only enterprise companies could afford. We believe every business deserves access to powerful SEO insights and AI-driven content generation.
                </p>
                <p className="text-muted-foreground mb-4">
                  Founded in 2024, we've built the most comprehensive SEO platform that combines traditional SEO tools (SERP tracking, keyword research, backlink monitoring) with cutting-edge AI technology for content generation across multiple platforms.
                </p>
                <p className="text-muted-foreground">
                  Today, thousands of businesses trust AnotherSEOGuru to dominate search rankings, analyze competitors, and scale their content production with AI.
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="max-w-6xl mx-auto mb-20">
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Our Values</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Mission-Driven</h3>
                  <p className="text-muted-foreground">
                    Democratizing professional SEO for businesses of all sizes.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">User-First</h3>
                  <p className="text-muted-foreground">
                    Every feature is designed with user experience in mind.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Innovation</h3>
                  <p className="text-muted-foreground">
                    Constantly pushing boundaries with AI and automation.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Transparency</h3>
                  <p className="text-muted-foreground">
                    Honest pricing, clear communication, no hidden fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="max-w-5xl mx-auto">
              <div className="rounded-3xl border border-border bg-card p-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-bold text-foreground mb-2">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground mb-2">50M+</div>
                    <div className="text-sm text-muted-foreground">Keywords Tracked</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground mb-2">1M+</div>
                    <div className="text-sm text-muted-foreground">Content Generated</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground mb-2">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

