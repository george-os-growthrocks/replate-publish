import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight, FileSearch, CheckCircle2 } from "lucide-react";

export default function LogFileSEOPost() {
  return (
    <>
      <Helmet>
        <title>Log-File SEO: The Fastest Way to Find Crawl Waste</title>
        <meta name="description" content="Learn to parse access logs, spot crawl traps, and fix budget-draining patterns—step by step with sample queries." />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <article className="pt-20">
          <header className="py-16 px-4 border-b">
            <div className="container mx-auto max-w-3xl">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge>Technical SEO</Badge>
                <Badge variant="secondary">Advanced</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Log-File SEO: The Fastest Way to Find Crawl Waste
              </h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  October 28, 2025
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  SEO Team
                </div>
                <Badge variant="outline">9 min read</Badge>
              </div>
            </div>
          </header>

          <div className="py-12 px-4">
            <div className="container mx-auto max-w-3xl prose prose-slate dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              
              <p className="lead">
                Your access logs contain the truth about what Google actually crawls. This guide shows you how to extract actionable insights without a $5,000/month enterprise crawler.
              </p>

              <h2>Why Log-File Analysis Matters</h2>
              <p>
                Traditional SEO tools tell you what <em>should</em> happen. Server logs tell you what <em>actually</em> happens. The gap between the two is where you'll find:
              </p>
              <ul>
                <li>Pages Google ignores (despite being in your sitemap)</li>
                <li>Crawl budget waste on low-value pages</li>
                <li>Server errors that kill rankings silently</li>
                <li>Orphan pages that somehow still get crawled</li>
              </ul>

              <h2>What to Look For in Your Logs</h2>

              <h3>1. Googlebot Crawl Frequency</h3>
              <p>
                Parse your access.log for Googlebot user agents. Group by hour to spot patterns:
              </p>

              <div className="not-prose my-4 p-4 bg-slate-950 rounded-lg">
                <code className="text-green-400 text-sm font-mono">
                  {`grep "Googlebot" access.log | cut -d[ -f2 | cut -d: -f1,2 | sort | uniq -c`}
                </code>
              </div>

              <p>
                If crawl rate spikes at midnight and tanks during business hours, you might have server performance issues during peak traffic.
              </p>

              <h3>2. 4xx/5xx Status Code Patterns</h3>
              <p>
                Google doesn't tell you <em>all</em> the errors it encounters. Logs do:
              </p>

              <div className="not-prose my-4 p-4 bg-slate-950 rounded-lg">
                <code className="text-green-400 text-sm font-mono">
                  {`grep "Googlebot" access.log | grep " 4[0-9][0-9] " | awk '{print $7}' | sort | uniq -c | sort -rn`}
                </code>
              </div>

              <p>
                This shows you the most-hit 404s. Fix or redirect the top 10, and you've just reclaimed crawl budget.
              </p>

              <h3>3. Orphan Pages Still Getting Crawled</h3>
              <p>
                Pages removed from your sitemap but still in logs = orphaned content with external links or internal references you missed.
              </p>

              <h2>The 5-Minute Crawl Audit</h2>

              <div className="not-prose my-6 space-y-3">
                <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <p className="font-semibold mb-1">Extract Googlebot Requests</p>
                    <p className="text-sm text-muted-foreground">Filter logs for Googlebot/Googlebot-Mobile user agents</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <p className="font-semibold mb-1">Count HTTP Status Codes</p>
                    <p className="text-sm text-muted-foreground">Group by 2xx, 3xx, 4xx, 5xx and calculate percentages</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <p className="font-semibold mb-1">Identify Top Crawled Pages</p>
                    <p className="text-sm text-muted-foreground">Are your most-crawled pages your most important? If not, investigate.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                  <div>
                    <p className="font-semibold mb-1">Check Crawl Timing</p>
                    <p className="text-sm text-muted-foreground">Group requests by hour—server slowness correlates with low crawl rates</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">5</div>
                  <div>
                    <p className="font-semibold mb-1">Compare Logs to Sitemap</p>
                    <p className="text-sm text-muted-foreground">Pages in sitemap but never crawled = potential indexation issues</p>
                  </div>
                </div>
              </div>

              <h2>Common Crawl Waste Patterns</h2>

              <h3>Pagination Crawl Loops</h3>
              <p>
                Googlebot wastes budget crawling page=1, page=2, page=99 of category archives. Solution: Use rel=prev/next or canonicalize to page 1, and block deep pagination in robots.txt.
              </p>

              <h3>Faceted Navigation Explosions</h3>
              <p>
                E-commerce sites generate thousands of filter combinations (/shoes?color=red&size=10&brand=nike). Use <Link to="/free-tools/robots-txt-generator">robots.txt</Link> or URL parameters in Search Console to prevent crawling.
              </p>

              <h3>Redirect Chains</h3>
              <p>
                301 → 302 → 200 wastes crawl hops. Logs show you the full chain. Fix by pointing redirects directly to final destinations.
              </p>

              <h2>Tools & SQL Queries</h2>

              <h3>Parse Logs with GoAccess (Free)</h3>
              <div className="not-prose my-4 p-4 bg-slate-950 rounded-lg">
                <code className="text-green-400 text-sm font-mono">
                  {`goaccess access.log -o report.html --log-format=COMBINED`}
                </code>
              </div>

              <h3>SQL for Deeper Analysis</h3>
              <p>
                Import logs into SQLite or PostgreSQL for flexible querying:
              </p>

              <div className="not-prose my-4 p-4 bg-slate-950 rounded-lg">
                <pre className="text-green-400 text-xs font-mono overflow-x-auto">
{`-- Most crawled URLs with 404s
SELECT url, COUNT(*) as hits
FROM access_logs
WHERE user_agent LIKE '%Googlebot%'
  AND status = 404
GROUP BY url
ORDER BY hits DESC
LIMIT 20;`}
                </pre>
              </div>

              <h2>Frequently Asked Questions</h2>

              <h3>How often should I analyze logs?</h3>
              <p>
                For most sites, monthly is sufficient. E-commerce and news sites should review weekly during peak seasons or after major site changes.
              </p>

              <h3>Do I need expensive tools?</h3>
              <p>
                No. GoAccess, grep, and basic SQL cover 80% of use cases. Premium tools like Screaming Frog Log Analyzer add convenience but aren't mandatory.
              </p>

              <h3>What if I don't have log access?</h3>
              <p>
                Ask your host or dev team. Most managed hosting (Cloudflare, AWS, Netlify) provides log access. Without it, you're flying blind on technical SEO.
              </p>

              <h3>How do logs help with crawl budget?</h3>
              <p>
                Logs show you what Google <em>chooses</em> to crawl. If it's wasting budget on low-value pages, you can block them and redirect that budget to important content using <Link to="/free-tools/robots-txt-generator">robots.txt optimization</Link>.
              </p>

              <Card className="not-prose my-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 p-8">
                <div className="text-center">
                  <FileSearch className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-3">Optimize Your Technical SEO</h3>
                  <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                    Use our free tools to audit crawl issues, check <Link to="/free-tools/robots-txt-generator">robots.txt</Link>, and monitor <Link to="/free-tools/cwv-pulse">Core Web Vitals</Link>
                  </p>
                  <Button asChild size="lg" className="gradient-primary">
                    <Link to="/auth">
                      Sign Up Free
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </article>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Log-File SEO: The Fastest Way to Find Crawl Waste",
            "description": "Learn to parse access logs, spot crawl traps, and fix budget-draining patterns—step by step with sample queries.",
            "datePublished": "2025-10-28T10:00:00Z",
            "dateModified": "2025-10-28T10:00:00Z",
            "author": {"@type": "Organization", "name": "AnotherSEOGuru"},
            "publisher": {"@type": "Organization", "name": "AnotherSEOGuru"}
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {"@type": "Question", "name": "How often should I analyze logs?", "acceptedAnswer": {"@type": "Answer", "text": "For most sites, monthly is sufficient. E-commerce and news sites should review weekly during peak seasons or after major site changes."}},
              {"@type": "Question", "name": "Do I need expensive tools?", "acceptedAnswer": {"@type": "Answer", "text": "No. GoAccess, grep, and basic SQL cover 80% of use cases."}},
              {"@type": "Question", "name": "What if I don't have log access?", "acceptedAnswer": {"@type": "Answer", "text": "Ask your host or dev team. Most managed hosting provides log access."}},
              {"@type": "Question", "name": "How do logs help with crawl budget?", "acceptedAnswer": {"@type": "Answer", "text": "Logs show you what Google chooses to crawl. You can block low-value pages and redirect budget to important content."}}
            ]
          })}
        </script>

        <Footer />
      </div>
    </>
  );
}

