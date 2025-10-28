import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Bug, AlertTriangle, Calendar } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
  deprecated?: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "1.12.0",
    date: "2025-10-28",
    added: [
      "Hreflang Validator: x-default support and canonical parity checks",
      "People Also Ask Extractor: Extract and categorize Google PAA questions",
      "CWV Pulse: Core Web Vitals checker with PageSpeed Insights API",
      "User Profile Dropdown with quick stats and enhanced navigation",
      "Internal linking system between all free SEO tools",
    ],
    changed: [
      "Dashboard Layout: Moved user profile to top-right next to notifications",
      "Light mode color contrast improved across all pages",
      "Landing Nav: Shows user email when signed in instead of 'Sign In' button",
    ],
    fixed: [
      "KeywordClusteringPage: Light mode backgrounds now have proper contrast",
      "RankingTrackerPage: Fixed color visibility in light theme",
      "RepurposePage: Removed duplicate footer elements",
    ],
  },
  {
    version: "1.11.0",
    date: "2025-10-20",
    added: [
      "Ranking Tracker: Monitor keyword positions over time",
      "SEO Intelligence Dashboard with algorithm drop detection",
      "Enhanced notification system with real-time alerts",
    ],
    changed: [
      "Dashboard sidebar navigation reorganized for better UX",
      "Improved mobile responsiveness across all pages",
    ],
    fixed: [
      "Fixed date range picker timezone issues",
      "Resolved GSC data sync delays",
    ],
  },
  {
    version: "1.10.0",
    date: "2025-10-15",
    added: [
      "Content Repurpose AI: Multi-platform content generation",
      "Keyword Clustering with difficulty scoring",
      "8 free SEO tools with no sign-up required",
    ],
    changed: [
      "Updated to Gemini 2.0 Flash for faster AI processing",
      "Enhanced export functionality with multiple formats",
    ],
    fixed: [
      "Authentication flow improvements",
      "Performance optimizations for large datasets",
    ],
  },
];

const getSectionIcon = (type: string) => {
  switch (type) {
    case 'added':
      return <Plus className="w-4 h-4 text-green-500" />;
    case 'changed':
      return <RefreshCw className="w-4 h-4 text-blue-500" />;
    case 'fixed':
      return <Bug className="w-4 h-4 text-amber-500" />;
    case 'deprecated':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

const getSectionColor = (type: string) => {
  switch (type) {
    case 'added':
      return 'border-green-500/30 bg-green-500/5';
    case 'changed':
      return 'border-blue-500/30 bg-blue-500/5';
    case 'fixed':
      return 'border-amber-500/30 bg-amber-500/5';
    case 'deprecated':
      return 'border-red-500/30 bg-red-500/5';
    default:
      return '';
  }
};

export default function ChangelogPage() {
  return (
    <>
      <Helmet>
        <title>Changelog - What's New | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="See what's new in AnotherSEOGuru. Track all product updates, new features, bug fixes, and improvements." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/changelog" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 px-4 border-b">
            <div className="container mx-auto max-w-4xl text-center">
              <Badge className="mb-4" variant="secondary">
                Product Updates
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Changelog
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Track all updates, new features, and improvements to our SEO platform
              </p>
            </div>
          </section>

          {/* Changelog Entries */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-4xl space-y-12">
              {changelog.map((entry, idx) => (
                <div key={idx} id={`v${entry.version}`}>
                  <div className="flex items-start gap-4 mb-6">
                    <Badge className="text-lg px-4 py-2">v{entry.version}</Badge>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{entry.date}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {entry.added && entry.added.length > 0 && (
                      <Card className={getSectionColor('added')}>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                            {getSectionIcon('added')}
                            Added
                          </h3>
                          <ul className="space-y-2">
                            {entry.added.map((item, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-green-500">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {entry.changed && entry.changed.length > 0 && (
                      <Card className={getSectionColor('changed')}>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            {getSectionIcon('changed')}
                            Changed
                          </h3>
                          <ul className="space-y-2">
                            {entry.changed.map((item, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {entry.fixed && entry.fixed.length > 0 && (
                      <Card className={getSectionColor('fixed')}>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            {getSectionIcon('fixed')}
                            Fixed
                          </h3>
                          <ul className="space-y-2">
                            {entry.fixed.map((item, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {entry.deprecated && entry.deprecated.length > 0 && (
                      <Card className={getSectionColor('deprecated')}>
                        <CardContent className="p-6">
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                            {getSectionIcon('deprecated')}
                            Deprecated
                          </h3>
                          <ul className="space-y-2">
                            {entry.deprecated.map((item, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {idx < changelog.length - 1 && (
                    <div className="mt-12 border-b border-border" />
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

