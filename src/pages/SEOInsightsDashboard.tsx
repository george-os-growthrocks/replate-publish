/**
 * SEO Insights Dashboard
 * Comprehensive SEO analysis with all advanced components
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles } from 'lucide-react';
import {
  ContentGapAnalyzer,
  BacklinkGapCard,
  VolatilityMeter,
  FreshnessIndicator,
  CompetitivePositioningCard
} from '@/components/seo-analysis';

// Demo data for showcase
const demoSerpResults = [
  {
    position: 1,
    url: 'https://competitor1.com',
    domain: 'competitor1.com',
    title: 'Complete SEO Guide 2025',
    domainAuthority: 65,
    backlinks: 850,
    contentLength: 3200,
    serpFeatures: ['featured_snippet'],
    lastUpdated: new Date('2024-12-01')
  },
  {
    position: 2,
    url: 'https://competitor2.com',
    domain: 'competitor2.com',
    title: 'SEO Best Practices',
    domainAuthority: 58,
    backlinks: 420,
    contentLength: 2800,
    serpFeatures: [],
    lastUpdated: new Date('2024-11-15')
  },
  {
    position: 3,
    url: 'https://competitor3.com',
    domain: 'competitor3.com',
    title: 'Advanced SEO Techniques',
    domainAuthority: 72,
    backlinks: 1200,
    contentLength: 3500,
    serpFeatures: ['people_also_ask'],
    lastUpdated: new Date('2024-10-20')
  }
];

export function SEOInsightsDashboard() {
  const [keyword, setKeyword] = useState('seo tools');
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    // Simulate analysis
    setTimeout(() => setAnalyzing(false), 1000);
  };

  return (
    <>
      <Helmet>
        <title>SEO Insights Dashboard | Advanced Analysis</title>
        <meta name="description" content="Comprehensive SEO analysis with advanced insights" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-8 w-8 text-primary" />
              SEO Insights Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Advanced SEO analysis powered by industry-standard calculations
            </p>
          </div>
        </div>

        {/* Search Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter keyword to analyze..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button onClick={handleAnalyze} disabled={analyzing}>
                <Search className="h-4 w-4 mr-2" />
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Showing demo data. Enter a keyword and click Analyze to see real insights.
            </p>
          </CardContent>
        </Card>

        {/* Analysis Grid - Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ContentGapAnalyzer
            currentContentLength={1200}
            serpResults={demoSerpResults}
            difficulty={45}
            intent="informational"
          />
          
          <BacklinkGapCard
            currentBacklinks={250}
            serpResults={demoSerpResults}
          />
        </div>

        {/* Analysis Grid - Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <VolatilityMeter
            historicalChanges={35}
            periodDays={90}
          />
          
          <FreshnessIndicator
            keyword={keyword}
            serpResults={demoSerpResults}
          />
          
          <CompetitivePositioningCard
            yourDomain="yoursite.com"
            yourDA={35}
            yourBacklinks={250}
            serpResults={demoSerpResults}
            difficulty={45}
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-emerald-400">
                Content Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Get precise word count requirements and topical depth recommendations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cyan-500/5 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-cyan-400">
                Link Building
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Quality-based backlink gap analysis with tier breakdowns
              </p>
            </CardContent>
          </Card>

          <Card className="bg-indigo-500/5 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-indigo-400">
                Opportunity Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                SERP volatility analysis to find quick win opportunities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-violet-500/5 border-violet-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-violet-400">
                Competitive Intel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Ranking probability and required improvements analysis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>What Makes This Different?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Industry-Standard Calculations</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• AWR 2024 CTR curves (31.6% at position 1)</li>
                  <li>• Ahrefs-style keyword difficulty</li>
                  <li>• Multi-dimensional intent analysis</li>
                  <li>• 5-factor competitive scoring</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Actionable Insights</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Exact word count recommendations</li>
                  <li>• Quality-based backlink strategies</li>
                  <li>• Time-to-rank estimates</li>
                  <li>• Content update schedules</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default SEOInsightsDashboard;
