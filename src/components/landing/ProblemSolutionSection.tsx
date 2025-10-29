import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ProblemSolutionSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Problem Side */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive mb-6">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">The Problem</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Stuck with Expensive, Fragmented SEO Tools?
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-destructive text-xs font-bold">×</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">$500+/month for basic SEO stack</p>
                    <p className="text-sm text-muted-foreground">Ahrefs, SEMrush, SurferSEO, and content tools add up fast</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-destructive text-xs font-bold">×</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Data scattered across 5+ dashboards</p>
                    <p className="text-sm text-muted-foreground">Switching tools breaks your workflow and wastes hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-destructive text-xs font-bold">×</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Limited AI content capabilities</p>
                    <p className="text-sm text-muted-foreground">Most tools lack production-ready AI content generation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-destructive text-xs font-bold">×</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">No AI Overview optimization</p>
                    <p className="text-sm text-muted-foreground">Traditional SEO tools ignore the new search landscape</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Side */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success mb-6">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">The Solution</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                One Platform, Unlimited Power
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">90% cost reduction</p>
                    <p className="text-sm text-muted-foreground">All-in-one platform starting at $29/month vs $500+ for multiple tools</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Unified workflow</p>
                    <p className="text-sm text-muted-foreground">Research, track, analyze, and generate—all in one dashboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">AI-powered everything</p>
                    <p className="text-sm text-muted-foreground">OpenAI, Claude & Gemini integration for intelligent content generation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Built for AI Overview era</p>
                    <p className="text-sm text-muted-foreground">Optimize for citations, featured snippets, and AI-powered search</p>
                  </div>
                </div>
              </div>
              <Button asChild size="lg" className="gradient-primary group">
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

