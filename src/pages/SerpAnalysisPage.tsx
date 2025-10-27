import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Target, Star, TrendingUp, ExternalLink } from "lucide-react";
import { useSerpAdvanced } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SerpAnalysisPage() {
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const { data: serpData, isLoading, error } = useSerpAdvanced(
    { keyword: searchKeyword, location_code: 2840, language_code: "en", device: "desktop" },
    !!searchKeyword
  );

  const handleSearch = () => {
    if (!keyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }
    setSearchKeyword(keyword.trim());
  };

  const serpResult = serpData?.tasks?.[0]?.result?.[0];
  const serpItems = serpResult?.items || [];
  const organicResults = serpItems.filter((item: any) => item.type === "organic");
  const featuredSnippet = serpItems.find((item: any) => item.type === "featured_snippet");
  const paaItems = serpItems.filter((item: any) => item.type === "people_also_ask");
  const relatedSearches = serpItems.filter((item: any) => item.type === "related_searches");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SERP Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Analyze search engine results pages and understand the competition
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <Input
            placeholder='Enter keyword to analyze (e.g., "best running shoes")'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Analyze SERP
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <div className="text-red-200">
            ⚠️ Error: {error.message}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && searchKeyword && serpItems.length > 0 && (
        <>
          {/* SERP Features Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Results</div>
              <div className="text-2xl font-bold mt-1">{serpItems.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Organic Results</div>
              <div className="text-2xl font-bold mt-1 text-emerald-400">{organicResults.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Featured Snippet</div>
              <div className="text-2xl font-bold mt-1">
                {featuredSnippet ? "✓" : "✗"}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">PAA Questions</div>
              <div className="text-2xl font-bold mt-1">{paaItems.length}</div>
            </Card>
          </div>

          {/* Featured Snippet */}
          {featuredSnippet && (
            <Card className="p-6 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold">Featured Snippet</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Domain</div>
                  <div className="font-medium text-lg">{featuredSnippet.domain}</div>
                </div>
                {featuredSnippet.title && (
                  <div>
                    <div className="text-sm text-muted-foreground">Title</div>
                    <div className="font-medium">{featuredSnippet.title}</div>
                  </div>
                )}
                {featuredSnippet.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Snippet Text</div>
                    <div className="text-sm">{featuredSnippet.description}</div>
                  </div>
                )}
                {featuredSnippet.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={featuredSnippet.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Page
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Organic Results */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Organic Results
            </h3>
            <div className="space-y-3">
              {organicResults.slice(0, 20).map((result: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="outline" className="font-mono">
                        #{result.rank_absolute || idx + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {result.title || "No title"}
                        </div>
                        <div className="text-sm text-muted-foreground truncate mt-1">
                          {result.domain}
                        </div>
                      </div>
                    </div>
                  </div>
                  {result.description && (
                    <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {result.description}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    {result.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visit
                        </a>
                      </Button>
                    )}
                    {result.breadcrumb && (
                      <div className="text-xs text-muted-foreground truncate">
                        {result.breadcrumb}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* People Also Ask */}
          {paaItems.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">People Also Ask</h3>
              <div className="space-y-2">
                {paaItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/50 border border-white/5"
                  >
                    <div className="font-medium text-sm">{item.title || item.question}</div>
                    {item.answer && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Related Searches */}
          {relatedSearches.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Related Searches</h3>
              <div className="flex flex-wrap gap-2">
                {relatedSearches.map((item: any, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {item.title || item.query}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && serpItems.length === 0 && searchKeyword && (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No SERP Data Found</h3>
          <p className="text-muted-foreground">
            Unable to fetch SERP results for this keyword
          </p>
        </Card>
      )}

      {/* Initial State */}
      {!searchKeyword && !isLoading && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyze Any Keyword's SERP</h3>
          <p className="text-muted-foreground mb-4">
            Enter a keyword to see real-time search results and SERP features
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            Discover: Featured snippets, PAA questions, organic rankings, and related searches
          </div>
        </Card>
      )}
    </div>
  );
}

