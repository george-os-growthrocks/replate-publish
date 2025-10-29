import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Sparkles, History } from "lucide-react";
import ContentGapAnalysis from "@/components/competitive/ContentGapAnalysis";
import RankedKeywordsPortfolio from "@/components/competitive/RankedKeywordsPortfolio";
import AIOverviewTracker from "@/components/competitive/AIOverviewTracker";
import HistoricalRankings from "@/components/competitive/HistoricalRankings";

export default function CompetitiveIntelligence() {
  const [activeTab, setActiveTab] = useState("content-gap");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Competitive Intelligence</h1>
        <p className="text-muted-foreground">
          Discover opportunities, track AI impact, and monitor your competitive landscape
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="content-gap" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Content Gap</span>
          </TabsTrigger>
          <TabsTrigger value="ranked-keywords" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Rankings</span>
          </TabsTrigger>
          <TabsTrigger value="ai-overview" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Impact</span>
          </TabsTrigger>
          <TabsTrigger value="historical" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Gap Analysis */}
        <TabsContent value="content-gap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Content Gap Analysis
              </CardTitle>
              <CardDescription>
                Discover keyword opportunities that your competitors rank for but you don't
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentGapAnalysis />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranked Keywords Portfolio */}
        <TabsContent value="ranked-keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ranked Keywords Portfolio
              </CardTitle>
              <CardDescription>
                Complete visibility of all keywords your domain ranks for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankedKeywordsPortfolio />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Overview Tracker */}
        <TabsContent value="ai-overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Overview Impact Tracker
              </CardTitle>
              <CardDescription>
                Monitor how AI Overviews are affecting your organic search traffic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIOverviewTracker />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historical Rankings */}
        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historical Rankings
              </CardTitle>
              <CardDescription>
                Track ranking changes over time and detect algorithm impacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoricalRankings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
