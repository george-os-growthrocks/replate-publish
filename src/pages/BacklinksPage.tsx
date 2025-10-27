import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Search, Loader2, ExternalLink, TrendingUp, Calendar } from "lucide-react";
import { useBacklinksLive, useBacklinksHistory } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BacklinksPage() {
  const [url, setUrl] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [activeTab, setActiveTab] = useState("live");

  const { data: backlinksData, isLoading: backlinksLoading, error: backlinksError } = useBacklinksLive(
    { target: searchUrl, mode: "as_is", limit: 100 },
    !!searchUrl
  );

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

  const { data: historyData, isLoading: historyLoading } = useBacklinksHistory(
    {
      target: searchUrl,
      date_from: threeMonthsAgo.toISOString().split("T")[0],
      date_to: now.toISOString().split("T")[0],
      group_by: "month"
    },
    !!searchUrl && activeTab === "history"
  );

  const handleSearch = () => {
    if (!url.trim()) {
      toast.error("Please enter a domain or URL");
      return;
    }
    setSearchUrl(url.trim());
  };

  const backlinksResult = backlinksData?.tasks?.[0]?.result?.[0];
  const backlinks = backlinksResult?.items || [];
  const historyItems = historyData?.tasks?.[0]?.result?.[0]?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Backlinks Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Discover who's linking to your site and track backlink growth
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Link2 className="h-5 w-5 text-primary" />
          <Input
            placeholder="Enter domain or URL (e.g., example.com or https://example.com/page)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={backlinksLoading || historyLoading}>
            {backlinksLoading || historyLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Analyze
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {backlinksError && (
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <div className="text-red-200">
            ⚠️ Error: {backlinksError.message}
          </div>
        </Card>
      )}

      {/* Results */}
      {searchUrl && (
        <>
          {/* Stats Cards */}
          {backlinksResult && (
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Backlinks</div>
                <div className="text-2xl font-bold mt-1 text-emerald-400">
                  {backlinksResult.total_count?.toLocaleString() || "0"}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Referring Domains</div>
                <div className="text-2xl font-bold mt-1 text-blue-400">
                  {backlinksResult.referring_domains?.toLocaleString() || "0"}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Dofollow Links</div>
                <div className="text-2xl font-bold mt-1">
                  {backlinksResult.dofollow?.toLocaleString() || "0"}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Nofollow Links</div>
                <div className="text-2xl font-bold mt-1 text-muted-foreground">
                  {backlinksResult.nofollow?.toLocaleString() || "0"}
                </div>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="live">Live Backlinks</TabsTrigger>
              <TabsTrigger value="history">History & Trends</TabsTrigger>
            </TabsList>

            {/* Live Backlinks Tab */}
            <TabsContent value="live" className="space-y-4 mt-4">
              {backlinksLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : backlinks.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source Domain</TableHead>
                        <TableHead>Source URL</TableHead>
                        <TableHead>Anchor Text</TableHead>
                        <TableHead className="text-right">Type</TableHead>
                        <TableHead className="text-right">First Seen</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backlinks.slice(0, 50).map((backlink: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {backlink.domain_from || "-"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            <a
                              href={backlink.url_from}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {backlink.url_from?.substring(0, 50)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {backlink.anchor || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={backlink.dofollow ? "default" : "secondary"}>
                              {backlink.dofollow ? "Dofollow" : "Nofollow"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {backlink.first_seen 
                              ? new Date(backlink.first_seen).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={backlink.url_from} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Backlinks Found</h3>
                  <p className="text-muted-foreground">
                    No backlinks detected for this URL or domain
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              {historyLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : historyItems.length > 0 ? (
                <>
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Backlink Growth Over Time
                    </h3>
                    <div className="space-y-3">
                      {historyItems.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {new Date(item.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.referring_domains || 0} referring domains
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Total Links</div>
                              <div className="text-xl font-bold text-emerald-400">
                                {item.backlinks?.toLocaleString() || "0"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">New Links</div>
                              <div className="text-xl font-bold text-blue-400">
                                +{item.new_backlinks?.toLocaleString() || "0"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Lost Links</div>
                              <div className="text-xl font-bold text-red-400">
                                -{item.lost_backlinks?.toLocaleString() || "0"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Total Gained</div>
                      <div className="text-2xl font-bold mt-1 text-emerald-400">
                        +{historyItems.reduce((sum: number, item: any) => sum + (item.new_backlinks || 0), 0).toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Total Lost</div>
                      <div className="text-2xl font-bold mt-1 text-red-400">
                        -{historyItems.reduce((sum: number, item: any) => sum + (item.lost_backlinks || 0), 0).toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Net Growth</div>
                      <div className="text-2xl font-bold mt-1">
                        {(
                          historyItems.reduce((sum: number, item: any) => sum + (item.new_backlinks || 0), 0) -
                          historyItems.reduce((sum: number, item: any) => sum + (item.lost_backlinks || 0), 0)
                        ).toLocaleString()}
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Historical Data</h3>
                  <p className="text-muted-foreground">
                    Unable to fetch backlink history for this domain
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Initial State */}
      {!searchUrl && (
        <Card className="p-12 text-center">
          <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyze Backlink Profile</h3>
          <p className="text-muted-foreground mb-4">
            Enter a domain or URL to discover backlinks and track growth over time
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            See who's linking to you, anchor text distribution, dofollow vs nofollow, and historical trends
          </div>
        </Card>
      )}
    </div>
  );
}

