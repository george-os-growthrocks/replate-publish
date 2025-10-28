import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ArrowRight, Gauge, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function CWVTroubleshooting() {
  return (
    <>
      <Helmet>
        <title>Core Web Vitals Troubleshooting Guide | AnotherSEOGuru Help</title>
        <meta name="description" content="Learn how to improve LCP, INP, and CLS scores. Step-by-step troubleshooting for Core Web Vitals optimization." />
        <link rel="canonical" href="https://anotherseoguru.com/help/cwv-troubleshooting" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <article className="pt-20">
          <div className="py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <Link to="/help" className="text-sm text-primary hover:underline mb-4 inline-block">
                ← Back to Help Center
              </Link>

              <Badge className="mb-4">Technical SEO</Badge>
              <h1 className="text-4xl font-bold mb-4">Core Web Vitals Troubleshooting</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Last updated: October 28, 2025
              </p>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="lead">
                  Core Web Vitals are user-experience metrics that Google uses as ranking factors. This guide helps you diagnose and fix the three main metrics: LCP, INP, and CLS.
                </p>

                <h2>Understanding the Metrics</h2>

                <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">LCP</h4>
                      <p className="text-sm mb-2">Largest Contentful Paint</p>
                      <p className="text-xs text-muted-foreground">
                        Time until largest element is visible
                      </p>
                      <p className="text-xs mt-2">
                        Good: {'<'}2.5s
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">INP</h4>
                      <p className="text-sm mb-2">Interaction to Next Paint</p>
                      <p className="text-xs text-muted-foreground">
                        Responsiveness to user interactions
                      </p>
                      <p className="text-xs mt-2">
                        Good: {'<'}200ms
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 text-amber-700 dark:text-amber-400">CLS</h4>
                      <p className="text-sm mb-2">Cumulative Layout Shift</p>
                      <p className="text-xs text-muted-foreground">
                        Visual stability during page load
                      </p>
                      <p className="text-xs mt-2">
                        Good: {'<'}0.1
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <h2>Fixing Poor LCP Scores</h2>

                <h3>Common Causes</h3>
                <ul>
                  <li>Large, unoptimized images</li>
                  <li>Slow server response times</li>
                  <li>Render-blocking JavaScript/CSS</li>
                  <li>Client-side rendering delays</li>
                </ul>

                <h3>Solutions</h3>

                <div className="not-prose space-y-4 my-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Optimize Images</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Convert images to WebP, add explicit width/height, use lazy loading for below-the-fold images
                          </p>
                          <code className="text-xs bg-slate-900 dark:bg-slate-800 px-2 py-1 rounded">
                            {'<img loading="lazy" width="800" height="600" src="image.webp" />'}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Implement a CDN</h4>
                          <p className="text-sm text-muted-foreground">
                            Use Cloudflare, AWS CloudFront, or similar to serve assets from edge locations closer to users
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Preload Critical Resources</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Add preload hints for hero images and critical fonts
                          </p>
                          <code className="text-xs bg-slate-900 dark:bg-slate-800 px-2 py-1 rounded">
                            {'<link rel="preload" as="image" href="hero.webp" />'}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <h2>Fixing Poor INP Scores</h2>

                <h3>Common Causes</h3>
                <ul>
                  <li>Heavy JavaScript execution</li>
                  <li>Long-running event handlers</li>
                  <li>Excessive third-party scripts</li>
                  <li>Main thread blocking</li>
                </ul>

                <h3>Solutions</h3>
                <ol>
                  <li><strong>Code splitting</strong> - Break JavaScript into smaller chunks</li>
                  <li><strong>Defer non-critical JS</strong> - Load analytics and chat widgets after interaction</li>
                  <li><strong>Web Workers</strong> - Move heavy computations off the main thread</li>
                  <li><strong>Reduce third-party scripts</strong> - Audit tag manager and remove unused tags</li>
                </ol>

                <h2>Fixing Poor CLS Scores</h2>

                <h3>Common Causes</h3>
                <ul>
                  <li>Images without dimensions</li>
                  <li>Ads/embeds inserted dynamically</li>
                  <li>Web fonts causing FOIT/FOUT</li>
                  <li>Animations that move content</li>
                </ul>

                <h3>Solutions</h3>
                <div className="not-prose space-y-3 my-6">
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">Set Image Dimensions</p>
                      <p className="text-xs text-muted-foreground">
                        Always specify width and height attributes on images and video elements
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">Reserve Space for Ads</p>
                      <p className="text-xs text-muted-foreground">
                        Use min-height on ad containers to prevent layout shifts when ads load
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">Optimize Font Loading</p>
                      <p className="text-xs text-muted-foreground">
                        Use font-display: swap and preload critical fonts
                      </p>
                    </div>
                  </div>
                </div>

                <h2>Testing & Monitoring</h2>
                <p>
                  Use our <Link to="/free-tools/cwv-pulse" className="text-primary hover:underline">CWV Pulse tool</Link> to check your scores before and after optimizations. For comprehensive monitoring:
                </p>
                <ul>
                  <li>Check both mobile and desktop scores</li>
                  <li>Test on different devices and connections</li>
                  <li>Monitor trends over time (not just one-off tests)</li>
                  <li>Use Google Search Console's Core Web Vitals report for field data</li>
                </ul>

                <Card className="not-prose my-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                  <CardContent className="p-8 text-center">
                    <Gauge className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-2xl font-bold mb-3">Check Your Core Web Vitals</h3>
                    <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                      Get instant PageSpeed Insights scores with actionable recommendations
                    </p>
                    <Button asChild size="lg" className="gradient-primary">
                      <Link to="/free-tools/cwv-pulse">
                        Check CWV Scores Now
                        <Zap className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <h2>Related Resources</h2>
                <div className="not-prose grid md:grid-cols-2 gap-4">
                  <Link to="/blog/llm-seo-chatgpt-perplexity" className="block p-4 border rounded-lg hover:border-primary transition-colors">
                    <h4 className="font-semibold mb-2">Technical Hygiene for LLM SEO</h4>
                    <p className="text-sm text-muted-foreground">Fast pages are safer for AI crawlers</p>
                  </Link>
                  <Link to="/help/crawl-budget" className="block p-4 border rounded-lg hover:border-primary transition-colors">
                    <h4 className="font-semibold mb-2">Crawl Budget Basics</h4>
                    <p className="text-sm text-muted-foreground">How page speed affects crawling</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>

        <Footer />
      </div>
    </>
  );
}

