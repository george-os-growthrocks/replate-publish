import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConnectSearchConsole() {
  return (
    <>
      <Helmet>
        <title>How to Connect Google Search Console | AnotherSEOGuru Help</title>
        <meta name="description" content="Step-by-step guide to connecting your Google Search Console property to AnotherSEOGuru. Get your SEO data flowing in minutes." />
        <link rel="canonical" href="https://anotherseoguru.com/help/connect-search-console" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <article className="pt-20">
          <div className="py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <Link to="/help" className="text-sm text-primary hover:underline mb-4 inline-block">
                ← Back to Help Center
              </Link>

              <Badge className="mb-4">Getting Started</Badge>
              <h1 className="text-4xl font-bold mb-4">Connect Google Search Console</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Last updated: October 28, 2025
              </p>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2>What You'll Need</h2>
                <ul>
                  <li>A Google account with Search Console access</li>
                  <li>Owner or Full user permissions on your property</li>
                  <li>2-3 minutes to complete the connection</li>
                </ul>

                <Card className="not-prose my-6 bg-blue-500/5 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-2">Before You Start</h3>
                        <p className="text-sm text-muted-foreground">
                          Make sure you have verified your website in Google Search Console. If you haven't, follow <a href="https://support.google.com/webmasters/answer/9008080" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's verification guide</a> first.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <h2>Step-by-Step Instructions</h2>

                <h3>Step 1: Sign In to AnotherSEOGuru</h3>
                <p>
                  Navigate to <Link to="/auth" className="text-primary hover:underline">the sign-in page</Link> and authenticate with your email. If you don't have an account yet, click "Sign Up" to create one—it's free.
                </p>

                <h3>Step 2: Access the Dashboard</h3>
                <p>
                  Once signed in, you'll land on your dashboard. Look for the <strong>Property Selector</strong> dropdown in the top navigation bar.
                </p>

                <h3>Step 3: Authorize Google Search Console</h3>
                <div className="not-prose my-4 space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Click the Property Selector</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        It's in the top bar, next to the date range picker
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Click "Connect Google Search Console"</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You'll be redirected to Google's OAuth consent screen
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Grant Permissions</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Allow AnotherSEOGuru to access your Search Console data (read-only)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Select Your Property</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose which website you want to analyze from the dropdown
                      </p>
                    </div>
                  </div>
                </div>

                <h3>Step 4: Start Analyzing</h3>
                <p>
                  Once connected, your Search Console data will start syncing. You can now:
                </p>
                <ul>
                  <li>View query performance in the Queries page</li>
                  <li>Analyze page-level metrics</li>
                  <li>Track rankings over time</li>
                  <li>Identify keyword cannibalization</li>
                  <li>Generate AI-powered insights</li>
                </ul>

                <Card className="not-prose my-8 bg-green-500/5 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-2">Pro Tip</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect multiple properties if you manage several websites. You can switch between them using the property selector without re-authenticating.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <h2>Troubleshooting</h2>

                <h3>Error: "No properties found"</h3>
                <p>
                  This means your Google account doesn't have any verified properties in Search Console. Make sure you:
                </p>
                <ul>
                  <li>Have verified at least one website in GSC</li>
                  <li>Are using the same Google account that owns the property</li>
                  <li>Have Owner or Full user permissions (not Restricted)</li>
                </ul>

                <h3>Error: "Authorization failed"</h3>
                <p>
                  If you see this error:
                </p>
                <ol>
                  <li>Try signing out and signing back in</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Make sure you're granting all requested permissions</li>
                  <li>Check if popup blockers are preventing the OAuth window</li>
                </ol>

                <h3>Data Not Showing Up</h3>
                <p>
                  Search Console data can take 24-48 hours to appear. If you just verified your site, be patient. Additionally:
                </p>
                <ul>
                  <li>Check that you selected the correct date range</li>
                  <li>Verify your property has actual search data in GSC</li>
                  <li>Try refreshing the page</li>
                </ul>

                <h2>Security & Privacy</h2>
                <p>
                  We use OAuth 2.0 for secure authentication. AnotherSEOGuru never stores your Google password and only requests read-only access to your Search Console data. You can revoke access anytime from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Account permissions page</a>.
                </p>

                <h2>Related Articles</h2>
                <div className="not-prose grid md:grid-cols-2 gap-4 my-8">
                  <Link to="/help/connect-analytics" className="block p-4 border rounded-lg hover:border-primary transition-colors">
                    <h4 className="font-semibold mb-2">Connect Google Analytics</h4>
                    <p className="text-sm text-muted-foreground">Integrate GA4 for deeper insights</p>
                  </Link>
                  <Link to="/help/verify-website" className="block p-4 border rounded-lg hover:border-primary transition-colors">
                    <h4 className="font-semibold mb-2">Verify Your Website</h4>
                    <p className="text-sm text-muted-foreground">Domain verification methods</p>
                  </Link>
                </div>

                <Card className="not-prose my-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your Search Console and unlock powerful SEO insights
                    </p>
                    <Button asChild size="lg" className="gradient-primary">
                      <Link to="/dashboard">
                        Go to Dashboard
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </article>

        <Footer />
      </div>
    </>
  );
}

