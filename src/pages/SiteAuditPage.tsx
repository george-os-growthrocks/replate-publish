import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardCheck, 
  Search, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Zap,
  FileText,
  AlertCircle,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGscData } from "@/hooks/useGscData";
import { useFilters } from "@/contexts/FilterContext";

interface AuditAnalysis {
  overallScore: number;
  summary: string;
  categories: Array<{
    name: string;
    score: number;
    issues: Array<{
      title: string;
      severity: "critical" | "high" | "medium" | "low";
      description: string;
      impact: string;
      recommendation: string;
    }>;
  }>;
  quickWins: string[];
  prioritizedActions: Array<{
    priority: number;
    action: string;
    estimatedImpact: string;
    estimatedEffort: string;
    reason: string;
  }>;
  opportunities?: Array<{
    title: string;
    description: string;
    potentialGain: string;
  }>;
}

export default function SiteAuditPage() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AuditAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [debugLog, setDebugLog] = useState<Array<{time: string, message: string, type: string}>>([]);
  const [showDebug, setShowDebug] = useState(true);
  const { propertyUrl, dateRange} = useFilters();

  const addDebugLog = (message: string, type: string = "info") => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, { time, message, type }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Fetch GSC data for the current property
  const { data: gscRows } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
  });

  const handleAudit = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL or domain");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setDebugLog([]);

    try {
      addDebugLog(`Starting audit for: ${url.trim()}`, "info");
      toast.info("Starting comprehensive site audit...");

      // Step 1: Get OnPage data from DataForSEO
      addDebugLog("Step 1: Fetching OnPage data from DataForSEO...", "info");
      const { data: onPageData, error: onPageError } = await supabase.functions.invoke(
        "dataforseo-onpage",
        {
          body: {
            type: "instant",
            url: url.trim()
          }
        }
      );

      if (onPageError) {
        addDebugLog(`OnPage error: ${JSON.stringify(onPageError)}`, "error");
        throw onPageError;
      }
      if (onPageData?.error) {
        addDebugLog(`OnPage API error: ${onPageData.error}`, "error");
        throw new Error(onPageData.error);
      }

      const onPageResult = onPageData?.tasks?.[0]?.result?.[0];
      addDebugLog(`OnPage data received. Status: ${onPageResult?.status_code || "N/A"}`, "success");
      addDebugLog(`OnPage data keys: ${onPageResult ? Object.keys(onPageResult).join(", ") : "none"}`, "info");

      // Step 2: Analyze GSC data
      addDebugLog("Step 2: Analyzing GSC data...", "info");
      const gscData = {
        totalPages: gscRows?.length || 0,
        topPages: gscRows?.slice(0, 10).map((r: any) => ({
          page: r.page,
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position
        })) || []
      };
      addDebugLog(`GSC data: ${gscData.totalPages} total pages, ${gscData.topPages.length} top pages`, "info");

      // Step 3: Identify technical issues
      addDebugLog("Step 3: Identifying technical issues...", "info");
      const technicalIssues = [];
      
      if (onPageResult) {
        if (onPageResult.status_code !== 200) {
          technicalIssues.push({
            type: "Status Code",
            severity: "critical",
            message: `HTTP Status ${onPageResult.status_code}`
          });
        }
        
        if (!onPageResult.meta?.title) {
          technicalIssues.push({
            type: "Meta Tags",
            severity: "high",
            message: "Missing title tag"
          });
        }
        
        if (!onPageResult.meta?.description) {
          technicalIssues.push({
            type: "Meta Tags",
            severity: "medium",
            message: "Missing meta description"
          });
        }
        
        if (!onPageResult.meta?.htags?.h1 || onPageResult.meta.htags.h1.length === 0) {
          technicalIssues.push({
            type: "Content Structure",
            severity: "high",
            message: "Missing H1 tag"
          });
        }
        
        if (onPageResult.meta?.htags?.h1?.length > 1) {
          technicalIssues.push({
            type: "Content Structure",
            severity: "medium",
            message: `Multiple H1 tags (${onPageResult.meta.htags.h1.length} found)`
          });
        }

        if (onPageResult.images_count && onPageResult.images_alt_count) {
          const missingAlt = onPageResult.images_count - onPageResult.images_alt_count;
          if (missingAlt > 0) {
            technicalIssues.push({
              type: "Images",
              severity: "medium",
              message: `${missingAlt} images missing alt text`
            });
          }
        }

        if (onPageResult.broken_links && onPageResult.broken_links > 0) {
          technicalIssues.push({
            type: "Links",
            severity: "high",
            message: `${onPageResult.broken_links} broken links detected`
          });
        }
      }

      addDebugLog(`Technical issues found: ${technicalIssues.length}`, technicalIssues.length > 0 ? "warn" : "success");
      if (technicalIssues.length > 0) {
        technicalIssues.forEach((issue: any, idx: number) => {
          addDebugLog(`  Issue ${idx + 1}: ${issue.type} - ${issue.message} (${issue.severity})`, "warn");
        });
      }

      // Step 4: Send to Gemini for AI analysis
      addDebugLog("Step 4: Sending data to Gemini AI...", "info");
      addDebugLog(`Gemini payload: domain=${url.trim()}, hasOnPageData=${!!onPageResult}, hasGscData=${!!gscData}, issuesCount=${technicalIssues.length}`, "info");
      
      toast.info("Analyzing with Gemini AI...");
      
      const { data: geminiData, error: geminiError } = await supabase.functions.invoke(
        "gemini-site-audit",
        {
          body: {
            domain: url.trim(),
            onPageData: onPageResult,
            gscData,
            technicalIssues
          }
        }
      );

      addDebugLog("Gemini response received", "info");
      addDebugLog(`Response keys: ${geminiData ? Object.keys(geminiData).join(", ") : "none"}`, "info");

      if (geminiError) {
        addDebugLog(`Gemini Supabase error: ${JSON.stringify(geminiError)}`, "error");
        throw geminiError;
      }
      
      if (!geminiData?.success) {
        addDebugLog(`Gemini API error: ${geminiData?.error || "Unknown error"}`, "error");
        addDebugLog(`Full Gemini response: ${JSON.stringify(geminiData)}`, "error");
        throw new Error(geminiData?.error || "Gemini analysis failed");
      }

      addDebugLog("✓ Gemini analysis successful!", "success");
      addDebugLog(`Analysis keys: ${geminiData.analysis ? Object.keys(geminiData.analysis).join(", ") : "none"}`, "info");
      addDebugLog(`Overall score: ${geminiData.analysis?.overallScore || "N/A"}`, "info");
      addDebugLog(`Categories: ${geminiData.analysis?.categories?.length || 0}`, "info");
      addDebugLog(`Quick wins: ${geminiData.analysis?.quickWins?.length || 0}`, "info");

      if (geminiData.debug) {
        addDebugLog(`Debug info: promptLength=${geminiData.debug.promptLength}, responseLength=${geminiData.debug.responseLength}, parsed=${geminiData.debug.parsed}`, "info");
      }

      setAnalysis(geminiData.analysis);
      toast.success("Site audit complete!");
      
    } catch (error: any) {
      addDebugLog(`=== AUDIT FAILED ===`, "error");
      addDebugLog(`Error type: ${error.constructor?.name || "Unknown"}`, "error");
      addDebugLog(`Error message: ${error.message}`, "error");
      if (error.stack) {
        addDebugLog(`Error stack: ${error.stack}`, "error");
      }
      console.error("Audit error:", error);
      toast.error(`Audit failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
      addDebugLog("=== Audit process ended ===", "info");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 border-red-500/50 text-red-200";
      case "high": return "bg-orange-500/10 border-orange-500/50 text-orange-200";
      case "medium": return "bg-amber-500/10 border-amber-500/50 text-amber-200";
      case "low": return "bg-blue-500/10 border-blue-500/50 text-blue-200";
      default: return "bg-slate-500/10 border-slate-500/50 text-slate-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Site Audit</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive technical SEO audit powered by DataForSEO + Gemini AI
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <Input
              placeholder="Enter URL to audit (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAudit()}
              className="flex-1"
            />
            <Button onClick={handleAudit} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isAnalyzing ? "Analyzing..." : "Start Audit"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? "Hide" : "Show"} Debug
            </Button>
          </div>
          {isAnalyzing && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Running comprehensive analysis...
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}
        </div>
      </Card>

      {/* Debug Panel */}
      {showDebug && debugLog.length > 0 && (
        <Card className="p-4 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
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
          <div className="space-y-1 max-h-[400px] overflow-y-auto font-mono text-xs">
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

      {/* Loading State */}
      {isAnalyzing && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* Results */}
      {analysis && !isAnalyzing && (
        <>
          {/* Overall Score */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-6 col-span-1">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Overall Score</div>
                <div className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}
                </div>
                <div className="text-xs text-muted-foreground mt-2">/ 100</div>
              </div>
            </Card>
            <Card className="p-6 col-span-3">
              <div className="text-sm text-muted-foreground mb-2">Executive Summary</div>
              <p className="text-base leading-relaxed">{analysis.summary}</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="issues">Issues by Category</TabsTrigger>
              <TabsTrigger value="actions">Prioritized Actions</TabsTrigger>
              <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                {analysis.categories?.slice(0, 6).map((category, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium">{category.name}</div>
                      <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}
                      </div>
                    </div>
                    <Progress value={category.score} className="h-2" />
                    <div className="mt-2 text-xs text-muted-foreground">
                      {category.issues.length} issue{category.issues.length !== 1 ? 's' : ''} found
                    </div>
                  </Card>
                ))}
              </div>

              {analysis.opportunities && analysis.opportunities.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Growth Opportunities
                  </h3>
                  <div className="space-y-3">
                    {analysis.opportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                      >
                        <div className="font-medium mb-1">{opp.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">{opp.description}</div>
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                          Potential Gain: {opp.potentialGain}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues" className="space-y-4 mt-4">
              {analysis.categories?.map((category, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  
                  {category.issues.length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>No issues found in this category</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {category.issues.map((issue, issueIdx) => (
                        <div
                          key={issueIdx}
                          className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5" />
                              <div className="font-medium">{issue.title}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {issue.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm mb-2">{issue.description}</div>
                          <div className="text-sm mb-2">
                            <strong>Impact:</strong> {issue.impact}
                          </div>
                          <div className="text-sm bg-slate-950/50 p-3 rounded mt-2">
                            <strong>✓ Recommendation:</strong> {issue.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* Prioritized Actions Tab */}
            <TabsContent value="actions" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Action Plan (Sorted by Priority)
                </h3>
                <div className="space-y-3">
                  {analysis.prioritizedActions?.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-slate-900/50 border border-white/5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {action.priority}
                          </div>
                          <div className="font-medium">{action.action}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            action.estimatedImpact === "high" ? "destructive" :
                            action.estimatedImpact === "medium" ? "secondary" :
                            "default"
                          }>
                            {action.estimatedImpact} impact
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {action.estimatedEffort}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground ml-11">
                        {action.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Quick Wins Tab */}
            <TabsContent value="quick-wins" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Quick Wins (Implement Today!)
                </h3>
                <div className="space-y-2">
                  {analysis.quickWins?.map((win, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                    >
                      <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{win}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Initial State */}
      {!analysis && !isAnalyzing && (
        <Card className="p-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Comprehensive Site Audit</h3>
          <p className="text-muted-foreground mb-4">
            Get a detailed technical SEO analysis with AI-powered recommendations
          </p>
          <div className="text-sm text-muted-foreground max-w-2xl mx-auto space-y-2">
            <p>✓ Technical SEO issues detection (OnPage analysis)</p>
            <p>✓ Content & performance optimization opportunities</p>
            <p>✓ GSC data integration for query & ranking insights</p>
            <p>✓ AI-powered prioritized action plan</p>
            <p>✓ Category-specific recommendations with impact analysis</p>
          </div>
        </Card>
      )}
    </div>
  );
}

