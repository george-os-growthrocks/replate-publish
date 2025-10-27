import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Search, Loader2, CheckCircle2, AlertCircle, XCircle, FileCode, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnPageInstant, useLighthouse } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function OnPageSeoPage() {
  const [url, setUrl] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [activeTab, setActiveTab] = useState("instant");
  const [firecrawlData, setFirecrawlData] = useState<any>(null);
  const [isLoadingFirecrawl, setIsLoadingFirecrawl] = useState(false);
  const [provider, setProvider] = useState<"firecrawl" | "dataforseo">("firecrawl"); // Default to Firecrawl
  const [debugLog, setDebugLog] = useState<Array<{time: string, message: string, type: string}>>([]);
  const [showDebug, setShowDebug] = useState(true);

  const addDebugLog = (message: string, type: string = "info") => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, { time, message, type }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const { data: onPageData, isLoading: onPageLoading, error: onPageError } = useOnPageInstant(
    { type: "instant", url: searchUrl },
    !!searchUrl && provider === "dataforseo"
  );

  const { data: lighthouseData, isLoading: lighthouseLoading, error: lighthouseError } = useLighthouse(
    { type: "lighthouse", url: searchUrl, device: "desktop" },
    !!searchUrl && activeTab === "lighthouse"
  );

  // Fetch with Firecrawl when provider is set to Firecrawl
  useEffect(() => {
    if (searchUrl && provider === "firecrawl" && !firecrawlData && !isLoadingFirecrawl) {
      addDebugLog("Using Firecrawl as primary provider", "info");
      fetchWithFirecrawl(searchUrl);
    }
  }, [searchUrl, provider]);

  // Auto-fallback to Firecrawl if DataForSEO fails
  useEffect(() => {
    if (onPageError && searchUrl && provider === "dataforseo" && !isLoadingFirecrawl) {
      addDebugLog(`DataForSEO failed with error: ${onPageError}`, "error");
      addDebugLog("Auto-switching to Firecrawl...", "warn");
      toast.info("DataForSEO failed, switching to Firecrawl...");
      setProvider("firecrawl");
      fetchWithFirecrawl(searchUrl);
    }
  }, [onPageError, searchUrl, provider]);

  // Log DataForSEO data when it arrives
  useEffect(() => {
    if (onPageData) {
      addDebugLog("DataForSEO response received", "success");
      addDebugLog(`Response keys: ${Object.keys(onPageData).join(", ")}`, "info");
    }
  }, [onPageData]);

  const fetchWithFirecrawl = async (targetUrl: string) => {
    setIsLoadingFirecrawl(true);
    addDebugLog(`Calling Firecrawl API for: ${targetUrl}`, "info");
    
    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: targetUrl }
      });

      addDebugLog(`Firecrawl response received`, "info");
      
      if (error) {
        addDebugLog(`Firecrawl Supabase error: ${JSON.stringify(error)}`, "error");
        throw error;
      }
      
      if (!data?.success) {
        addDebugLog(`Firecrawl failed: ${data?.error || "Unknown error"}`, "error");
        throw new Error(data?.error || "Firecrawl failed");
      }

      addDebugLog("Firecrawl analysis successful!", "success");
      addDebugLog(`Extracted data: ${JSON.stringify(Object.keys(data.data))}`, "info");
      
      // Log specific important fields
      addDebugLog(`Title: ${data.data.title || "N/A"}`, "info");
      addDebugLog(`H1 Count: ${data.data.h1Count}, Links: ${data.data.linkCount}, Images: ${data.data.imageCount}`, "info");
      
      setFirecrawlData(data.data);
      toast.success("Page analyzed with Firecrawl");
    } catch (error: any) {
      addDebugLog(`Firecrawl error: ${error.message}`, "error");
      console.error("Firecrawl error:", error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setIsLoadingFirecrawl(false);
    }
  };

  const handleSearch = () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    
    // Clear previous state and logs
    setDebugLog([]);
    setFirecrawlData(null);
    
    addDebugLog(`Starting analysis for: ${url.trim()}`, "info");
    addDebugLog(`Provider: ${provider === "firecrawl" ? "Firecrawl (Default)" : "DataForSEO"}`, "info");
    
    setSearchUrl(url.trim());
  };

  const onPageResult = provider === "firecrawl" ? firecrawlData : onPageData?.tasks?.[0]?.result?.[0];
  const lighthouseResult = lighthouseData?.tasks?.[0]?.result?.[0];
  const isLoading = onPageLoading || isLoadingFirecrawl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">OnPage SEO Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive technical SEO audit and performance testing
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-primary" />
            <Input
              placeholder="Enter URL to analyze (e.g., https://example.com/page)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Analyze
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? "Hide" : "Show"} Debug
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Provider:</span>
            <div className="flex gap-2">
              <Button
                variant={provider === "firecrawl" ? "default" : "outline"}
                size="sm"
                onClick={() => setProvider("firecrawl")}
                className="gap-2"
              >
                <Zap className="h-3 w-3" />
                Firecrawl (Recommended)
              </Button>
              <Button
                variant={provider === "dataforseo" ? "default" : "outline"}
                size="sm"
                onClick={() => setProvider("dataforseo")}
                className="gap-2"
              >
                <FileCode className="h-3 w-3" />
                DataForSEO (Beta)
              </Button>
            </div>
            <Badge variant="outline" className="ml-auto">
              {provider === "firecrawl" ? "✓ Works Great" : "⚠️ May Fail (500 Error)"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Debug Panel */}
      {showDebug && debugLog.length > 0 && (
        <Card className="p-4 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Debug Log ({debugLog.length} entries)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugLog([])}
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1 max-h-[300px] overflow-y-auto font-mono text-xs">
            {debugLog.map((log, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  log.type === "error"
                    ? "bg-red-500/10 text-red-200"
                    : log.type === "warn"
                    ? "bg-amber-500/10 text-amber-200"
                    : log.type === "success"
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-slate-800/50 text-slate-300"
                }`}
              >
                <span className="text-muted-foreground">[{log.time}]</span>{" "}
                <span className="font-semibold uppercase text-[10px]">[{log.type}]</span>{" "}
                {log.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error States */}
      {(onPageError || lighthouseError) && (
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <div className="text-red-200">
            ⚠️ Error: {onPageError?.message || lighthouseError?.message}
          </div>
        </Card>
      )}

      {/* Results Tabs */}
      {searchUrl && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instant">Instant Check</TabsTrigger>
            <TabsTrigger value="lighthouse">Lighthouse Audit</TabsTrigger>
          </TabsList>

          {/* Instant Check Tab */}
          <TabsContent value="instant" className="space-y-4 mt-4">
            {onPageLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : onPageResult ? (
              <>
                {/* Data Source Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className={
                    provider === "firecrawl"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-200"
                  }>
                    {provider === "firecrawl" ? "🔥 Powered by Firecrawl" : "📊 Powered by DataForSEO"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {provider === "firecrawl" 
                      ? "(Fast, reliable scraping)" 
                      : "(Advanced SEO metrics)"}
                  </span>
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Status Code</div>
                    <div className={`text-2xl font-bold mt-1 ${
                      (onPageResult?.status_code || onPageResult?.statusCode) === 200 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {onPageResult?.status_code || onPageResult?.statusCode || "-"}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Images Found</div>
                    <div className="text-2xl font-bold mt-1">
                      {onPageResult?.imageCount || onPageResult?.images_count || "-"}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Links Found</div>
                    <div className="text-2xl font-bold mt-1">
                      {onPageResult?.linkCount || onPageResult?.links_count || "-"}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">H1 Tags</div>
                    <div className="text-2xl font-bold mt-1">
                      {onPageResult?.h1Count || onPageResult?.meta?.htags?.h1?.length || "-"}
                    </div>
                  </Card>
                </div>

                {/* Meta Tags */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    Meta Tags & SEO Elements
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
                      <div>
                        <div className="font-medium">Title Tag</div>
                        {(onPageResult.meta?.title || onPageResult.title) && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {onPageResult.meta?.title || onPageResult.title} ({(onPageResult.meta?.title || onPageResult.title || "").length} chars)
                          </div>
                        )}
                      </div>
                      {(onPageResult.meta?.title || onPageResult.title) ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
                      <div className="flex-1">
                        <div className="font-medium">Meta Description</div>
                        {(onPageResult.meta?.description || onPageResult.description) && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {(onPageResult.meta?.description || onPageResult.description || "")} 
                            <span className="text-xs ml-2">({(onPageResult.meta?.description || onPageResult.description || "").length} chars)</span>
                          </div>
                        )}
                        {!(onPageResult.meta?.description || onPageResult.description) && (
                          <div className="text-sm text-red-300 mt-1">Missing meta description</div>
                        )}
                      </div>
                      {(onPageResult.meta?.description || onPageResult.description) ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
                      <div className="flex-1">
                        <div className="font-medium">H1 Tags</div>
                        {(onPageResult.h1Tags || onPageResult.meta?.htags?.h1) && (
                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            {(onPageResult.h1Tags || onPageResult.meta?.htags?.h1 || []).map((h1: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">H{idx + 1}</span>
                                <span className="flex-1">{h1}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!(onPageResult.h1Tags || onPageResult.meta?.htags?.h1) && (
                          <div className="text-sm text-red-300 mt-1">No H1 tags found</div>
                        )}
                      </div>
                      {(onPageResult.h1Tags?.length > 0 || onPageResult.meta?.htags?.h1?.length > 0) ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
                      <div>
                        <div className="font-medium">Canonical Tag</div>
                        {onPageResult.meta?.canonical && (
                          <div className="text-sm text-muted-foreground mt-1 truncate max-w-md">
                            {onPageResult.meta.canonical}
                          </div>
                        )}
                      </div>
                      {onPageResult.meta?.canonical ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Card>

                {/* Open Graph Data */}
                {(onPageResult.ogTitle || onPageResult.ogDescription || onPageResult.ogImage) && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Open Graph Data
                    </h3>
                    <div className="space-y-3">
                      {onPageResult.ogTitle && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">og:title</div>
                          <div className="text-muted-foreground">{onPageResult.ogTitle}</div>
                        </div>
                      )}
                      {onPageResult.ogDescription && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">og:description</div>
                          <div className="text-muted-foreground">{onPageResult.ogDescription}</div>
                        </div>
                      )}
                      {onPageResult.ogImage && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">og:image</div>
                          <div className="flex items-center gap-3">
                            <img src={onPageResult.ogImage} alt="OG" className="w-20 h-20 object-cover rounded" />
                            <div className="text-sm text-muted-foreground truncate">{onPageResult.ogImage}</div>
                          </div>
                        </div>
                      )}
                      {onPageResult.ogUrl && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">og:url</div>
                          <div className="text-muted-foreground text-sm">{onPageResult.ogUrl}</div>
                        </div>
                      )}
                      {onPageResult.ogSiteName && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">og:site_name</div>
                          <div className="text-muted-foreground">{onPageResult.ogSiteName}</div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* SEO Settings */}
                {(onPageResult.keywords || onPageResult.robots || onPageResult.language) && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      SEO Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {onPageResult.keywords && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">Keywords</div>
                          <div className="text-muted-foreground text-sm">{onPageResult.keywords}</div>
                        </div>
                      )}
                      {onPageResult.robots && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">Robots</div>
                          <div className="text-muted-foreground text-sm">{onPageResult.robots}</div>
                        </div>
                      )}
                      {onPageResult.language && (
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <div className="font-medium text-sm mb-1">Language</div>
                          <div className="text-muted-foreground text-sm uppercase">{onPageResult.language}</div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Links */}
                {onPageResult.links && onPageResult.links.length > 0 && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Extracted Links ({onPageResult.links.length} total)
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {onPageResult.links.slice(0, 20).map((link: string, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-slate-900/50 border border-white/5">
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 truncate block"
                          >
                            {link}
                          </a>
                        </div>
                      ))}
                      {onPageResult.links.length > 20 && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          ... and {onPageResult.links.length - 20} more links
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Screenshot */}
                {onPageResult.screenshot && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Screenshot
                    </h3>
                    <img 
                      src={onPageResult.screenshot} 
                      alt="Page screenshot" 
                      className="w-full rounded-lg border border-white/10"
                    />
                  </Card>
                )}

                {/* Markdown Preview */}
                {onPageResult.markdown && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Markdown Content Preview
                    </h3>
                    <div className="max-h-96 overflow-y-auto p-4 rounded-lg bg-slate-900/50 border border-white/5">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                        {onPageResult.markdown.substring(0, 2000)}
                        {onPageResult.markdown.length > 2000 && "\n\n... (truncated)"}
                      </pre>
                    </div>
                  </Card>
                )}

                {/* Images */}
                {onPageResult.images_count !== undefined && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Images</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">Total Images</div>
                        <div className="text-2xl font-bold mt-1">{onPageResult.images_count}</div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">With Alt Text</div>
                        <div className="text-2xl font-bold mt-1 text-emerald-400">
                          {onPageResult.images_alt_count || 0}
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">Missing Alt</div>
                        <div className="text-2xl font-bold mt-1 text-red-400">
                          {(onPageResult.images_count || 0) - (onPageResult.images_alt_count || 0)}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Links */}
                {onPageResult.links_count !== undefined && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Links</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">Total Links</div>
                        <div className="text-2xl font-bold mt-1">{onPageResult.links_count}</div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">Internal</div>
                        <div className="text-2xl font-bold mt-1">{onPageResult.internal_links_count || 0}</div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">External</div>
                        <div className="text-2xl font-bold mt-1">{onPageResult.external_links_count || 0}</div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">Broken</div>
                        <div className="text-2xl font-bold mt-1 text-red-400">
                          {onPageResult.broken_links || 0}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : searchUrl && !onPageLoading ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  Unable to fetch OnPage data for this URL
                </p>
              </Card>
            ) : null}
          </TabsContent>

          {/* Lighthouse Tab */}
          <TabsContent value="lighthouse" className="space-y-4 mt-4">
            {lighthouseLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : lighthouseResult ? (
              <>
                {/* Lighthouse Scores */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Performance", score: lighthouseResult.categories?.performance?.score, color: "emerald" },
                    { label: "Accessibility", score: lighthouseResult.categories?.accessibility?.score, color: "blue" },
                    { label: "Best Practices", score: lighthouseResult.categories?.['best-practices']?.score, color: "purple" },
                    { label: "SEO", score: lighthouseResult.categories?.seo?.score, color: "amber" },
                  ].map((item, idx) => {
                    const scoreValue = item.score !== undefined ? Math.round(item.score * 100) : null;
                    const scoreColor = scoreValue 
                      ? scoreValue >= 90 ? "text-emerald-400" 
                      : scoreValue >= 50 ? "text-amber-400" 
                      : "text-red-400"
                      : "text-muted-foreground";
                    
                    return (
                      <Card key={idx} className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-muted-foreground">{item.label}</div>
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className={`text-4xl font-bold ${scoreColor}`}>
                          {scoreValue !== null ? scoreValue : "-"}
                        </div>
                        {scoreValue !== null && (
                          <div className="mt-2 h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                scoreValue >= 90 ? "bg-emerald-500" :
                                scoreValue >= 50 ? "bg-amber-500" :
                                "bg-red-500"
                              }`}
                              style={{ width: `${scoreValue}%` }}
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>

                {/* Metrics */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {lighthouseResult.audits?.['first-contentful-paint'] && (
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">First Contentful Paint</div>
                        <div className="text-xl font-bold mt-1">
                          {lighthouseResult.audits['first-contentful-paint'].displayValue}
                        </div>
                      </div>
                    )}
                    {lighthouseResult.audits?.['largest-contentful-paint'] && (
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">Largest Contentful Paint</div>
                        <div className="text-xl font-bold mt-1">
                          {lighthouseResult.audits['largest-contentful-paint'].displayValue}
                        </div>
                      </div>
                    )}
                    {lighthouseResult.audits?.['speed-index'] && (
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <div className="text-sm text-muted-foreground">Speed Index</div>
                        <div className="text-xl font-bold mt-1">
                          {lighthouseResult.audits['speed-index'].displayValue}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            ) : searchUrl && !lighthouseLoading ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Lighthouse Data</h3>
                <p className="text-muted-foreground">
                  Unable to fetch Lighthouse audit for this URL
                </p>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      )}

      {/* Initial State */}
      {!searchUrl && (
        <Card className="p-12 text-center">
          <Gauge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyze Any Page</h3>
          <p className="text-muted-foreground mb-4">
            Enter a URL to get instant technical SEO analysis and Lighthouse scores
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            Checks: Meta tags, headings, images, links, performance, accessibility, and more
          </div>
        </Card>
      )}
    </div>
  );
}

