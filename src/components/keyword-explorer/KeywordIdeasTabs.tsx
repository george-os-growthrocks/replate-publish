import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
  ArrowUpDown,
  HelpCircle,
  Lightbulb,
  Link2,
  FileText
} from "lucide-react";
import { KeywordIdea } from "@/types/keyword-explorer";

interface KeywordIdeasTabsProps {
  matchingTerms: KeywordIdea[];
  relatedTerms: KeywordIdea[];
  questions: KeywordIdea[];
  searchSuggestions: string[];
  loading: boolean;
  onKeywordClick?: (keyword: string) => void;
}

type SortField = "keyword" | "volume" | "kd" | "cpc" | "clicks";
type SortOrder = "asc" | "desc";

export function KeywordIdeasTabs({
  matchingTerms,
  relatedTerms,
  questions,
  searchSuggestions,
  loading,
  onKeywordClick
}: KeywordIdeasTabsProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [minVolume, setMinVolume] = useState<number>(0);
  const [maxKD, setMaxKD] = useState<number>(100);

  // Helper to extract and sort data
  const processKeywords = (keywords: KeywordIdea[]) => {
    let filtered = keywords;

    // Apply search filter
    if (searchFilter) {
      filtered = filtered.filter(kw =>
        kw.keyword.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Apply volume filter
    filtered = filtered.filter(kw => 
      (kw.keyword_info?.search_volume || 0) >= minVolume
    );

    // Apply KD filter
    filtered = filtered.filter(kw =>
      (kw.keyword_properties?.keyword_difficulty || 0) <= maxKD
    );

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case "keyword":
          aVal = a.keyword;
          bVal = b.keyword;
          break;
        case "volume":
          aVal = a.keyword_info?.search_volume || 0;
          bVal = b.keyword_info?.search_volume || 0;
          break;
        case "kd":
          aVal = a.keyword_properties?.keyword_difficulty || 0;
          bVal = b.keyword_properties?.keyword_difficulty || 0;
          break;
        case "cpc":
          aVal = a.keyword_info?.cpc || 0;
          bVal = b.keyword_info?.cpc || 0;
          break;
        case "clicks":
          aVal = a.impressions_info?.daily_clicks_average || 0;
          bVal = b.impressions_info?.daily_clicks_average || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getDifficultyColor = (kd: number) => {
    if (kd < 30) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (kd < 50) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (kd < 70) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  const renderKeywordTable = (keywords: KeywordIdea[]) => {
    const processed = processKeywords(keywords);

    if (processed.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {keywords.length === 0
            ? "No keywords found. Try searching for a keyword first."
            : "No keywords match your filters. Try adjusting the filters."}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSort("keyword")}
                className="h-8 p-0 hover:bg-transparent"
              >
                Keyword
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSort("volume")}
                className="h-8 p-0 hover:bg-transparent"
              >
                Volume
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSort("kd")}
                className="h-8 p-0 hover:bg-transparent"
              >
                KD
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSort("cpc")}
                className="h-8 p-0 hover:bg-transparent"
              >
                CPC
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSort("clicks")}
                className="h-8 p-0 hover:bg-transparent"
              >
                Clicks
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-center">Intent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processed.slice(0, 100).map((kw, idx) => {
            const volume = kw.keyword_info?.search_volume || 0;
            const kd = kw.keyword_properties?.keyword_difficulty || 0;
            const cpc = kw.keyword_info?.cpc || 0;
            const clicks = (kw.impressions_info?.daily_clicks_average || 0) * 30; // Monthly
            const intent = kw.search_intent_info?.main_intent || "unknown";

            return (
              <TableRow key={idx} className="hover:bg-muted/50 cursor-pointer">
                <TableCell 
                  className="font-medium max-w-md"
                  onClick={() => onKeywordClick?.(kw.keyword)}
                >
                  <div className="truncate" title={kw.keyword}>
                    {kw.keyword}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {volume > 0 ? (
                    <span className="font-medium">{volume.toLocaleString()}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {kd > 0 ? (
                    <Badge className={getDifficultyColor(kd)}>
                      {kd}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {cpc > 0 ? (
                    <span className="text-emerald-400 font-medium">${cpc.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {clicks > 0 ? (
                    <span className="font-medium">{Math.round(clicks).toLocaleString()}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs capitalize">
                    {intent}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      {/* Filters Bar */}
      <div className="border-b p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Filter */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter keywords..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Min Volume */}
          <div>
            <Select value={minVolume.toString()} onValueChange={(v) => setMinVolume(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Min volume" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any volume</SelectItem>
                <SelectItem value="100">100+ searches</SelectItem>
                <SelectItem value="500">500+ searches</SelectItem>
                <SelectItem value="1000">1K+ searches</SelectItem>
                <SelectItem value="5000">5K+ searches</SelectItem>
                <SelectItem value="10000">10K+ searches</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max KD */}
          <div>
            <Select value={maxKD.toString()} onValueChange={(v) => setMaxKD(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Max KD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">Any difficulty</SelectItem>
                <SelectItem value="30">Easy (0-30)</SelectItem>
                <SelectItem value="50">Medium (0-50)</SelectItem>
                <SelectItem value="70">Hard (0-70)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matching" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
          <TabsTrigger 
            value="matching" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Matching terms ({matchingTerms.length})
          </TabsTrigger>
          <TabsTrigger 
            value="related"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary flex items-center gap-2"
          >
            <Link2 className="h-4 w-4" />
            Related ({relatedTerms.length})
          </TabsTrigger>
          <TabsTrigger 
            value="questions"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger 
            value="suggestions"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Suggestions ({searchSuggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matching" className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            renderKeywordTable(matchingTerms)
          )}
        </TabsContent>

        <TabsContent value="related" className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            renderKeywordTable(relatedTerms)
          )}
        </TabsContent>

        <TabsContent value="questions" className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            renderKeywordTable(questions)
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : searchSuggestions.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {searchSuggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => onKeywordClick?.(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No suggestions available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
