import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, Instagram, Smartphone, TrendingUp, Hash, Eye, ThumbsUp, Share2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useCreditManager } from "@/hooks/useCreditManager";

export default function SocialMediaSEO() {
  const [platform, setPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [contentInput, setContentInput] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { checkCredits, consumeCredits } = useCreditManager();

  const analyzeYoutube = async () => {
    if (!contentInput.trim()) {
      toast.error("Please enter a video title");
      return;
    }
    if (!await checkCredits('serp_analysis', 3)) return;

    setIsAnalyzing(true);
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setResults({
      title: contentInput,
      score: Math.floor(Math.random() * 30) + 70,
      suggestions: [
        "Add power words at the beginning of your title (Best, Ultimate, Complete)",
        "Include your main keyword in first 100 characters of description",
        "Use 5-15 tags with mix of broad and specific keywords",
        "Add timestamps to improve watch time and engagement",
        "Create custom thumbnail with text overlay and bright colors",
        "Keep title under 60 characters for better visibility"
      ],
      keywords: [
        { keyword: "SEO tutorial", volume: "12K", competition: "Medium", relevance: 92 },
        { keyword: "YouTube SEO", volume: "8.1K", competition: "High", relevance: 88 },
        { keyword: "video optimization", volume: "3.6K", competition: "Low", relevance: 85 },
        { keyword: "ranking videos", volume: "2.4K", competition: "Medium", relevance: 78 }
      ],
      hashtags: ["#SEO", "#YouTubeTips", "#VideoMarketing", "#ContentCreator", "#DigitalMarketing"],
      bestLength: "8-15 minutes for tutorials",
      uploadTime: "Tuesday-Thursday 2PM-4PM EST"
    });

    await consumeCredits({ 
      feature: 'serp_analysis', 
      amount: 3, 
      metadata: { platform: 'youtube', title: contentInput }
    });
    
    setIsAnalyzing(false);
    toast.success("YouTube SEO analysis complete!");
  };

  const analyzeInstagram = async () => {
    if (!contentInput.trim()) {
      toast.error("Please enter your post topic or niche");
      return;
    }
    if (!await checkCredits('serp_analysis', 2)) return;

    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    setResults({
      hashtags: [
        { tag: "#photography", posts: "824M", engagement: "High", growth: "+12%" },
        { tag: "#photooftheday", posts: "902M", engagement: "Medium", growth: "+8%" },
        { tag: "#instagood", posts: "1.6B", engagement: "Low", growth: "+3%" },
        { tag: "#portrait", posts: "298M", engagement: "High", growth: "+15%" },
        { tag: "#picoftheday", posts: "702M", engagement: "Medium", growth: "+6%" },
        { tag: "#photographer", posts: "156M", engagement: "High", growth: "+18%" }
      ],
      bestTimes: [
        { day: "Monday-Friday", time: "9AM-11AM", engagement: "High" },
        { day: "Wednesday", time: "7PM-9PM", engagement: "Very High" },
        { day: "Saturday", time: "11AM-1PM", engagement: "High" }
      ],
      suggestions: [
        "Use 20-30 hashtags per post for maximum reach",
        "Mix popular (1M+), medium (100K-1M), and niche (10K-100K) hashtags",
        "Post during peak engagement times for your audience",
        "Write compelling captions with clear call-to-action",
        "Use location tags to increase local discovery by 79%",
        "Engage with comments within first hour of posting"
      ],
      captionLength: "125-150 characters optimal",
      carouselBoost: "+48% reach vs single images"
    });

    await consumeCredits({ 
      feature: 'serp_analysis', 
      amount: 2, 
      metadata: { platform: 'instagram', topic: contentInput }
    });
    
    setIsAnalyzing(false);
    toast.success("Instagram SEO analysis complete!");
  };

  const analyzeTikTok = async () => {
    if (!contentInput.trim()) {
      toast.error("Please enter your video topic");
      return;
    }
    if (!await checkCredits('serp_analysis', 2)) return;

    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    setResults({
      trendingTopics: [
        { topic: "AI Tools", views: "2.3B", trend: "Rising", growth: "+156%" },
        { topic: "Productivity Hacks", views: "890M", trend: "Stable", growth: "+45%" },
        { topic: "Tech Tips", views: "1.5B", trend: "Rising", growth: "+89%" },
        { topic: "Tutorial", views: "3.2B", trend: "Stable", growth: "+23%" }
      ],
      hashtags: ["#FYP", "#ForYou", "#Viral", "#TechTok", "#AITools", "#ProductivityHacks"],
      suggestions: [
        "Hook viewers in first 3 seconds with bold statement or question",
        "Use trending sounds and effects (check TikTok Creative Center)",
        "Post 1-3 times daily for consistent growth",
        "Engage with comments within first hour for algorithm boost",
        "Use 3-5 hashtags including #FYP and niche tags",
        "Collaborate with creators in your niche for cross-promotion"
      ],
      bestLength: "21-34 seconds for maximum completion rate",
      bestTimes: [
        { time: "7AM-9AM EST", engagement: "High" },
        { time: "12PM-1PM EST", engagement: "Very High" },
        { time: "7PM-11PM EST", engagement: "Peak" }
      ],
      captionTips: "Ask question or use cliffhanger to boost comments"
    });

    await consumeCredits({ 
      feature: 'serp_analysis', 
      amount: 2, 
      metadata: { platform: 'tiktok', topic: contentInput }
    });
    
    setIsAnalyzing(false);
    toast.success("TikTok SEO analysis complete!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Social Media SEO</h1>
        <p className="text-muted-foreground">
          Optimize your content for YouTube, Instagram, and TikTok discovery
        </p>
      </div>

      <Tabs defaultValue="youtube" onValueChange={(v) => setPlatform(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            YouTube
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="w-4 h-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            TikTok
          </TabsTrigger>
        </TabsList>

        {/* YouTube Tab */}
        <TabsContent value="youtube" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                YouTube SEO Optimizer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Video Title</label>
                <Input
                  placeholder="Enter your video title..."
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>
              <Button 
                onClick={analyzeYoutube} 
                className="w-full"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>Analyzing...</>
                ) : (
                  <><TrendingUp className="w-4 h-4 mr-2" />Analyze YouTube SEO (3 credits)</>
                )}
              </Button>

              {results && platform === 'youtube' && (
                <div className="space-y-4 mt-6">
                  <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg text-center">
                    <div className="text-5xl font-bold text-primary mb-2">{results.score}/100</div>
                    <p className="text-sm text-muted-foreground">SEO Score</p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Optimization Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {results.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1 shrink-0">{idx + 1}</Badge>
                            <span className="text-sm">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommended Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.keywords.map((kw: any) => (
                          <div key={kw.keyword} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors">
                            <div className="flex-1">
                              <div className="font-medium">{kw.keyword}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Monthly searches: {kw.volume} • Relevance: {kw.relevance}%
                              </div>
                            </div>
                            <Badge 
                              variant={kw.competition === 'High' ? 'destructive' : kw.competition === 'Medium' ? 'default' : 'secondary'}
                            >
                              {kw.competition}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Recommended Hashtags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {results.hashtags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Best Practices</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Optimal Length</p>
                            <p className="text-xs text-muted-foreground">{results.bestLength}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Best Upload Time</p>
                            <p className="text-xs text-muted-foreground">{results.uploadTime}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instagram Tab */}
        <TabsContent value="instagram" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-500" />
                Instagram SEO Optimizer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Post Topic or Niche</label>
                <Textarea
                  placeholder="Enter your post caption or niche (e.g., travel photography, fitness, food)..."
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  rows={3}
                  disabled={isAnalyzing}
                />
              </div>
              <Button 
                onClick={analyzeInstagram} 
                className="w-full"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>Analyzing...</>
                ) : (
                  <><Hash className="w-4 h-4 mr-2" />Analyze Instagram SEO (2 credits)</>
                )}
              </Button>

              {results && platform === 'instagram' && (
                <div className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Hashtags for Your Niche</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.hashtags.map((hashtag: any) => (
                          <div key={hashtag.tag} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors">
                            <div className="flex-1">
                              <div className="font-medium text-primary">{hashtag.tag}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {hashtag.posts} posts • Growth: {hashtag.growth}
                              </div>
                            </div>
                            <Badge 
                              variant={hashtag.engagement === 'High' ? 'default' : 'secondary'}
                            >
                              {hashtag.engagement} Engagement
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Best Times to Post</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.bestTimes.map((time: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{time.day}</p>
                                <p className="text-xs text-muted-foreground">{time.time}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{time.engagement}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pro Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {results.suggestions.map((tip: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ThumbsUp className="w-4 h-4 text-primary mt-1 shrink-0" />
                            <span className="text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium">💡 Quick Wins</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {results.captionLength} • Carousel posts get {results.carouselBoost}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TikTok Tab */}
        <TabsContent value="tiktok" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                TikTok SEO Optimizer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Video Topic/Niche</label>
                <Input
                  placeholder="Enter your video topic (e.g., AI tutorials, productivity, tech reviews)..."
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>
              <Button 
                onClick={analyzeTikTok} 
                className="w-full"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>Analyzing...</>
                ) : (
                  <><Eye className="w-4 h-4 mr-2" />Analyze TikTok SEO (2 credits)</>
                )}
              </Button>

              {results && platform === 'tiktok' && (
                <div className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trending Topics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.trendingTopics.map((topic: any) => (
                          <div key={topic.topic} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors">
                            <div className="flex-1">
                              <div className="font-medium">{topic.topic}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {topic.views} views • Growth: {topic.growth}
                              </div>
                            </div>
                            <Badge 
                              variant={topic.trend === 'Rising' ? 'default' : 'secondary'}
                              className="flex items-center gap-1"
                            >
                              <TrendingUp className="w-3 h-3" />
                              {topic.trend}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommended Hashtags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {results.hashtags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-sm py-2 px-3">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        💡 Tip: {results.captionTips}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Optimization Strategies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-4">
                        {results.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Share2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="space-y-3">
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Optimal Video Length
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {results.bestLength}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-secondary/10 rounded-lg">
                          <p className="text-sm font-medium mb-2">Best Posting Times</p>
                          <div className="space-y-2">
                            {results.bestTimes.map((time: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span>{time.time}</span>
                                <Badge variant="outline" className="text-xs">{time.engagement}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
