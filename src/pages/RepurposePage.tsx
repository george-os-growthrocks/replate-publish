import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Globe, 
  Upload, 
  Sparkles, 
  Zap, 
  Eye,
  CheckCircle2,
  Brain,
  AlertCircle,
  Search,
  TrendingUp,
  Target,
  Coins,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInput } from "@/components/repurpose/ContentInput";
import { PlatformSelector, platforms } from "@/components/repurpose/PlatformSelector";
import { ToneStyleSelector } from "@/components/repurpose/ToneStyleSelector";
import { URLScraper } from "@/components/repurpose/URLScraper";
import { ContentReview } from "@/components/repurpose/ContentReview";
import { SERPPreview } from "@/components/repurpose/SERPPreview";
import { PreviewPane, GeneratedContent } from "@/components/repurpose/PreviewPane";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { FeatureGate } from "@/components/FeatureGate";

type StepType = "input" | "review" | "intelligence" | "generate" | "results";

export default function RepurposePage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState("professional");
  const [style, setStyle] = useState("narrative");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [activeStep, setActiveStep] = useState<StepType>("input");
  const { toast } = useToast();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setIsAuthenticated(false);
          toast({
            title: "Authentication Error",
            description: "Failed to verify session. Please sign in.",
            variant: "destructive",
          });
          return;
        }
        
        if (!session) {
          setIsAuthenticated(false);
          toast({
            title: "Not Signed In",
            description: "You must sign in to use this feature. Redirecting...",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    }
    
    checkAuth();
  }, [navigate, toast]);

  function handlePlatformSelect(platformId: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  }

  async function handleGenerate() {
    if (isAuthenticated === false) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate content",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    if (content.length < 100) {
      toast({
        title: "Content too short",
        description: "Please enter at least 100 characters",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(`Preparing to generate content for ${selectedPlatforms.length} platform(s)...`);

    try {
      const requestPayload = {
        content,
        platforms: selectedPlatforms,
        tone,
        style,
        seoData: {
          primaryKeyword,
          secondaryKeywords: secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean),
          metaTitle,
          metaDescription
        }
      };

      setGenerationProgress(`Calling AI content generator...`);
      
      const invokeStartTime = Date.now();
      
      const timeoutDuration = 90000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutDuration/1000} seconds. Try selecting fewer platforms or shorter content.`)), timeoutDuration);
      });
      
      const invokePromise = supabase.functions.invoke('gemini-repurpose', {
        body: requestPayload
      });
      
      const result = await Promise.race([invokePromise, timeoutPromise]) as any;
      
      const invokeEndTime = Date.now();
      const duration = ((invokeEndTime - invokeStartTime) / 1000).toFixed(2);
      
      setGenerationProgress(`Received response in ${duration}s`);
      
      const { data, error } = result;
      
      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data || !data.generatedContent) {
        throw new Error('No content was generated. Please try again.');
      }

      setGenerationProgress('Content generated successfully!');

      setGeneratedContent(data.generatedContent || []);
      setActiveStep("results");

      toast({
        title: "Content Generated! ✨",
        description: `Successfully created ${data.generatedContent?.length || 0} platform version${(data.generatedContent?.length || 0) > 1 ? "s" : ""}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content. Please try again.";
      
      setGenerationProgress('');
      
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('non-2xx')) {
        userFriendlyMessage = "Generation failed. Please try again or check Supabase function logs.";
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = "Request timed out. Try generating for one platform at a time.";
      }
      
      toast({
        title: "Generation Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(''), 3000);
    }
  }

  const steps = [
    { id: "input" as StepType, label: "Input", icon: FileText, number: 1 },
    { id: "review" as StepType, label: "Review", icon: Eye, number: 2 },
    { id: "intelligence" as StepType, label: "SEO Intelligence", icon: Zap, number: 3 },
    { id: "generate" as StepType, label: "Generate", icon: Sparkles, number: 4 },
    { id: "results" as StepType, label: "Results", icon: CheckCircle2, number: 5 },
  ];

  return (
    <>
      <Helmet>
        <title>Content Repurposing with AI | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Transform your content into platform-optimized versions powered by real-time keyword research, trends analysis, and advanced AI."
        />
      </Helmet>

      <FeatureGate feature="content_repurpose" requiredPlan="Starter" showCost={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-8 w-8 text-primary" />
              Content Repurposing
            </h1>
            <p className="text-muted-foreground mt-1">
              Transform content into platform-optimized versions with SEO intelligence and AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2">
              <Coins className="w-3 h-3" />
              <span>20 credits</span>
            </Badge>
          </div>
        </div>

        {/* Authentication Alert */}
        {isAuthenticated === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>You must be signed in to generate content.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/auth')}
              >
                Sign In Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Step Progress Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = activeStep === step.id;
                const isCompleted = steps.findIndex(s => s.id === activeStep) > index;
                const isDisabled = step.id === "review" && content.length === 0 ||
                                  step.id === "intelligence" && content.length === 0 ||
                                  step.id === "generate" && content.length === 0 ||
                                  step.id === "results" && generatedContent.length === 0;
                
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <Button
                      variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                      onClick={() => !isDisabled && setActiveStep(step.id)}
                      disabled={isDisabled}
                      className="gap-2 whitespace-nowrap min-w-fit"
                      size="sm"
                    >
                      <StepIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.number}</span>
                    </Button>
                    {index < steps.length - 1 && (
                      <div className="w-4 h-0.5 bg-border flex-shrink-0 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: INPUT */}
        {activeStep === "input" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Input Your Content</CardTitle>
                <CardDescription>Type, scrape from URL, or upload a file to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SEO Intelligence Info */}
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-foreground">Advanced SEO Intelligence Enabled</h3>
                          <p className="text-sm text-muted-foreground">
                            Powered by enterprise-grade APIs and AI for data-driven content optimization
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <Search className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Keyword Research</p>
                              <p className="text-xs text-muted-foreground">Real-time search volume & competition data</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Trends Analysis</p>
                              <p className="text-xs text-muted-foreground">Identify hot topics & seasonal opportunities</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Smart Targeting</p>
                              <p className="text-xs text-muted-foreground">AI selects optimal keywords per platform</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground">2025 Algorithms</p>
                              <p className="text-xs text-muted-foreground">Optimized for latest platform algorithms</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">E-E-A-T Optimized</Badge>
                          <Badge variant="secondary" className="text-xs">Featured Snippets</Badge>
                          <Badge variant="secondary" className="text-xs">LSI Keywords</Badge>
                          <Badge variant="secondary" className="text-xs">Schema Suggestions</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="type" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="type" className="gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Type</span>
                    </TabsTrigger>
                    <TabsTrigger value="scrape" className="gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline">Scrape URL</span>
                      <span className="sm:hidden">URL</span>
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Upload</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="type" className="mt-4">
                    <ContentInput value={content} onChange={setContent} />
                  </TabsContent>
                  
                  <TabsContent value="scrape" className="mt-4 space-y-4">
                    <URLScraper
                      onContentScraped={(scrapedContent, metadata) => {
                        setContent(scrapedContent);
                        if (metadata?.title) {
                          setMetaTitle(metadata.title);
                        }
                        if (metadata?.description) {
                          setMetaDescription(metadata.description);
                        }
                      }}
                    />
                    {content && (
                      <Alert className="bg-success/10 border-success/20">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <AlertDescription className="text-success">
                          Content scraped: {content.length} characters
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="upload" className="mt-4">
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center text-center py-8">
                          <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                          <p className="text-sm font-medium mb-2 text-foreground">
                            File upload coming soon!
                          </p>
                          <p className="text-xs text-muted-foreground">
                            For now, please copy and paste your content or use the URL scraper
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {content.length > 0 && (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => setActiveStep("review")}
                  >
                    Next: Review Content
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: REVIEW */}
        {activeStep === "review" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Content</CardTitle>
                <CardDescription>AI-powered analysis with actionable optimization recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <ContentReview content={content} />
                  
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Best Practices & Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                          Content Structure
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">Break content into clear sections with descriptive headings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">Keep paragraphs short (2-3 sentences) for better readability</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <div className="w-1 h-4 bg-blue-500 rounded-full" />
                          Engagement Boosters
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">Use bullet points and numbered lists for scanability</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">Add questions to encourage interaction and discussion</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <div className="w-1 h-4 bg-amber-500 rounded-full" />
                          SEO Optimization
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">Include relevant keywords naturally throughout your content</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">Front-load important information in the first paragraph</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold mb-1 text-foreground">Pro Tip</h4>
                            <p className="text-xs text-muted-foreground">
                              Well-structured content with clear headings and proper formatting can increase engagement by up to 47% across social platforms.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setActiveStep("input")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back: Edit Content
                  </Button>
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => setActiveStep("intelligence")}
                  >
                    Next: SEO Intelligence
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: AI INTELLIGENCE */}
        {activeStep === "intelligence" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Intelligence Analysis</CardTitle>
                <CardDescription>Enhance your content with SEO keywords and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Primary Keyword</label>
                      <Input
                        value={primaryKeyword}
                        onChange={(e) => setPrimaryKeyword(e.target.value)}
                        placeholder="e.g., SEO content strategy"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Secondary Keywords (comma-separated)</label>
                      <Textarea
                        value={secondaryKeywords}
                        onChange={(e) => setSecondaryKeywords(e.target.value)}
                        placeholder="e.g., content marketing, SEO tips, keyword research"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Meta Title (Optional)</label>
                      <Input
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="SEO-optimized title..."
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/60 characters</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Meta Description (Optional)</label>
                      <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Compelling description for search results..."
                        rows={3}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
                    </div>
                  </div>

                  <SERPPreview title={metaTitle} description={metaDescription} />
                </div>

                <div className="flex gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setActiveStep("review")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back: Review Content
                  </Button>
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => setActiveStep("generate")}
                  >
                    Continue to Generate
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: GENERATE */}
        {activeStep === "generate" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Configure & Generate</CardTitle>
                <CardDescription>Select platforms and customize your output</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <PlatformSelector
                  selected={selectedPlatforms}
                  onSelect={handlePlatformSelect}
                />

                <ToneStyleSelector
                  tone={tone}
                  style={style}
                  onToneChange={setTone}
                  onStyleChange={setStyle}
                />

                {isGenerating && generationProgress && (
                  <Alert className="bg-primary/10 border-primary/30">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      <AlertDescription className="font-medium text-primary">
                        {generationProgress}
                      </AlertDescription>
                    </div>
                    <AlertDescription className="text-xs mt-2">
                      This may take 10-30 seconds per platform. Please wait...
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setActiveStep("intelligence")}
                    disabled={isGenerating}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="w-full gap-2 gradient-primary"
                    onClick={handleGenerate}
                    disabled={content.length < 100 || selectedPlatforms.length === 0 || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate ({selectedPlatforms.reduce((sum, platformId) => {
                          const platform = platforms.find(p => p.id === platformId);
                          return sum + (platform?.credits || 0);
                        }, 0)} credits)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <SERPPreview title={metaTitle} description={metaDescription} />
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="text-5xl">⚡</div>
                    <h3 className="text-lg font-semibold text-foreground">Ready to Generate</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlatforms.length > 0 
                        ? `Click Generate to create optimized content for all selected platforms`
                        : 'Select at least one platform to continue'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 5: RESULTS */}
        {activeStep === "results" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>Your platform-optimized content is ready</CardDescription>
              </CardHeader>
              <CardContent>
                <PreviewPane
                  generatedContent={generatedContent}
                  isGenerating={isGenerating}
                />

                <div className="flex gap-4 mt-6">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setActiveStep("generate")}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate More
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setContent("");
                      setGeneratedContent([]);
                      setSelectedPlatforms([]);
                      setActiveStep("input");
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Start New
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </FeatureGate>
    </>
  );
}
