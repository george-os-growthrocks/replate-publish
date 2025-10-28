import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Monitor, Smartphone, Tablet, Info } from "lucide-react";
import { AIOverview } from "@/components/serp/AIOverview";
import { PeopleAlsoAsk } from "@/components/serp/PeopleAlsoAsk";
import { LocalPack } from "@/components/serp/LocalPack";
import { OrganicResult } from "@/components/serp/OrganicResult";

export default function SERPPreviewPage() {
  const [keyword, setKeyword] = useState("best SEO tools 2025");
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [location, setLocation] = useState("United States");

  // Sample data for demonstration
  const aiOverviewData = {
    content: "SEO tools help websites improve their search engine rankings by analyzing keywords, tracking positions, auditing technical issues, and monitoring backlinks. Popular options include Ahrefs, SEMrush, Moz, and Google Search Console. The best tool depends on your specific needs, budget, and technical expertise. Most professionals use a combination of tools for comprehensive SEO management.",
    sources: [
      { title: "Ahrefs - Complete SEO Toolset", url: "https://ahrefs.com" },
      { title: "SEMrush - All-in-One Platform", url: "https://semrush.com" },
      { title: "Moz - SEO Software", url: "https://moz.com" },
      { title: "Search Engine Journal", url: "https://searchenginejournal.com" }
    ]
  };

  const paaData = [
    {
      question: "What is the best free SEO tool?",
      answer: "Google Search Console is widely considered the best free SEO tool, providing insights into search performance, indexing status, and technical issues. Other excellent free options include Ubersuggest, Google Analytics, and Google Keyword Planner.",
      source: "https://searchenginejournal.com/free-seo-tools"
    },
    {
      question: "How much do SEO tools cost?",
      answer: "SEO tool pricing varies significantly. Free tools like Google Search Console cost nothing. Entry-level paid tools start around $99/month (Ubersuggest, Mangools). Professional tools like Ahrefs and SEMrush range from $99-$399/month. Enterprise solutions can cost $1,000+ monthly.",
      source: "https://ahrefs.com/pricing"
    },
    {
      question: "Which SEO tool is best for beginners?",
      answer: "For beginners, Ubersuggest offers an excellent balance of ease-of-use and powerful features at an affordable price. Google Search Console (free) is also essential. SEMrush has a user-friendly interface with comprehensive tutorials, making it another great choice for those starting out.",
      source: "https://neilpatel.com/ubersuggest"
    },
    {
      question: "Do I need multiple SEO tools?",
      answer: "Most SEO professionals use multiple tools because each excels in different areas. A typical stack might include: Google Search Console (free technical data), Ahrefs (backlinks), SEMrush (competitor analysis), and Screaming Frog (site audits). This approach provides comprehensive coverage of all SEO needs.",
      source: "https://moz.com/blog/seo-tools-stack"
    }
  ];

  const localPackData = [
    {
      name: "Digital Marketing Agency Pro",
      rating: 4.9,
      reviews: 342,
      category: "SEO Agency",
      address: "123 Market St, San Francisco, CA 94103",
      phone: "(415) 555-0123",
      hours: "Open • Closes 6PM",
      distance: "0.8 mi"
    },
    {
      name: "SEO Experts Inc",
      rating: 4.7,
      reviews: 218,
      category: "Marketing Consultant",
      address: "456 Mission St, San Francisco, CA 94105",
      phone: "(415) 555-0456",
      hours: "Open • Closes 5:30PM",
      distance: "1.2 mi"
    },
    {
      name: "Growth Marketing Solutions",
      rating: 4.8,
      reviews: 167,
      category: "SEO Agency",
      address: "789 Howard St, San Francisco, CA 94103",
      phone: "(415) 555-0789",
      hours: "Open 24 hours",
      distance: "0.5 mi"
    }
  ];

  const organicResults = [
    {
      position: 1,
      title: "15+ Best SEO Tools in 2025 (Free & Paid) - Ahrefs",
      url: "https://ahrefs.com/blog/seo-tools/",
      description: "Discover the best SEO tools for keyword research, rank tracking, backlink analysis, and technical audits. Our comprehensive guide covers both free and premium options with detailed comparisons and real-world use cases.",
      rating: 4.8,
      reviews: 1250,
      hasImage: true,
      featured: true,
      siteLinks: [
        { title: "Free SEO Tools", url: "https://ahrefs.com/free-seo-tools" },
        { title: "Keyword Research", url: "https://ahrefs.com/keyword-research" },
        { title: "Backlink Checker", url: "https://ahrefs.com/backlink-checker" },
        { title: "Pricing", url: "https://ahrefs.com/pricing" }
      ]
    },
    {
      position: 2,
      title: "Best SEO Software 2025: Tools Reviewed & Compared - SEMrush",
      url: "https://www.semrush.com/blog/seo-tools/",
      description: "Compare top SEO tools side-by-side. Get expert reviews, pricing breakdowns, and feature comparisons to find the perfect tool for your marketing stack. Updated monthly with the latest releases.",
      rating: 4.7,
      reviews: 890,
      hasVideo: true,
      siteLinks: [
        { title: "Tool Comparison", url: "https://semrush.com/compare" },
        { title: "Features", url: "https://semrush.com/features" }
      ]
    },
    {
      position: 3,
      title: "Top SEO Tools Every Marketer Needs | Moz",
      url: "https://moz.com/learn/seo/tools",
      description: "Essential SEO tools recommended by industry experts. Learn which tools provide the best ROI and how to integrate them into your workflow for maximum efficiency and results.",
      hasImage: true
    },
    {
      position: 4,
      title: "41 Best SEO Tools (2025 Reviews) - Backlinko",
      url: "https://backlinko.com/seo-tools",
      description: "Brian Dean's curated list of the most effective SEO tools based on real testing and results. Includes pros, cons, pricing, and best use cases for each tool in our comprehensive database.",
      rating: 4.9,
      reviews: 2100
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">SERP Preview Simulator</h1>
        <p className="text-muted-foreground">
          Visualize how your content appears in Google search results with AI Overview, PAA, and local packs
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Keyword</label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter search query..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., United States"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Device</label>
              <div className="flex gap-2">
                <Button
                  variant={device === 'desktop' ? 'default' : 'outline'}
                  onClick={() => setDevice('desktop')}
                  className="flex-1"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={device === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setDevice('mobile')}
                  className="flex-1"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Mobile
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              This is a simulated preview showing how Google may display results for your keyword
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SERP Results */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Results</TabsTrigger>
          <TabsTrigger value="ai">AI Overview</TabsTrigger>
          <TabsTrigger value="local">Local Pack</TabsTrigger>
          <TabsTrigger value="organic">Organic</TabsTrigger>
        </TabsList>

        {/* All Results Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* Search Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Searching for:</p>
                  <h3 className="text-xl font-bold">{keyword}</h3>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{location}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {device === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                  {device === 'desktop' ? 'Desktop' : 'Mobile'}
                </Badge>
                <span>About 45,200,000 results (0.48 seconds)</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Overview */}
          <AIOverview {...aiOverviewData} />

          {/* People Also Ask */}
          <PeopleAlsoAsk questions={paaData} />

          {/* Local Pack */}
          <LocalPack businesses={localPackData} searchLocation={location} />

          {/* Organic Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organic Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organicResults.map((result) => (
                <OrganicResult key={result.position} {...result} />
              ))}
            </CardContent>
          </Card>

          {/* Related Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Related searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "free seo tools",
                  "seo tools comparison",
                  "best seo tools for small business",
                  "seo tools for beginners",
                  "enterprise seo tools",
                  "seo audit tools",
                  "keyword research tools",
                  "backlink analysis tools"
                ].map((term, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start text-left h-auto py-3"
                  >
                    <Search className="w-4 h-4 mr-2 shrink-0" />
                    <span className="text-sm">{term}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Overview Tab */}
        <TabsContent value="ai" className="space-y-6">
          <AIOverview {...aiOverviewData} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About AI Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Google's AI Overview (formerly Search Generative Experience) provides AI-generated summaries
                at the top of search results for certain queries.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Appears for informational and comparison queries</li>
                <li>Sources cited from top-ranking pages</li>
                <li>May reduce organic click-through rates</li>
                <li>Optimize by creating comprehensive, well-cited content</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Local Pack Tab */}
        <TabsContent value="local" className="space-y-6">
          <LocalPack businesses={localPackData} searchLocation={location} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Local Pack Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Complete Google Business Profile with accurate information</li>
                <li>Maintain NAP (Name, Address, Phone) consistency across web</li>
                <li>Encourage and respond to customer reviews</li>
                <li>Use relevant categories and attributes</li>
                <li>Add high-quality photos and regular updates</li>
                <li>Build local citations and backlinks</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organic Tab */}
        <TabsContent value="organic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organic Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organicResults.map((result) => (
                <OrganicResult key={result.position} {...result} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ranking Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">On-Page Factors</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Title tag optimization</li>
                    <li>Meta description</li>
                    <li>Header structure (H1-H6)</li>
                    <li>Content quality and depth</li>
                    <li>Internal linking</li>
                    <li>Page speed</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Off-Page Factors</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Backlink quantity and quality</li>
                    <li>Domain authority</li>
                    <li>Social signals</li>
                    <li>Brand mentions</li>
                    <li>User engagement metrics</li>
                    <li>E-E-A-T signals</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
