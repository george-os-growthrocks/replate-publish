import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Loader2, Star, Phone, ExternalLink, MessageSquare } from "lucide-react";
import { useGoogleMapsSearch } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FeatureGate } from "@/components/FeatureGate";

export default function LocalSeoPage() {
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationCode, setLocationCode] = useState("2840"); // USA default

  const { data: mapsData, isLoading, error } = useGoogleMapsSearch(
    {
      keyword: searchQuery,
      location_code: parseInt(locationCode),
      language_code: "en",
      depth: 20
    },
    !!searchQuery
  );

  const handleSearch = () => {
    if (!keyword.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    setSearchQuery(keyword.trim());
  };

  const businesses = mapsData?.tasks?.[0]?.result?.[0]?.items || [];
  const totalCount = businesses.length;

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-emerald-400";
    if (rating >= 4.0) return "text-blue-400";
    if (rating >= 3.5) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <FeatureGate feature="local_seo_audit" requiredPlan="Pro">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Local SEO & Google Maps</h1>
        <p className="text-muted-foreground mt-1">
          Track local rankings and analyze Google Business Profile performance
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <Input
              placeholder='Search query (e.g., "pizza restaurants", "coffee shops near me")'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Input
              placeholder="Location code"
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              className="w-32"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Location code examples: 2840 (USA), 1023191 (New York), 2826 (UK)
          </div>
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
      {!isLoading && businesses.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Businesses Found</div>
              <div className="text-2xl font-bold mt-1">{totalCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Avg Rating</div>
              <div className="text-2xl font-bold mt-1 flex items-center gap-1">
                {(businesses.reduce((sum: number, b: any) => sum + (b.rating?.value || 0), 0) / totalCount).toFixed(1)}
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Reviews</div>
              <div className="text-2xl font-bold mt-1">
                {businesses.reduce((sum: number, b: any) => sum + (b.rating?.votes_count || 0), 0).toLocaleString()}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Search Query</div>
              <div className="text-sm font-medium mt-1 truncate">{searchQuery}</div>
            </Card>
          </div>

          {/* Business Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map((business: any, idx: number) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
                      <h3 className="font-semibold text-lg">{business.title}</h3>
                    </div>
                    {business.category && (
                      <Badge variant="outline" className="mb-2">
                        {business.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {business.rating && (
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className={`h-4 w-4 fill-current ${getRatingColor(business.rating.value)}`} />
                      <span className={`font-bold ${getRatingColor(business.rating.value)}`}>
                        {business.rating.value.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {business.rating.votes_count.toLocaleString()} reviews
                    </div>
                  </div>
                )}

                {/* Address */}
                {business.address && (
                  <div className="flex items-start gap-2 mb-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{business.address}</span>
                  </div>
                )}

                {/* Phone */}
                {business.phone && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{business.phone}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  {business.url && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={business.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Maps
                      </a>
                    </Button>
                  )}
                  {business.cid && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Reviews
                    </Button>
                  )}
                </div>

                {/* Price Level */}
                {business.price_level && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Price: {business.price_level}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && businesses.length === 0 && searchQuery && (
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Businesses Found</h3>
          <p className="text-muted-foreground">
            Try a different search query or location
          </p>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery && !isLoading && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Search Local Businesses</h3>
          <p className="text-muted-foreground mb-4">
            Enter a search query to find local businesses on Google Maps
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            Examples: "pizza restaurants", "dentist near me", "coffee shops"
          </div>
        </Card>
      )}
      </div>
    </FeatureGate>
  );
}

