import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// N-gram similarity function (from existing codebase)
function nGramSimilarity(str1: string, str2: string, n: number = 2): number {
  const getNGrams = (str: string): Set<string> => {
    const normalized = str.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const grams = new Set<string>();
    for (let i = 0; i <= normalized.length - n; i++) {
      grams.add(normalized.slice(i, i + n));
    }
    return grams;
  };

  const grams1 = getNGrams(str1);
  const grams2 = getNGrams(str2);
  
  const intersection = new Set([...grams1].filter(x => grams2.has(x)));
  const union = new Set([...grams1, ...grams2]);
  
  return intersection.size / union.size;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords } = await req.json();

    if (!keywords || !Array.isArray(keywords)) {
      return new Response(
        JSON.stringify({ error: "Keywords array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (keywords.length === 0) {
      return new Response(
        JSON.stringify({ clusters: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simple clustering algorithm using n-gram similarity
    const SIMILARITY_THRESHOLD = 0.3;
    const clusters: any[] = [];

    keywords.forEach((keyword: string) => {
      let addedToCluster = false;

      for (const cluster of clusters) {
        // Check similarity with cluster representative (first keyword)
        const similarity = nGramSimilarity(keyword, cluster.keywords[0]);
        
        if (similarity >= SIMILARITY_THRESHOLD) {
          cluster.keywords.push(keyword);
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        // Create new cluster
        clusters.push({
          keywords: [keyword],
        });
      }
    });

    // Analyze each cluster and add metadata
    const enrichedClusters = clusters.map((cluster, index) => {
      const name = generateClusterName(cluster.keywords);
      const searchIntent = analyzeSearchIntent(cluster.keywords);
      const recommendedContentType = recommendContentType(cluster.keywords, searchIntent);

      return {
        name,
        keywords: cluster.keywords,
        searchIntent,
        recommendedContentType,
      };
    });

    return new Response(
      JSON.stringify({ clusters: enrichedClusters }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in cluster-keywords:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateClusterName(keywords: string[]): string {
  // Find most common words across keywords
  const wordFreq = new Map<string, number>();
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"]);

  keywords.forEach(keyword => {
    const words = keyword.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 2) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
  });

  // Get top 2-3 words
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  return topWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || keywords[0];
}

function analyzeSearchIntent(keywords: string[]): string {
  const keywordsLower = keywords.map(k => k.toLowerCase());
  
  // Transactional intent
  const transactionalWords = ["buy", "purchase", "order", "shop", "price", "cost", "cheap", "discount", "deal"];
  if (keywordsLower.some(k => transactionalWords.some(w => k.includes(w)))) {
    return "Transactional";
  }

  // Informational intent
  const informationalWords = ["how", "what", "why", "when", "where", "guide", "tutorial", "tips", "learn", "best"];
  if (keywordsLower.some(k => informationalWords.some(w => k.includes(w)))) {
    return "Informational";
  }

  // Commercial intent
  const commercialWords = ["best", "top", "review", "comparison", "vs", "alternative", "tool", "software"];
  if (keywordsLower.some(k => commercialWords.some(w => k.includes(w)))) {
    return "Commercial";
  }

  return "Navigational";
}

function recommendContentType(keywords: string[], intent: string): string {
  if (intent === "Transactional") {
    return "Product/Service Page";
  } else if (intent === "Informational") {
    const keywordsLower = keywords.map(k => k.toLowerCase());
    if (keywordsLower.some(k => k.includes("how to") || k.includes("guide"))) {
      return "How-To Guide";
    }
    if (keywordsLower.some(k => k.includes("what is") || k.includes("definition"))) {
      return "Glossary/Definition";
    }
    return "Blog Post / Article";
  } else if (intent === "Commercial") {
    return "Comparison / Review Post";
  }
  return "Landing Page";
}

