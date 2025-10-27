import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  return (
    <>
      <Helmet>
        <title>Features - AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Explore all features of AnotherSEOGuru: keyword research, SERP tracking, competitor analysis, backlink monitoring, technical audits, and AI content generation." 
        />
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
                The most comprehensive SEO platform with 12+ powerful features, all backed by AI and real-time data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <FeaturesSection />

          {/* CTA Section */}
          <div className="container mx-auto px-4 mt-20">
            <div className="max-w-4xl mx-auto text-center rounded-3xl border border-border bg-card p-12">
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Ready to Dominate Search Rankings?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of businesses using AnotherSEOGuru to boost their SEO performance.
              </p>
              <Button asChild size="lg" className="gradient-primary">
                <Link to="/auth">
                  Get Started Free - No Credit Card Required
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

