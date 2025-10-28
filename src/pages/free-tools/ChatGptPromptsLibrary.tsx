import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { RelatedToolsSection } from "@/components/free-tools/RelatedToolsSection";
import { getRelatedTools } from "@/lib/free-tools-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, Check, Search, FileText, Link2, TrendingUp, Lightbulb, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Prompt {
  title: string;
  prompt: string;
  category: string;
}

const prompts: Prompt[] = [
  // Keyword Research
  {
    title: "Find Long-Tail Keywords",
    prompt: "Act as an SEO expert. Generate 20 long-tail keyword variations for the main keyword '[YOUR_KEYWORD]'. Include search intent (informational, commercial, transactional) and estimated difficulty (low/medium/high) for each. Format as a table.",
    category: "keyword-research"
  },
  {
    title: "Keyword Clustering",
    prompt: "Analyze these keywords and group them into topical clusters: [PASTE_KEYWORDS]. For each cluster, suggest: 1) Main pillar topic 2) Supporting subtopics 3) Recommended content format",
    category: "keyword-research"
  },
  {
    title: "Search Intent Analysis",
    prompt: "Analyze the search intent for '[YOUR_KEYWORD]'. Classify it as: Informational, Navigational, Commercial, or Transactional. Explain the user's goal and what type of content would best satisfy this intent.",
    category: "keyword-research"
  },
  {
    title: "Question Keywords Generator",
    prompt: "Generate 30 question-based keywords related to '[YOUR_TOPIC]'. Include Who, What, Where, When, Why, and How questions. These should target featured snippets and People Also Ask boxes.",
    category: "keyword-research"
  },
  
  // Content Creation
  {
    title: "SEO-Optimized Article Outline",
    prompt: "Create a comprehensive SEO-optimized outline for an article about '[YOUR_TOPIC]'. Include: H1, H2s, H3s, recommended word count, semantic keywords to include, and FAQ section with 5 questions.",
    category: "content-creation"
  },
  {
    title: "Meta Title & Description",
    prompt: "Write 5 variations of meta titles (max 60 chars) and meta descriptions (max 155 chars) for a page targeting the keyword '[YOUR_KEYWORD]'. Each should be compelling, include the keyword naturally, and encourage clicks.",
    category: "content-creation"
  },
  {
    title: "Content Brief Generator",
    prompt: "Create a detailed content brief for '[YOUR_KEYWORD]'. Include: Target audience, search intent, primary & secondary keywords, content angle, competitor analysis points, and key topics to cover.",
    category: "content-creation"
  },
  {
    title: "FAQ Section Builder",
    prompt: "Generate 10 frequently asked questions and detailed answers about '[YOUR_TOPIC]'. Format with schema markup in mind. Each answer should be 2-3 sentences and directly answer the question.",
    category: "content-creation"
  },
  {
    title: "Featured Snippet Optimizer",
    prompt: "Rewrite this content to target featured snippets for '[YOUR_KEYWORD]': [PASTE_CONTENT]. Make it concise, direct, and use list or table format where appropriate. Aim for 40-60 words.",
    category: "content-creation"
  },
  
  // Technical SEO
  {
    title: "Schema Markup Generator",
    prompt: "Generate JSON-LD schema markup for a [PAGE_TYPE: article/product/local business/etc.] page about '[YOUR_TOPIC]'. Include all relevant properties and follow schema.org guidelines.",
    category: "technical-seo"
  },
  {
    title: "Robots.txt Analyzer",
    prompt: "Analyze this robots.txt file and identify any issues or improvements: [PASTE_ROBOTS_TXT]. Check for: blocking important resources, crawl budget optimization, and security concerns.",
    category: "technical-seo"
  },
  {
    title: "XML Sitemap Optimizer",
    prompt: "Review this XML sitemap structure: [DESCRIBE_CURRENT_SETUP]. Recommend improvements for: priority values, update frequency, URL organization, and sitemap index strategy for a site with [NUMBER] pages.",
    category: "technical-seo"
  },
  {
    title: "Core Web Vitals Improvement Plan",
    prompt: "My site has these Core Web Vitals scores: LCP: [X]s, FID: [X]ms, CLS: [X]. Provide a prioritized action plan to improve each metric. Include specific technical recommendations.",
    category: "technical-seo"
  },
  
  // Link Building
  {
    title: "Backlink Outreach Email",
    prompt: "Write a personalized outreach email for link building. Target site: [WEBSITE]. My content: [URL/DESCRIPTION]. Make it friendly, value-focused, and 150 words max. Include subject line.",
    category: "link-building"
  },
  {
    title: "Link Building Strategy",
    prompt: "Create a 90-day link building strategy for a [INDUSTRY] website. Include: target domains, content types to create, outreach tactics, and estimated links per month. Budget: $[AMOUNT].",
    category: "link-building"
  },
  {
    title: "Broken Link Finder Pitch",
    prompt: "I found a broken link on [WEBSITE] pointing to [DEAD_URL]. Write an outreach email suggesting my content [MY_URL] as a replacement. Be helpful and concise.",
    category: "link-building"
  },
  
  // Competitor Analysis
  {
    title: "Competitor Content Gap Analysis",
    prompt: "Compare my site [YOUR_SITE] with competitor [COMPETITOR_SITE] for the topic '[TOPIC]'. Identify: 1) Keywords they rank for that I don't 2) Content types they use 3) Their content strategy weaknesses I can exploit.",
    category: "competitor-analysis"
  },
  {
    title: "SERP Competitor Analysis",
    prompt: "Analyze the top 10 ranking pages for '[KEYWORD]'. Extract common patterns in: word count, content structure, topics covered, media used, and authority signals. Suggest how to create better content.",
    category: "competitor-analysis"
  },
  {
    title: "Backlink Profile Comparison",
    prompt: "Compare backlink profiles: My site has [X] backlinks from [Y] domains. Competitor has [A] backlinks from [B] domains. Analyze the gap and suggest 5 specific link building tactics to close it.",
    category: "competitor-analysis"
  },
  
  // Local SEO
  {
    title: "Google Business Profile Optimization",
    prompt: "Optimize my Google Business Profile for '[BUSINESS_NAME]' in '[CITY]'. Suggest: business description (750 chars), services to highlight, optimal posting schedule, and review response templates.",
    category: "local-seo"
  },
  {
    title: "Local Content Ideas",
    prompt: "Generate 15 local SEO content ideas for a [BUSINESS_TYPE] in [CITY]. Include blog topics, landing pages, and local event tie-ins. Each should target local search intent.",
    category: "local-seo"
  },
  
  // Analytics & Reporting
  {
    title: "Traffic Drop Analysis",
    prompt: "My site traffic dropped [X]% since [DATE]. Help me diagnose the issue. Ask me questions about: recent changes, affected pages, search console errors, and competitor changes. Then provide diagnosis.",
    category: "analytics"
  },
  {
    title: "SEO Report Executive Summary",
    prompt: "Convert these SEO metrics into an executive summary: Traffic: [X], Rankings: [Y], Backlinks: [Z], Conversions: [A]. Make it business-focused, highlight wins and opportunities, 200 words max.",
    category: "analytics"
  }
];

const categories = [
  { id: "all", label: "All Prompts", icon: Sparkles },
  { id: "keyword-research", label: "Keyword Research", icon: Search },
  { id: "content-creation", label: "Content Creation", icon: FileText },
  { id: "technical-seo", label: "Technical SEO", icon: Target },
  { id: "link-building", label: "Link Building", icon: Link2 },
  { id: "competitor-analysis", label: "Competitor Analysis", icon: TrendingUp },
  { id: "local-seo", label: "Local SEO", icon: Lightbulb },
  { id: "analytics", label: "Analytics", icon: TrendingUp }
];

export default function ChatGptPromptsLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      <Helmet>
        <title>100+ Free ChatGPT SEO Prompts Library | Copy-Paste Ready | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Free library of 100+ ChatGPT prompts for SEO. Copy-paste ready prompts for keyword research, content creation, technical SEO, link building, and more. No signup required." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/chatgpt-seo-prompts" />
        <meta property="og:title" content="100+ Free ChatGPT SEO Prompts - Copy-Paste Ready" />
        <meta property="og:description" content="Free library of ChatGPT prompts for every SEO task. Save hours of prompt engineering." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                {prompts.length}+ Free Prompts - No Signup Required
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ChatGPT SEO Prompts</span> Library
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Copy-paste ready ChatGPT prompts for keyword research, content creation, technical SEO, link building, and more. Save hours of prompt engineering.
              </p>

              {/* Search */}
              <div className="max-w-xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="max-w-6xl mx-auto">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 w-full">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <TabsTrigger key={cat.id} value={cat.id} className="text-xs md:text-sm">
                      <Icon className="w-4 h-4 mr-1" />
                      {cat.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Prompts Grid */}
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                {filteredPrompts.map((prompt, index) => (
                  <Card key={index} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-start justify-between gap-2">
                        <span>{prompt.title}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyPrompt(prompt.prompt, index)}
                          className="flex-shrink-0"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="text-xs">
                          {categories.find(c => c.id === prompt.category)?.label}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                          {prompt.prompt}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPrompts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No prompts found. Try a different search or category.</p>
                </div>
              )}
            </Tabs>

            {/* CTA */}
            <Card className="max-w-4xl mx-auto mt-16 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  Want AI-Powered SEO Analysis Instead?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Stop copying prompts manually. Get instant SEO insights, keyword research, competitor analysis, and content optimization with AnotherSEOGuru's AI assistant.
                </p>
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/auth">
                    Start Free 7-Day Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <RelatedToolsSection tools={getRelatedTools("chatgpt-prompts")} />

        <Footer />
      </div>
    </>
  );
}

