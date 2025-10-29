import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight, Globe, CheckCircle2 } from "lucide-react";

export default function HreflangGuidePost() {
  return (
    <>
      <Helmet>
        <title>Hreflang Without Tears: ccTLDs vs. Subfolders vs. Subdomains</title>
        <meta name="description" content="A pragmatic framework for choosing your international URL strategy—with hreflang templates that actually work." />
        <link rel="canonical" href="https://anotherseoguru.com/blog/hreflang-guide" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <article className="pt-20">
          <header className="py-16 px-4 border-b">
            <div className="container mx-auto max-w-3xl">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge>International SEO</Badge>
                <Badge variant="secondary">Technical</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Hreflang Without Tears: ccTLDs vs. Subfolders vs. Subdomains
              </h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />October 28, 2025</div>
                <div className="flex items-center gap-2"><User className="w-4 h-4" />SEO Team</div>
                <Badge variant="outline">8 min read</Badge>
              </div>
            </div>
          </header>

          <div className="py-12 px-4">
            <div className="container mx-auto max-w-3xl prose prose-slate dark:prose-invert prose-headings:text-foreground prose-headings:font-bold">
              <p className="lead">
                Choose the wrong URL structure and you'll fight Google for years. This framework helps you pick the right strategy and implement hreflang tags that actually work.
              </p>

              <h2>The Three URL Structures</h2>

              <table>
                <thead>
                  <tr>
                    <th>Structure</th>
                    <th>Example</th>
                    <th>Best For</th>
                    <th>Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>ccTLDs</strong></td>
                    <td>example.de</td>
                    <td>Enterprise, strong local presence</td>
                    <td>High</td>
                  </tr>
                  <tr>
                    <td><strong>Subfolders</strong></td>
                    <td>example.com/de/</td>
                    <td>Most businesses (recommended)</td>
                    <td>Low</td>
                  </tr>
                  <tr>
                    <td><strong>Subdomains</strong></td>
                    <td>de.example.com</td>
                    <td>Separate product lines or brands</td>
                    <td>Medium</td>
                  </tr>
                </tbody>
              </table>

              <h2>Implementing Hreflang Tags</h2>
              <p>
                Use our <Link to="/free-tools/hreflang-builder">Hreflang Builder</Link> to generate tags. Key rules:
              </p>
              <ul>
                <li>Always include x-default for fallback</li>
                <li>Use absolute URLs, not relative</li>
                <li>Each page must reference all language versions (bidirectional)</li>
                <li>Keep canonical consistent with hreflang</li>
              </ul>

              <h2>FAQs</h2>
              <h3>Do I need hreflang for English US vs. UK?</h3>
              <p>Only if content meaningfully differs (pricing, terminology, products). Most sites don't need this level of granularity.</p>

              <h3>Can I mix structures (ccTLD + subfolders)?</h3>
              <p>Technically yes, but it complicates hreflang. Pick one strategy and stick with it.</p>

              <h3>How do I test my hreflang implementation?</h3>
              <p>Use Google Search Console's International Targeting report and our <Link to="/free-tools/hreflang-builder">validator tool</Link>.</p>

              <Card className="not-prose my-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 p-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Build Bulletproof Hreflang Tags</h3>
                <p className="text-muted-foreground mb-6">Generate and validate hreflang for your international site—free, no sign-up</p>
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/free-tools/hreflang-builder">Try Hreflang Builder<ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
              </Card>
            </div>
          </div>
        </article>

        <script type="application/ld+json">
          {JSON.stringify({"@context": "https://schema.org", "@type": "Article", "headline": "Hreflang Without Tears: ccTLDs vs. Subfolders vs. Subdomains", "datePublished": "2025-10-28T10:00:00Z", "author": {"@type": "Organization", "name": "AnotherSEOGuru"}})}
        </script>

        <Footer />
      </div>
    </>
  );
}

