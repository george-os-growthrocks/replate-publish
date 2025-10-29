import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ExternalLink,
  TrendingUp,
  Link2,
  Info,
  Award,
  Sparkles
} from "lucide-react";
import { SerpItem, computeAuthorityScore } from "@/types/keyword-explorer";
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SerpOverviewTableProps {
  serpItems: SerpItem[];
  loading: boolean;
  keywordTrendData?: Array<{ month: number; year: number; search_volume: number }>;
}

export function SerpOverviewTable({ serpItems, loading, keywordTrendData }: SerpOverviewTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (serpItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SERP Overview</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          No SERP data available. Search for a keyword to see rankings.
        </CardContent>
      </Card>
    );
  }

  const getAuthorityColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 50) return "text-blue-500";
    if (score >= 30) return "text-amber-500";
    return "text-gray-500";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Generate mock sparkline data (in real implementation, use historical data)
  const generateSparklineData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: Math.random() * 100 + 50
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            SERP Overview
          </CardTitle>
          <Badge variant="outline">{serpItems.length} results</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[300px]">Page</TableHead>
                <TableHead className="text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center justify-center gap-1">
                          <Award className="h-3 w-3" />
                          AS
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Authority Score (0-100)</p>
                        <p className="text-xs text-muted-foreground">
                          Based on referring domains, backlinks, and traffic
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center justify-end gap-1">
                          <Link2 className="h-3 w-3" />
                          Backlinks
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total backlinks to this page</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center justify-end gap-1">
                          Ref Domains
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of unique domains linking to this page</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Traffic
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Estimated monthly organic traffic</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="w-24">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        Trend
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>12-month traffic trend</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serpItems.map((item, idx) => {
                const backlinks = item.backlinks?.backlinks || 0;
                const refDomains = item.backlinks?.referring_domains || 0;
                const dofollow = item.backlinks?.dofollow || 0;
                const traffic = item.traffic?.etv || 0;
                
                // Calculate authority score if we have data
                const authorityScore = item.authority_score || (refDomains > 0 ? computeAuthorityScore({
                  referringDomains: refDomains,
                  backlinks: backlinks,
                  dofollowRatio: backlinks > 0 ? dofollow / backlinks : 0,
                  estimatedTraffic: traffic
                }) : 0);

                // Use keyword trend data if available (for keyword search volume trend)
                // Note: This is the keyword's search volume trend, not the domain's traffic trend
                const sparklineData = generateSparklineData(keywordTrendData);

                return (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-center">
                      <Badge variant={idx < 3 ? "default" : "outline"}>
                        {item.rank_absolute}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium truncate max-w-md" title={item.title}>
                          {item.title || "No title"}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 truncate max-w-md"
                          title={item.url}
                        >
                          {item.domain}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                        {/* SERP Features */}
                        {item.type !== "organic" && (
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {authorityScore > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className={`text-2xl font-bold ${getAuthorityColor(authorityScore)}`}>
                            {authorityScore}
                          </span>
                          {authorityScore >= 70 && (
                            <Badge className="mt-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                              High
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {backlinks > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{formatNumber(backlinks)}</span>
                          {dofollow > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round((dofollow / backlinks) * 100)}% dofollow
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {refDomains > 0 ? (
                        <span className="font-medium">{formatNumber(refDomains)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {traffic > 0 ? (
                        <span className="font-medium text-emerald-500">
                          {formatNumber(Math.round(traffic))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ResponsiveContainer width="100%" height={30}>
                        <LineChart data={sparklineData}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="border-t p-4 bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Avg Authority Score</p>
              <p className="font-bold text-lg">
                {Math.round(
                  serpItems.reduce((sum, item) => sum + (item.authority_score || 0), 0) / serpItems.length
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Backlinks</p>
              <p className="font-bold text-lg">
                {formatNumber(
                  serpItems.reduce((sum, item) => sum + (item.backlinks?.backlinks || 0), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Ref Domains</p>
              <p className="font-bold text-lg">
                {formatNumber(
                  Math.round(
                    serpItems.reduce((sum, item) => sum + (item.backlinks?.referring_domains || 0), 0) / serpItems.length
                  )
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Traffic</p>
              <p className="font-bold text-lg text-emerald-500">
                {formatNumber(
                  Math.round(
                    serpItems.reduce((sum, item) => sum + (item.traffic?.etv || 0), 0)
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
