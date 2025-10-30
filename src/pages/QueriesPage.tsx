import { useState, useMemo, useEffect } from "react";
import { useFilters, DateRangePreset } from "@/contexts/FilterContext";
import { useGscDataWithChanges } from "@/hooks/useGscData";
import { groupByQuery } from "@/lib/cannibalization";
import { Card } from "@/components/ui/card";
import { KeywordDetailsModal } from "@/components/modals/KeywordDetailsModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, Star, StarOff, Target, Zap, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SortField = "query" | "clicks" | "impressions" | "ctr" | "position" | "change" | "pages";
type SortDirection = "asc" | "desc";

export default function QueriesPage() {
  const { propertyUrl, dateRange, dateRangePreset, setDateRangePreset, country, device } = useFilters();
  const [searchTerm, setSearchTerm] = useState("");
  const [trackedKeywords, setTrackedKeywords] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("all");
  const [selectedKeyword, setSelectedKeyword] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>("clicks");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: rows, isLoading } = useGscDataWithChanges({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
    device,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection(field === "position" ? "asc" : "desc"); // Position: lower is better
    }
  };

  const queries = useMemo(() => {
    if (!rows) return [];
    const grouped = groupByQuery(rows);
    
    // Debug: Check if comparison data exists
    console.log('🔍 First grouped query sample:', grouped[0]);
    console.log('🔍 Has positionChange?', grouped[0]?.positionChange);
    console.log('🔍 Has positionChangePercent?', grouped[0]?.positionChangePercent);

    let filtered = grouped;

    // Apply tab filtering
    switch (activeTab) {
      case "tracked":
        filtered = filtered.filter(q => q.query && trackedKeywords.has(q.query.toLowerCase()));
        break;
      case "new":
        // Keywords with position <= 10 as "new opportunities"
        filtered = filtered.filter(q => typeof q.avgPosition === 'number' && q.avgPosition <= 10);
        break;
      case "lost":
        // Keywords with low CTR as "lost opportunities"
        filtered = filtered.filter(q => typeof q.avgCtr === 'number' && q.avgCtr < 0.02);
        break;
      case "improved":
        // Keywords performing well (position <= 10)
        filtered = filtered.filter(q => typeof q.avgPosition === 'number' && q.avgPosition <= 10);
        break;
      case "declined":
        // Keywords performing poorly (position > 20)
        filtered = filtered.filter(q => typeof q.avgPosition === 'number' && q.avgPosition > 20);
        break;
      case "top_3":
        // Keywords in top 3 positions
        filtered = filtered.filter(q => typeof q.avgPosition === 'number' && q.avgPosition <= 3);
        break;
      case "top_10":
        // Keywords in top 10 positions
        filtered = filtered.filter(q => typeof q.avgPosition === 'number' && q.avgPosition <= 10);
        break;
      case "outside_top_10":
        // Keywords outside top 10 positions
        filtered = filtered.filter(q => typeof q.avgPosition === 'number' && q.avgPosition > 10);
        break;
      case "low_hanging_fruit":
        // Low-hanging fruit: High impressions + low CTR + reasonable position (not too low)
        // These are keywords that get traffic but have poor CTR (easy optimization wins)
        filtered = filtered.filter(q =>
          typeof q.totalImpressions === 'number' && q.totalImpressions > 100 && // Significant search volume
          typeof q.avgCtr === 'number' && q.avgCtr < 0.03 && // Poor CTR (below 3%)
          typeof q.avgPosition === 'number' && q.avgPosition <= 50 // Not completely lost (still rankable)
        );
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    // Apply search filtering
    if (searchTerm) {
      filtered = filtered.filter((q) =>
        q.query && q.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "query":
          aVal = a.query?.toLowerCase() || "";
          bVal = b.query?.toLowerCase() || "";
          break;
        case "clicks":
          aVal = a.totalClicks || 0;
          bVal = b.totalClicks || 0;
          break;
        case "impressions":
          aVal = a.totalImpressions || 0;
          bVal = b.totalImpressions || 0;
          break;
        case "ctr":
          aVal = a.avgCtr || 0;
          bVal = b.avgCtr || 0;
          break;
        case "position":
          aVal = a.avgPosition || 999;
          bVal = b.avgPosition || 999;
          break;
        case "change":
          aVal = a.positionChange ?? 0;
          bVal = b.positionChange ?? 0;
          break;
        case "pages":
          aVal = a.pages?.length || 0;
          bVal = b.pages?.length || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return sorted;
  }, [rows, searchTerm, activeTab, trackedKeywords, sortField, sortDirection]);

  // Load tracked keywords
  const loadTrackedKeywords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !propertyUrl) return;

      const { data, error } = await supabase
        .from('tracked_keywords')
        .select('keyword')
        .eq('user_id', user.id)
        .eq('property', propertyUrl)
        .eq('active', true);

      if (error) throw error;

      const trackedSet = new Set(data?.map(item => item.keyword.toLowerCase()) || []);
      setTrackedKeywords(trackedSet);
    } catch (error) {
      console.error('Failed to load tracked keywords:', error);
    }
  };

  // Toggle keyword tracking
  const toggleKeywordTracking = async (keyword: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !propertyUrl) return;

      const isTracked = trackedKeywords.has(keyword.toLowerCase());

      if (isTracked) {
        // Untrack keyword
        const { error } = await supabase
          .from('tracked_keywords')
          .delete()
          .eq('user_id', user.id)
          .eq('property', propertyUrl)
          .eq('keyword', keyword);

        if (error) throw error;

        setTrackedKeywords(prev => {
          const newSet = new Set(prev);
          newSet.delete(keyword.toLowerCase());
          return newSet;
        });

        toast.success(`Stopped tracking "${keyword}"`);
      } else {
        // Track keyword
        const { error } = await supabase
          .from('tracked_keywords')
          .insert({
            user_id: user.id,
            property: propertyUrl,
            keyword: keyword,
            target_position: Math.floor(queries.find(q => q.query === keyword)?.avgPosition || 10)
          });

        if (error) throw error;

        setTrackedKeywords(prev => new Set([...prev, keyword.toLowerCase()]));
        toast.success(`Now tracking "${keyword}"`);
      }
    } catch (error) {
      console.error('Failed to toggle keyword tracking:', error);
      toast.error('Failed to update keyword tracking');
    }
  };

  // Load tracked keywords when component mounts or property changes
  useEffect(() => {
    if (propertyUrl) {
      loadTrackedKeywords();
    }
  }, [propertyUrl]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Search Queries</h1>
          <p className="text-muted-foreground mt-1">
            See which pages rank for each query
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRangePreset} onValueChange={(value: DateRangePreset) => setDateRangePreset(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="this_month">This month</SelectItem>
              <SelectItem value="last_month">Last month</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => exportToCSV()}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Comparison Info Banner */}
      {dateRange?.from && dateRange?.to && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                Period-over-Period Comparison Active
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Comparing {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()} 
                {" vs previous period "}
                ({(() => {
                  const start = new Date(dateRange.from);
                  const end = new Date(dateRange.to);
                  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                  const prevEnd = new Date(start);
                  prevEnd.setDate(prevEnd.getDate() - 1);
                  const prevStart = new Date(prevEnd);
                  prevStart.setDate(prevStart.getDate() - diffDays + 1);
                  return `${prevStart.toLocaleDateString()} - ${prevEnd.toLocaleDateString()}`;
                })()})
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All Keywords ({rows ? groupByQuery(rows).length : 0})
          </button>
          <button
            onClick={() => setActiveTab("tracked")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "tracked"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Tracked ({trackedKeywords.size})
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "new"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            New Opportunities
          </button>
          <button
            onClick={() => setActiveTab("lost")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "lost"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Lost Opportunities
          </button>
          <button
            onClick={() => setActiveTab("low_hanging_fruit")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "low_hanging_fruit"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Low-hanging Fruit
          </button>
        </div>
      </div>

      {/* Visual Score Blocks - Keyword Performance Categories */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* Improved Keywords */}
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
          onClick={() => setActiveTab("improved")}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-green-700">Improved</div>
              <div className="text-lg font-bold text-green-600">
                {queries.filter(q => q.avgPosition <= 10).length}
              </div>
            </div>
          </div>
        </Card>

        {/* Declined Keywords */}
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-500"
          onClick={() => setActiveTab("declined")}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
            </div>
            <div>
              <div className="text-sm font-medium text-red-700">Declined</div>
              <div className="text-lg font-bold text-red-600">
                {queries.filter(q => q.avgPosition > 20).length}
              </div>
            </div>
          </div>
        </Card>

        {/* Top 3 Keywords */}
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-yellow-500"
          onClick={() => setActiveTab("top_3")}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <Target className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-yellow-700">Top 3</div>
              <div className="text-lg font-bold text-yellow-600">
                {queries.filter(q => q.avgPosition <= 3).length}
              </div>
            </div>
          </div>
        </Card>

        {/* Top 10 Keywords */}
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
          onClick={() => setActiveTab("top_10")}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-blue-700">Top 10</div>
              <div className="text-lg font-bold text-blue-600">
                {queries.filter(q => q.avgPosition <= 10).length}
              </div>
            </div>
          </div>
        </Card>

        {/* Outside Top 10 */}
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-gray-500"
          onClick={() => setActiveTab("outside_top_10")}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Outside Top 10</div>
              <div className="text-lg font-bold text-gray-600">
                {queries.filter(q => q.avgPosition > 10).length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Keyword Details Modal */}
      {selectedKeyword && (
        <KeywordDetailsModal
          keyword={selectedKeyword}
          onClose={() => setSelectedKeyword(null)}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Queries</div>
          <div className="text-2xl font-bold mt-1">{queries.length.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Clicks</div>
          <div className="text-2xl font-bold mt-1">
            {queries.reduce((sum, q) => sum + q.totalClicks, 0).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg CTR</div>
          <div className="text-2xl font-bold mt-1">
            {(() => {
              const count = queries.length || 1;
              const avg = (queries.reduce((sum, q) => sum + (q.avgCtr || 0), 0) / count) * 100;
              return Number.isFinite(avg) ? avg.toFixed(2) : "0.00";
            })()}
            %
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Position</div>
          <div className="text-2xl font-bold mt-1">
            {(() => {
              const count = queries.length || 1;
              const avg = queries.reduce((sum, q) => sum + (q.avgPosition || 0), 0) / count;
              return Number.isFinite(avg) ? avg.toFixed(1) : "0.0";
            })()}
          </div>
        </Card>
      </div>

      {/* Queries Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 font-semibold hover:bg-muted"
                  onClick={() => handleSort("query")}
                >
                  Query
                  {sortField === "query" && (
                    sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortField !== "query" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead>Top Page</TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 font-semibold hover:bg-muted"
                  onClick={() => handleSort("clicks")}
                >
                  Clicks
                  {sortField === "clicks" && (
                    sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortField !== "clicks" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 font-semibold hover:bg-muted"
                  onClick={() => handleSort("impressions")}
                >
                  Impressions
                  {sortField === "impressions" && (
                    sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortField !== "impressions" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 font-semibold hover:bg-muted"
                  onClick={() => handleSort("ctr")}
                >
                  CTR
                  {sortField === "ctr" && (
                    sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortField !== "ctr" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 font-semibold hover:bg-muted"
                  onClick={() => handleSort("position")}
                >
                  Position
                  {sortField === "position" && (
                    sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortField !== "position" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 font-semibold hover:bg-muted"
                  onClick={() => handleSort("change")}
                >
                  Change
                  {sortField === "change" && (
                    sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortField !== "change" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  className="h-8 px-2 font-semibold hover:bg-muted"
                  onClick={() => handleSort("pages")}
                >
                  Pages
                  {sortField === "pages" && (
                    sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                  )}
                  {sortField !== "pages" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.slice(0, 100).map((query) => {
              const topPage = query.pages[0];

              return (
                <>
                  {/* Main Row */}
                  <TableRow
                    key={query.query}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedKeyword(query)}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleKeywordTracking(query.query);
                        }}
                        title={trackedKeywords.has(query.query.toLowerCase()) ? "Untrack keyword" : "Track keyword"}
                      >
                        {trackedKeywords.has(query.query.toLowerCase()) ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground hover:text-yellow-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium max-w-md truncate">
                      {query.query}
                      {query.pages.length > 1 && (
                        <span className="ml-2 text-xs text-amber-500">
                          {query.pages.length} pages
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {topPage?.page || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {query.totalClicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {query.totalImpressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {((query.avgCtr || 0) * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {(query.avgPosition || 0).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(typeof query.positionChange === 'number' && Number.isFinite(query.positionChange) && 
                        typeof query.positionChangePercent === 'number' && Number.isFinite(query.positionChangePercent)) ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium ${
                              query.positionChange > 0 ? 'text-red-600' :
                              query.positionChange < 0 ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              {query.positionChange > 0 ? '↓' : query.positionChange < 0 ? '↑' : '→'}
                              {Math.abs(query.positionChange).toFixed(1)}
                            </span>
                          </div>
                          <span className={`text-xs ${
                            query.positionChangePercent > 0 ? 'text-red-500' :
                            query.positionChangePercent < 0 ? 'text-green-500' : 'text-muted-foreground'
                          }`}>
                            ({query.positionChangePercent > 0 ? '+' : ''}{query.positionChangePercent.toFixed(1)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {query.pages.length}
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const exportToCSV = () => {
    const csvData = queries.map(query => ({
      Query: query.query || "",
      "Top Page": query.pages[0]?.page || "",
      Clicks: query.totalClicks || 0,
      Impressions: query.totalImpressions || 0,
      CTR: ((query.avgCtr || 0) * 100).toFixed(2) + "%",
      Position: (query.avgPosition || 0).toFixed(1),
      "Position Change %": (typeof query.positionChangePercent === 'number' && Number.isFinite(query.positionChangePercent)) 
        ? query.positionChangePercent.toFixed(1) + "%" 
        : "N/A",
      Pages: query.pages?.length || 0,
      Tracked: trackedKeywords.has((query.query || "").toLowerCase()) ? "Yes" : "No"
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `keywords-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${queries.length} keywords to CSV`);
  };
}

