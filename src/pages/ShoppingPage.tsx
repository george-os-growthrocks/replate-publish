import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Loader2, ExternalLink, Star, TrendingUp } from "lucide-react";
import { useMerchantProductsSearch } from "@/hooks/useDataForSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ShoppingPage() {
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: productsData, isLoading, error } = useMerchantProductsSearch(
    {
      keyword: searchQuery,
      location_code: 2840,
      language_code: "en",
      depth: 50
    },
    !!searchQuery
  );

  const handleSearch = () => {
    if (!keyword.trim()) {
      toast.error("Please enter a product search query");
      return;
    }
    setSearchQuery(keyword.trim());
  };

  const products = productsData?.tasks?.[0]?.result?.[0]?.items || [];
  const totalCount = products.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shopping & Product Research</h1>
        <p className="text-muted-foreground mt-1">
          Discover products, track prices, and analyze the competitive landscape
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <Input
            placeholder='Search products (e.g., "wireless headphones", "running shoes")'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
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
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && products.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Products Found</div>
              <div className="text-2xl font-bold mt-1">{totalCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Avg Price</div>
              <div className="text-2xl font-bold mt-1">
                {products
                  .filter((p: any) => p.price?.current)
                  .reduce((sum: number, p: any, idx: number, arr: any[]) => {
                    const price = parseFloat(p.price.current.toString().replace(/[^0-9.]/g, ''));
                    return sum + (price / arr.length);
                  }, 0)
                  .toFixed(2)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Unique Sellers</div>
              <div className="text-2xl font-bold mt-1">
                {new Set(products.map((p: any) => p.seller?.name).filter(Boolean)).size}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Search Query</div>
              <div className="text-sm font-medium mt-1 truncate">{searchQuery}</div>
            </Card>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product: any, idx: number) => (
              <Card key={idx} className="p-4">
                {/* Product Image */}
                {product.image_url && (
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-slate-900">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                      {product.title}
                    </h3>
                  </div>

                  {/* Price */}
                  {product.price?.current && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-400">
                        {product.price.currency || "$"}{product.price.current}
                      </span>
                      {product.price.regular && product.price.regular !== product.price.current && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.price.currency || "$"}{product.price.regular}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{product.rating.value}</span>
                      </div>
                      {product.rating.votes_count && (
                        <span className="text-sm text-muted-foreground">
                          ({product.rating.votes_count})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Seller */}
                  {product.seller?.name && (
                    <div className="text-sm text-muted-foreground">
                      by <span className="font-medium">{product.seller.name}</span>
                    </div>
                  )}

                  {/* Delivery */}
                  {product.delivery?.price && (
                    <div className="text-xs text-muted-foreground">
                      {product.delivery.price === 0 ? "Free Delivery" : `Delivery: ${product.delivery.price}`}
                    </div>
                  )}

                  {/* Actions */}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={product.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Product
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Price Distribution */}
          {products.length > 5 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price Analysis
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Lowest Price</div>
                  <div className="text-xl font-bold text-emerald-400">
                    $
                    {Math.min(
                      ...products
                        .filter((p: any) => p.price?.current)
                        .map((p: any) => parseFloat(p.price.current.toString().replace(/[^0-9.]/g, '')))
                    ).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Average Price</div>
                  <div className="text-xl font-bold">
                    $
                    {products
                      .filter((p: any) => p.price?.current)
                      .reduce((sum: number, p: any, idx: number, arr: any[]) => {
                        const price = parseFloat(p.price.current.toString().replace(/[^0-9.]/g, ''));
                        return sum + (price / arr.length);
                      }, 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Highest Price</div>
                  <div className="text-xl font-bold text-red-400">
                    $
                    {Math.max(
                      ...products
                        .filter((p: any) => p.price?.current)
                        .map((p: any) => parseFloat(p.price.current.toString().replace(/[^0-9.]/g, '')))
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && searchQuery && (
        <Card className="p-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
          <p className="text-muted-foreground">
            Try a different search query or check your spelling
          </p>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery && !isLoading && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Search Products on Google Shopping</h3>
          <p className="text-muted-foreground mb-4">
            Enter a product keyword to analyze prices and competition
          </p>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            Examples: "wireless headphones", "running shoes", "laptop backpack"
          </div>
        </Card>
      )}
    </div>
  );
}

