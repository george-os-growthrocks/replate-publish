import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Coins
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const { toast } = useToast();

  function addDebugLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  }

  useEffect(() => {
    async function checkAuth() {
      addDebugLog('🔐 Checking authentication...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        addDebugLog(`Session check result: ${session ? 'HAS SESSION' : 'NO SESSION'}`);
        
        if (error) {
          addDebugLog(`❌ Session error: ${error.message}`);
          setIsAuthenticated(false);
          toast({
            title: "Authentication Error",
            description: "Failed to verify session. Please sign in.",
            variant: "destructive",
          });
          return;
        }
        
        if (!session) {
          addDebugLog('❌ NO ACTIVE SESSION - YOU ARE NOT SIGNED IN!');
          addDebugLog('Action required: Go to /auth and sign in');
          setIsAuthenticated(false);
          toast({
            title: "Not Signed In",
            description: "You must sign in to use this feature. Redirecting...",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }
        
        addDebugLog(`✅ Authenticated as: ${session.user.email}`);
        addDebugLog(`User ID: ${session.user.id}`);
        addDebugLog(`Token length: ${session.access_token.length} chars`);
        setIsAuthenticated(true);
      } catch (error) {
        addDebugLog(`❌ Auth check failed: ${error instanceof Error ? error.message : String(error)}`);
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
    addDebugLog('🎯 Generate button clicked');
    addDebugLog(`Authentication status: ${isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
    
    if (isAuthenticated === false) {
      addDebugLog('❌ Generation blocked - Not authenticated');
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

    // Log content length for debugging
    if (content.length > 10000) {
      addDebugLog(`ℹ️ Processing long content: ${content.length} chars`);
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

      addDebugLog('🚀 Starting content generation...');
      addDebugLog(`📦 Platforms: ${selectedPlatforms.join(', ')}`);
      addDebugLog(`Content length: ${content.length} chars`);
      addDebugLog(`Tone: ${tone}, Style: ${style}`);
      
      setGenerationProgress(`Calling AI content generator...`);
      addDebugLog('⏳ Invoking edge function: gemini-repurpose...');
      
      const invokeStartTime = Date.now();
      
      // Add timeout to prevent hanging (90 seconds for multiple platforms)
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
      addDebugLog(`📥 Response received in ${duration}s`);
      addDebugLog(`Has error: ${!!result.error}`);
      addDebugLog(`Has data: ${!!result.data}`);
      
      // Log the full response for debugging
      if (result.data) {
        addDebugLog(`Response data type: ${typeof result.data}`);
        addDebugLog(`Response data keys: ${Object.keys(result.data).join(', ')}`);
        if (result.data.error) {
          addDebugLog(`🔴 Function returned error in data: ${result.data.error}`);
        }
      }
      
      const { data, error } = result;
      
      if (error) {
        addDebugLog(`❌ Supabase function error: ${error.message || String(error)}`);
        addDebugLog(`Error name: ${error.name || 'Unknown'}`);
        
        // Try to get the actual HTTP response body with error details
        if (error.message?.includes('non-2xx')) {
          addDebugLog(`⚠️ Edge function returned error - fetching details...`);
          
          try {
            // Get the session token
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // Make a direct fetch to get the full error response
              const directResponse = await fetch(
                'https://siwzszmukfbzicjjkxro.supabase.co/functions/v1/gemini-repurpose',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpd3pzenptdWtmYnppY2pqa3hybyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI4OTU0NzQ3LCJleHAiOjIwNDQ1MzA3NDd9.GZQxDyYnhv--n82B1IXeEfGiNqnhY2TIx76qRYSC4BA'
                  },
                  body: JSON.stringify(requestPayload)
                }
              );
              
              const responseText = await directResponse.text();
              addDebugLog(`📄 HTTP Status: ${directResponse.status}`);
              addDebugLog(`📄 Response body: ${responseText.substring(0, 500)}`);
              
              try {
                const errorJson = JSON.parse(responseText);
                if (errorJson.error) {
                  addDebugLog(`🔴 ACTUAL ERROR: ${errorJson.error}`);
                }
                if (errorJson.details) {
                  addDebugLog(`📋 Error details: ${errorJson.details}`);
                }
              } catch (e) {
                addDebugLog(`Could not parse error response as JSON`);
              }
            }
          } catch (fetchError) {
            addDebugLog(`Could not fetch detailed error: ${fetchError}`);
          }
          
          addDebugLog(`💡 Also check Supabase logs: https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/functions`);
        }
        
        throw error;
      }

      if (data?.error) {
        addDebugLog(`❌ Function returned error: ${data.error}`);
        throw new Error(data.error);
      }

      if (!data || !data.generatedContent) {
        addDebugLog(`❌ No generated content in response`);
        addDebugLog(`Response data: ${JSON.stringify(data)}`);
        throw new Error('No content was generated. Please try again.');
      }

      addDebugLog(`✅ Generated content for ${data.generatedContent.length} platform(s)`);
      setGenerationProgress('Content generated successfully!');

      setGeneratedContent(data.generatedContent || []);
      setActiveStep("results");

      toast({
        title: "Content Generated! ✨",
        description: `Successfully created ${data.generatedContent?.length || 0} platform version${(data.generatedContent?.length || 0) > 1 ? "s" : ""}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content. Please try again.";
      addDebugLog(`💥 Generation error: ${errorMessage}`);
      
      // Only show auth error for actual 401
      if (errorMessage.includes('401') && !errorMessage.includes('non-2xx')) {
        addDebugLog('🔴 AUTH ERROR - 401 Unauthorized');
        addDebugLog('Solution: Sign out and sign back in at /auth');
      }
      
      setGenerationProgress('');
      
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('non-2xx')) {
        userFriendlyMessage = "Generation failed. Click the Debug Logs button to see details, or check Supabase function logs.";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4 border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" style={{ backgroundSize: '30px 30px' }} />
        <div className="relative container mx-auto max-w-4xl lg:max-w-6xl text-center space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-primary/10 border border-primary/20 text-sm sm:text-base font-medium text-primary">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            AI-Powered SEO Intelligence Platform
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-foreground">
            Repurpose Your Content with
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent block mt-2">
              SEO Intelligence
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto leading-relaxed">
            Transform content into platform-optimized versions powered by real-time keyword research, trends analysis, and advanced AI prompts engineered for 2025 algorithms
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Badge variant="secondary">FREE PLAN</Badge>
            <span className="text-sm text-muted-foreground">
              20 credits available
            </span>
          </div>
        </div>
      </section>

      {/* Main Interface */}
      <div className="flex-1">
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl lg:max-w-7xl">
            {/* Authentication Alert */}
            {isAuthenticated === false && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>⚠️ Authentication Required</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>You must be signed in to generate content. Check debug logs for details.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/auth')}
                    className="ml-4"
                  >
                    Sign In Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Step Progress */}
            <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 overflow-x-auto pb-2">
              <Button
                variant={activeStep === "input" ? "default" : "outline"}
                onClick={() => setActiveStep("input")}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">1. Input</span>
                <span className="sm:hidden">1</span>
              </Button>
              <div className="w-8 md:w-12 h-0.5 bg-border flex-shrink-0" />
              <Button
                variant={activeStep === "review" ? "default" : "outline"}
                onClick={() => content.length > 0 && setActiveStep("review")}
                disabled={content.length === 0}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">2. Review</span>
                <span className="sm:hidden">2</span>
              </Button>
              <div className="w-8 md:w-12 h-0.5 bg-border flex-shrink-0" />
              <Button
                variant={activeStep === "intelligence" ? "default" : "outline"}
                onClick={() => content.length > 0 && setActiveStep("intelligence")}
                disabled={content.length === 0}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">3. AI Intelligence</span>
                <span className="sm:hidden">3</span>
              </Button>
              <div className="w-8 md:w-12 h-0.5 bg-border flex-shrink-0" />
              <Button
                variant={activeStep === "generate" ? "default" : "outline"}
                onClick={() => content.length > 0 && setActiveStep("generate")}
                disabled={content.length === 0}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">4. Generate</span>
                <span className="sm:hidden">4</span>
              </Button>
              <div className="w-8 md:w-12 h-0.5 bg-border flex-shrink-0" />
              <Button
                variant={activeStep === "results" ? "default" : "outline"}
                onClick={() => generatedContent.length > 0 && setActiveStep("results")}
                disabled={generatedContent.length === 0}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">5. Results</span>
                <span className="sm:hidden">5</span>
              </Button>
            </div>

            <Card className="p-8 md:p-12 shadow-strong">
              {/* Step 1: INPUT */}
              {activeStep === "input" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2 text-foreground">Input Your Content</h2>
                    <p className="text-muted-foreground">Type, scrape from URL, or upload a file to get started</p>
                  </div>

                  {/* SEO Intelligence Info Card */}
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Advanced SEO Intelligence Enabled</h3>
                          <p className="text-sm text-muted-foreground">
                            Powered by enterprise-grade APIs and AI for data-driven content optimization
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-start gap-2">
                            <Search className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Keyword Research</p>
                              <p className="text-xs text-muted-foreground">Real-time search volume & competition data</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Trends Analysis</p>
                              <p className="text-xs text-muted-foreground">Identify hot topics & seasonal opportunities</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Smart Targeting</p>
                              <p className="text-xs text-muted-foreground">AI selects optimal keywords per platform</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">2025 Algorithms</p>
                              <p className="text-xs text-muted-foreground">Optimized for latest platform algorithms</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge variant="secondary" className="text-xs">E-E-A-T Optimized</Badge>
                          <Badge variant="secondary" className="text-xs">Featured Snippets</Badge>
                          <Badge variant="secondary" className="text-xs">LSI Keywords</Badge>
                          <Badge variant="secondary" className="text-xs">Schema Suggestions</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Credit Display Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Available Credits</p>
                        <p className="text-2xl font-bold">20</p>
                      </div>
                    </div>
                  </Card>

                  <Tabs defaultValue="type" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="type">
                        <FileText className="w-4 h-4 mr-2" />
                        Type
                      </TabsTrigger>
                      <TabsTrigger value="scrape">
                        <Globe className="w-4 h-4 mr-2" />
                        Scrape URL
                      </TabsTrigger>
                      <TabsTrigger value="upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="type" className="mt-4">
                      <ContentInput value={content} onChange={setContent} />
                    </TabsContent>
                    
                    <TabsContent value="scrape" className="mt-4">
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
                        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg text-sm">
                          ✓ Content scraped: {content.length} characters
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="upload" className="mt-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          File upload coming soon!
                        </p>
                        <p className="text-xs text-muted-foreground">
                          For now, please copy and paste your content or use the URL scraper
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {content.length > 0 && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setActiveStep("review")}
                    >
                      Next: Review Content
                    </Button>
                  )}
                </div>
              )}

              {/* Step 2: REVIEW */}
              {activeStep === "review" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2 text-foreground">Review Your Content</h2>
                    <p className="text-muted-foreground">AI-powered analysis with actionable optimization recommendations</p>
                  </div>

                  {/* SEO Readiness Info Card */}
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Eye className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Content Readiness Check</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Our AI analyzes your content structure, readability, and engagement potential to ensure maximum impact across all platforms.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">Readability Score</Badge>
                          <Badge variant="secondary" className="text-xs">Engagement Analysis</Badge>
                          <Badge variant="secondary" className="text-xs">Structure Check</Badge>
                          <Badge variant="secondary" className="text-xs">SEO Potential</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <ContentReview content={content} />
                    
                    <Card className="p-6 shadow-strong">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <CheckCircle2 className="w-5 h-5 text-secondary" />
                        </div>
                        <h3 className="text-lg font-semibold">Best Practices & Tips</h3>
                      </div>

                      {/* Best Practices List */}
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20 rounded-lg">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-green-500 rounded-full" />
                            Content Structure
                          </h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">Break content into clear sections with descriptive headings</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">Keep paragraphs short (2-3 sentences) for better readability</span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
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

                        <div className="p-4 bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-500/20 rounded-lg">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
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

                        {/* Pro Tip */}
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Pro Tip</h4>
                              <p className="text-xs text-muted-foreground">
                                Well-structured content with clear headings and proper formatting can increase engagement by up to 47% across social platforms.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setActiveStep("input")}
                    >
                      <FileText className="w-4 h-4" />
                      Back: Edit Content
                    </Button>
                    <Button
                      size="lg"
                      className="w-full gap-2"
                      onClick={() => setActiveStep("intelligence")}
                    >
                      Next: AI Intelligence
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: AI INTELLIGENCE */}
              {activeStep === "intelligence" && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2 text-foreground">AI Intelligence Analysis</h2>
                    <p className="text-muted-foreground">
                      Enhance your content with SEO keywords and metadata
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Primary Keyword</label>
                        <Input
                          value={primaryKeyword}
                          onChange={(e) => setPrimaryKeyword(e.target.value)}
                          placeholder="e.g., SEO content strategy"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Secondary Keywords (comma-separated)</label>
                        <Textarea
                          value={secondaryKeywords}
                          onChange={(e) => setSecondaryKeywords(e.target.value)}
                          placeholder="e.g., content marketing, SEO tips, keyword research"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Meta Title (Optional)</label>
                        <Input
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          placeholder="SEO-optimized title..."
                          maxLength={60}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Meta Description (Optional)</label>
                        <Textarea
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="Compelling description for search results..."
                          rows={3}
                          maxLength={160}
                        />
                      </div>
                    </div>

                    <SERPPreview title={metaTitle} description={metaDescription} />
                  </div>

                  <div className="flex gap-4 justify-center pt-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setActiveStep("review")}
                    >
                      Back: Review Content
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => setActiveStep("generate")}
                    >
                      Continue to Generate
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: GENERATE */}
              {activeStep === "generate" && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left Column - Controls */}
                  <div className="space-y-6">
                    <div className="text-center lg:text-left mb-6">
                      <h2 className="text-2xl font-bold mb-2 text-foreground">Configure & Generate</h2>
                      <p className="text-muted-foreground">Select platforms and customize your output</p>
                    </div>

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

                    {/* SEO Meta Preview (Optional) */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        SEO Meta Preview (Optional)
                      </h4>
                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder="Meta title for SEO preview..."
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          maxLength={60}
                        />
                        <Textarea
                          placeholder="Meta description for SEO preview..."
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          rows={3}
                          maxLength={160}
                        />
                      </div>
                    </div>

                    {isGenerating && generationProgress && (
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                          <span className="text-sm font-medium text-primary">{generationProgress}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          This may take 10-30 seconds per platform. Please wait...
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full"
                        onClick={() => setActiveStep("intelligence")}
                        disabled={isGenerating}
                      >
                        Back: SEO Intelligence
                      </Button>
                      <Button
                        size="lg"
                        className="w-full gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_20px_hsl(262_83%_58%/0.3)] hover:shadow-[0_0_30px_hsl(262_83%_58%/0.5)] hover:scale-105 transition-all duration-300"
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
                  </div>

                  {/* Right Column - Preview */}
                  <div className="space-y-6">
                    <SERPPreview title={metaTitle} description={metaDescription} />
                    
                    <Card className="p-6 shadow-strong">
                      <div className="text-center space-y-3">
                        <div className="text-5xl">⚡</div>
                        <h3 className="text-lg font-semibold">Ready to Generate</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedPlatforms.length > 0 
                            ? `Click Generate to create optimized content for all selected platforms`
                            : 'Select at least one platform to continue'
                          }
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 5: RESULTS */}
              {activeStep === "results" && (
                <div className="space-y-6">
                  <PreviewPane
                    generatedContent={generatedContent}
                    isGenerating={isGenerating}
                  />

                  <div className="flex gap-4 justify-center pt-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setActiveStep("generate")}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate More
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => {
                        setContent("");
                        setGeneratedContent([]);
                        setSelectedPlatforms([]);
                        setActiveStep("input");
                      }}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Start New
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>
      </div>

      {/* Floating Debug Button */}
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold"
      >
        🐛 Debug Logs ({debugLogs.length})
      </button>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col bg-slate-950 border-2 border-primary/30">
            <div className="p-4 border-b border-border flex items-center justify-between bg-slate-900">
              <div>
                <h2 className="text-xl font-bold text-foreground">Debug Logs</h2>
                <p className="text-sm text-muted-foreground">{debugLogs.length} log entries</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(debugLogs.join('\n'));
                    toast({ title: "Copied!", description: "Debug logs copied to clipboard" });
                  }}
                >
                  Copy All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDebugLogs([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDebugPanel(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <div className="font-mono text-sm space-y-1">
                {debugLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No logs yet. Try generating content.</p>
                ) : (
                  debugLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 rounded ${
                        log.includes('❌') || log.includes('💥') || log.includes('🔴')
                          ? 'bg-red-500/10 text-red-400 border-l-4 border-red-500'
                          : log.includes('✅')
                          ? 'bg-green-500/10 text-green-400 border-l-4 border-green-500'
                          : log.includes('⚠️')
                          ? 'bg-yellow-500/10 text-yellow-400 border-l-4 border-yellow-500'
                          : 'bg-slate-900 text-slate-300 border-l-4 border-slate-700'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

