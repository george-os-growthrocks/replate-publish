import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  ExternalLink,
  Activity,
  Globe,
  Link2,
  Image as ImageIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FeatureDebugPanel, DebugLog } from "@/components/debug/FeatureDebugPanel";

interface CrawlStatus {
  max_crawl_pages: number;
  pages_in_queue: number;
  pages_crawled: number;
}

interface PageMetrics {
  links_external: number;
  links_internal: number;
  duplicate_title: number;
  duplicate_description: number;
  duplicate_content: number;
  broken_links: number;
  broken_resources: number;
  onpage_score: number;
  checks: Record<string, number>;
}

interface DomainInfo {
  name: string;
  cms?: string;
  ip?: string;
  server?: string;
  crawl_start?: string;
  crawl_end?: string;
  ssl_info?: any;
  total_pages: number;
}

interface AuditData {
  taskId: string;
  domain: string;
  crawlProgress: 'in_progress' | 'finished';
  crawlStatus: CrawlStatus;
  domainInfo?: DomainInfo;
  pageMetrics?: PageMetrics;
  pages: any[];
  totalPages: number;
}

export default function SiteAuditPage() {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const pollIntervalRef = useRef<number | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (message: string, type: DebugLog['level'] = "info") => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level: type,
      message
    };
    setDebugLogs(prev => [...prev, log]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Poll for crawl progress
  useEffect(() => {
    if (auditData && auditData.crawlProgress === 'in_progress') {
      pollIntervalRef.current = window.setInterval(() => {
        fetchSummary(auditData.taskId);
      }, 5000); // Poll every 5 seconds

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [auditData?.crawlProgress, auditData?.taskId]);

  const fetchSummary = async (taskId: string) => {
    try {
      addDebugLog(`Polling summary for task: ${taskId}`, "info");
      
      const { data, error } = await supabase.functions.invoke('dataforseo-onpage-crawl', {
        body: { action: 'summary', taskId }
      });

      if (error) {
        addDebugLog(`Summary error: ${JSON.stringify(error)}`, "error");
        throw error;
      }

      addDebugLog(`Summary response received`, "info");
      addDebugLog(`Response keys: ${data ? Object.keys(data).join(", ") : "none"}`, "info");

      const result = data?.tasks?.[0]?.result?.[0];
      if (!result) {
        addDebugLog(`No result in summary response`, "warn");
        addDebugLog(`Full response: ${JSON.stringify(data)}`, "warn");
        return;
      }

      addDebugLog(`Crawl progress: ${result.crawl_progress}`, "info");
      addDebugLog(`Pages crawled: ${result.crawl_status?.pages_crawled || 0} / ${result.crawl_status?.max_crawl_pages || 0}`, "info");
      addDebugLog(`Pages in queue: ${result.crawl_status?.pages_in_queue || 0}`, "info");

      setAuditData(prev => prev ? {
        ...prev,
        crawlProgress: result.crawl_progress,
        crawlStatus: result.crawl_status,
        domainInfo: result.domain_info,
        pageMetrics: result.page_metrics,
      } : null);

      // If finished, fetch pages
      if (result.crawl_progress === 'finished') {
        addDebugLog(`✓ Crawl finished! Total pages: ${result.domain_info?.total_pages || 0}`, "success");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        fetchPages(taskId);
        toast.success("Site audit completed!");
      }
    } catch (error: any) {
      addDebugLog(`Failed to fetch summary: ${error.message}`, "error");
      console.error("Failed to fetch summary:", error);
    }
  };

  const fetchPages = async (taskId: string, filters?: any[], orderBy?: string[]) => {
    try {
      addDebugLog(`Fetching pages for task: ${taskId}`, "info");
      
      const { data, error } = await supabase.functions.invoke('dataforseo-onpage-crawl', {
        body: {
          action: 'pages',
          taskId,
          limit: 100,
          filters: filters || [["resource_type", "=", "html"]],
          orderBy: orderBy || ["onpage_score,desc"]
        }
      });

      if (error) {
        addDebugLog(`Pages error: ${JSON.stringify(error)}`, "error");
        throw error;
      }

      const result = data?.tasks?.[0]?.result?.[0];
      if (!result) {
        addDebugLog(`No pages result`, "warn");
        return;
      }

      addDebugLog(`✓ Pages fetched: ${result.items?.length || 0} pages`, "success");
      addDebugLog(`Total pages in task: ${result.total_items_count || 0}`, "info");

      setAuditData(prev => prev ? {
        ...prev,
        pages: result.items || [],
        totalPages: result.total_items_count || 0,
      } : null);
    } catch (error: any) {
      addDebugLog(`Failed to fetch pages: ${error.message}`, "error");
      console.error("Failed to fetch pages:", error);
      toast.error("Failed to load page details");
    }
  };

  const handleAudit = async () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    setIsLoading(true);
    setAuditData(null);
    setDebugLog([]);

    try {
      addDebugLog(`=== Starting Site Audit for: ${domain.trim()} ===`, "info");
      
      const { data, error } = await supabase.functions.invoke('dataforseo-onpage-crawl', {
        body: { action: 'task_post', domain: domain.trim() }
      });

      addDebugLog(`Task POST response received`, "info");

      if (error) {
        addDebugLog(`Supabase error: ${JSON.stringify(error)}`, "error");
        throw error;
      }

      if (!data) {
        addDebugLog(`No data in response`, "error");
        throw new Error("No data received from edge function");
      }

      addDebugLog(`Response status: ${data.status_code} - ${data.status_message}`, "info");
      addDebugLog(`Tasks count: ${data.tasks_count}, Errors: ${data.tasks_error}`, "info");

      const task = data?.tasks?.[0];
      if (!task) {
        addDebugLog(`No task in response`, "error");
        addDebugLog(`Full response: ${JSON.stringify(data)}`, "error");
        throw new Error("No task returned");
      }

      addDebugLog(`Task status: ${task.status_code} - ${task.status_message}`, task.status_code === 20100 ? "success" : "error");
      addDebugLog(`Task data sent: ${JSON.stringify(task.data)}`, "info");

      // Check if task failed
      if (task.status_code !== 20100) {
        addDebugLog(`❌ Task creation FAILED!`, "error");
        addDebugLog(`Error code: ${task.status_code}`, "error");
        addDebugLog(`Error message: ${task.status_message}`, "error");
        addDebugLog(`Full task: ${JSON.stringify(task)}`, "error");
        throw new Error(`Audit task failed: ${task.status_message} (${task.status_code})`);
      }

      if (!task.id) {
        addDebugLog(`Task has no ID. Status: ${task.status_code} - ${task.status_message}`, "error");
        addDebugLog(`Task data: ${JSON.stringify(task.data)}`, "info");
        throw new Error("Failed to create crawl task - no ID returned");
      }

      addDebugLog(`✓ Task created successfully! ID: ${task.id}`, "success");
      addDebugLog(`Task cost: $${task.cost}`, "info");

      setAuditData({
        taskId: task.id,
        domain: domain.trim(),
        crawlProgress: 'in_progress',
        crawlStatus: {
          max_crawl_pages: 500,
          pages_in_queue: 0,
          pages_crawled: 0,
        },
        pages: [],
        totalPages: 0,
      });

      toast.success("Site audit started! Crawling pages...");

      addDebugLog(`Starting polling in 2 seconds...`, "info");
      // Start polling immediately
      setTimeout(() => fetchSummary(task.id), 2000);
    } catch (error: any) {
      addDebugLog(`=== AUDIT FAILED ===`, "error");
      addDebugLog(`Error: ${error.message}`, "error");
      if (error.stack) {
        addDebugLog(`Stack: ${error.stack}`, "error");
      }
      console.error("Site audit error:", error);
      toast.error(error.message || "Failed to start site audit");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const crawlProgressPercent = auditData?.crawlStatus
    ? Math.round((auditData.crawlStatus.pages_crawled / auditData.crawlStatus.max_crawl_pages) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Full Site Audit</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive website crawl with 60+ SEO checks per page powered by AnotherSEOGuru AI
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <Input
              placeholder="Enter domain to audit (e.g., example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleAudit()}
              className="flex-1"
              disabled={isLoading || auditData?.crawlProgress === 'in_progress'}
            />
            <Button 
              onClick={handleAudit} 
              disabled={isLoading || auditData?.crawlProgress === 'in_progress'}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Starting..." : "Start Audit"}
            </Button>
          </div>
        </div>
      </Card>


      {/* Crawl Progress */}
      {auditData && auditData.crawlProgress === 'in_progress' && (
        <Card className="p-6 border-blue-500/30 bg-blue-500/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <div>
                  <div className="font-semibold">Crawling in Progress</div>
                  <div className="text-sm text-muted-foreground">
                    {auditData.crawlStatus.pages_crawled} / {auditData.crawlStatus.max_crawl_pages} pages crawled
                    {auditData.crawlStatus.pages_in_queue > 0 && ` (${auditData.crawlStatus.pages_in_queue} in queue)`}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-300 border-blue-500/30">
                {crawlProgressPercent}% Complete
              </Badge>
            </div>
            <Progress value={crawlProgressPercent} className="h-2" />
          </div>
        </Card>
      )}

      {/* Results */}
      {auditData && auditData.crawlProgress === 'finished' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                  <div className={`text-3xl font-bold mt-1 ${getScoreColor(auditData.pageMetrics?.onpage_score || 0)}`}>
                    {auditData.pageMetrics?.onpage_score?.toFixed(1) || "N/A"}
                  </div>
                </div>
                <Activity className="h-10 w-10 text-muted-foreground opacity-20" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Pages Crawled</div>
                  <div className="text-3xl font-bold mt-1">{auditData.domainInfo?.total_pages || 0}</div>
                </div>
                <Globe className="h-10 w-10 text-muted-foreground opacity-20" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Broken Links</div>
                  <div className="text-3xl font-bold mt-1 text-red-400">
                    {auditData.pageMetrics?.broken_links || 0}
                  </div>
                </div>
                <Link2 className="h-10 w-10 text-muted-foreground opacity-20" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Broken Resources</div>
                  <div className="text-3xl font-bold mt-1 text-red-400">
                    {auditData.pageMetrics?.broken_resources || 0}
                  </div>
                </div>
                <ImageIcon className="h-10 w-10 text-muted-foreground opacity-20" />
              </div>
            </Card>
          </div>

          {/* Domain Info */}
          {auditData.domainInfo && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Domain</div>
                  <div className="font-medium">{auditData.domainInfo.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Server</div>
                  <div className="font-medium">{auditData.domainInfo.server || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CMS</div>
                  <div className="font-medium">{auditData.domainInfo.cms || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">IP Address</div>
                  <div className="font-medium font-mono text-xs">{auditData.domainInfo.ip || "N/A"}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="pages">Pages ({auditData.totalPages})</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 mt-4">
              {auditData.pageMetrics && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">Internal Links</div>
                    <div className="text-2xl font-bold">{auditData.pageMetrics.links_internal.toLocaleString()}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">External Links</div>
                    <div className="text-2xl font-bold">{auditData.pageMetrics.links_external.toLocaleString()}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">Duplicate Content</div>
                    <div className="text-2xl font-bold text-amber-400">
                      {auditData.pageMetrics.duplicate_content}
                    </div>
                  </Card>
                </div>
              )}

              {auditData.pageMetrics?.checks && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Common Issues Found</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(auditData.pageMetrics.checks)
                      .filter(([_, count]) => count > 0)
                      .slice(0, 12)
                      .map(([check, count]) => (
                        <div key={check} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <span className="text-sm">{check.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="text-amber-300 border-amber-500/30">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-4 mt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">Int. Links</TableHead>
                      <TableHead className="text-right">Ext. Links</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData.pages.slice(0, 50).map((page: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 max-w-md truncate"
                          >
                            <span className="truncate">{page.url}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${getScoreColor(page.onpage_score || 0)}`}>
                            {page.onpage_score?.toFixed(1) || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={page.status_code === 200 ? "default" : "destructive"}
                            className={page.status_code === 200 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : ""}
                          >
                            {page.status_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {(page.size / 1024).toFixed(1)} KB
                        </TableCell>
                        <TableCell className="text-right">{page.meta?.internal_links_count || 0}</TableCell>
                        <TableCell className="text-right">{page.meta?.external_links_count || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {auditData.totalPages > 50 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Showing 50 of {auditData.totalPages} pages
                </div>
              )}
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Critical Issues
                </h3>
                
                {auditData.pageMetrics && (
                  <div className="space-y-3">
                    {auditData.pageMetrics.broken_links > 0 && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-red-200">Broken Links</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {auditData.pageMetrics.broken_links} broken links detected across the site
                            </div>
                          </div>
                          <Badge variant="destructive">{auditData.pageMetrics.broken_links}</Badge>
                        </div>
                      </div>
                    )}

                    {auditData.pageMetrics.duplicate_title > 0 && (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-amber-200">Duplicate Titles</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {auditData.pageMetrics.duplicate_title} pages with duplicate title tags
                            </div>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                            {auditData.pageMetrics.duplicate_title}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {auditData.pageMetrics.duplicate_description > 0 && (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-amber-200">Duplicate Descriptions</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {auditData.pageMetrics.duplicate_description} pages with duplicate meta descriptions
                            </div>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                            {auditData.pageMetrics.duplicate_description}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {auditData.pageMetrics.broken_resources > 0 && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-red-200">Broken Resources</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {auditData.pageMetrics.broken_resources} broken images, scripts, or stylesheets
                            </div>
                          </div>
                          <Badge variant="destructive">{auditData.pageMetrics.broken_resources}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Initial State */}
      {!auditData && !isLoading && (
        <Card className="p-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Full Site Audit</h3>
          <p className="text-muted-foreground mb-4">
            Crawl up to 500 pages and get comprehensive SEO analysis
          </p>
          <div className="text-sm text-muted-foreground max-w-2xl mx-auto space-y-2">
            <p>✓ 60+ SEO checks per page</p>
            <p>✓ Broken links & resources detection</p>
            <p>✓ Duplicate content analysis</p>
            <p>✓ OnPage score for every page</p>
            <p>✓ Technical SEO issues breakdown</p>
          </div>
        </Card>
      )}

      {/* Debug Panel */}
      <FeatureDebugPanel
        logs={debugLogs}
        featureName="Site Audit"
        onClear={() => setDebugLogs([])}
      />
    </div>
  );
}
