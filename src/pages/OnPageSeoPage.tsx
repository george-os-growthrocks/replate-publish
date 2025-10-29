import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gauge, Search, Loader2, CheckCircle2, AlertCircle, XCircle, Zap, FileCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function OnPageSeoPage() {
  const [url, setUrl] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [firecrawlData, setFirecrawlData] = useState<any>(null);
  const [isLoadingFirecrawl, setIsLoadingFirecrawl] = useState(false);

  // Fetch data when URL is set
  useEffect(() => {
    if (searchUrl && !firecrawlData && !isLoadingFirecrawl) {
      fetchWithFirecrawl(searchUrl);
    }
  }, [searchUrl]);

  // Removed unused DataForSEO code

  const fetchWithFirecrawl = async (targetUrl: string) => {
    setIsLoadingFirecrawl(true);

    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: targetUrl }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Analysis failed");
      }

      setFirecrawlData(data.data);
      toast.success("Page analyzed successfully");
    } catch (error: any) {
      console.error("Analysis error:", error);
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
    
    // Format URL properly
    let formattedUrl = url.trim();
    
    // Add https:// if no protocol
    if (!formattedUrl.match(/^https?:\/\//i)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    // Validate URL format
    try {
      new URL(formattedUrl);
    } catch (e) {
      toast.error("Invalid URL format");
      return;
    }
    
    // Clear previous state
    setFirecrawlData(null);

    setSearchUrl(formattedUrl);
  };

  const onPageResult = firecrawlData;
  const isLoading = isLoadingFirecrawl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">OnPage SEO Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive technical SEO audit and performance testing
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Gauge className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-blue-200">Instant Page Analysis</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  Fast, reliable single-page analysis powered by <strong className="text-foreground">AnotherSEOGuru AI</strong>.
                  Extracts meta tags, headings, links, images, Open Graph data, and more. Perfect for quick audits.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

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
          </div>
          
        </div>
      </Card>


      {/* Results */}
      {searchUrl && (
        <Card className="p-6">
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : onPageResult ? (
              <>
                  {/* Analysis Complete Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-200">
                      ✓ Analysis Complete
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Powered by AnotherSEOGuru AI
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
            ) : searchUrl && !isLoading ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  Unable to fetch analysis data for this URL
                </p>
              </Card>
            ) : null}
          </div>
        </Card>
      )}

      {/* Initial State */}
      {!searchUrl && (
        <Card className="p-12 text-center">
          <Gauge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyze Any Page</h3>
          <p className="text-muted-foreground mb-4">
            Enter a URL to get instant technical SEO analysis
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            Checks: Meta tags, headings, images, links, performance, accessibility, and more
          </div>
        </Card>
      )}

    </div>
  );
}

