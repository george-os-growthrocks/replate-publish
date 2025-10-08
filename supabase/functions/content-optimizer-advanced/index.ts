import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  projectId: string;
  targetKeyword: string;
  targetUrl?: string;
  analyzeCompetitors?: boolean;
}

interface TermFrequency {
  term: string;
  frequency: number;
  tfIdf: number;
  bm25: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projectId, targetKeyword, targetUrl, analyzeCompetitors = true }: AnalysisRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dataForSeoLogin = Deno.env.get("DATAFORSEO_LOGIN");
    const dataForSeoPassword = Deno.env.get("DATAFORSEO_PASSWORD");

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Create analysis session
    const { data: analysis, error: analysisError } = await supabase
      .from("content_analyses")
      .insert({
        project_id: projectId,
        target_keyword: targetKeyword,
        target_url: targetUrl,
        status: "analyzing"
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    const analysisId = analysis.id;

    // Background processing
    (async () => {
      try {
        let serpResults: any[] = [];

        // Fetch SERP data from DataForSEO
        if (dataForSeoLogin && dataForSeoPassword && analyzeCompetitors) {
          const authString = btoa(`${dataForSeoLogin}:${dataForSeoPassword}`);
          const serpResponse = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authString}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([{
              keyword: targetKeyword,
              language_code: "en",
              location_code: 2840,
              device: "desktop",
              depth: 10
            }])
          });

          if (serpResponse.ok) {
            const serpData = await serpResponse.json();
            serpResults = serpData.tasks?.[0]?.result?.[0]?.items || [];
          }
        }

        // Extract content from top 10 SERP results
        const serpContentPromises = serpResults.slice(0, 10).map(async (item: any, index: number) => {
          try {
            const url = item.url;
            const position = item.rank_absolute || index + 1;

            // Crawl the page content
            const crawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${Deno.env.get("FIRECRAWL_API_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url,
                formats: ["markdown", "html"],
                includeTags: ["h1", "h2", "h3", "h4", "h5", "h6", "title", "meta"],
                onlyMainContent: true,
              }),
            });

            if (!crawlResponse.ok) return null;

            const crawlData = await crawlResponse.json();
            const content = crawlData.markdown || "";
            const html = crawlData.html || "";
            const metadata = crawlData.metadata || {};

            // Extract metrics
            const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;
            const headingMatches = html.match(/<h[1-6][^>]*>/gi) || [];
            const imageMatches = html.match(/<img[^>]*>/gi) || [];
            const linkMatches = html.match(/<a[^>]*href=/gi) || [];

            // Store SERP content analysis
            const { data: serpContent } = await supabase
              .from("serp_content_analysis")
              .insert({
                analysis_id: analysisId,
                position,
                url,
                title: metadata.title || "",
                meta_description: metadata.description || "",
                word_count: wordCount,
                heading_count: headingMatches.length,
                image_count: imageMatches.length,
                internal_links: linkMatches.length,
                content_structure: {
                  h1: html.match(/<h1[^>]*>/gi)?.length || 0,
                  h2: html.match(/<h2[^>]*>/gi)?.length || 0,
                  h3: html.match(/<h3[^>]*>/gi)?.length || 0,
                },
                raw_content: content.substring(0, 50000)
              })
              .select()
              .single();

            return { url, content, wordCount, position };
          } catch (error) {
            console.error(`Error analyzing SERP result:`, error);
            return null;
          }
        });

        const serpContents = (await Promise.all(serpContentPromises)).filter(Boolean);

        // Calculate TF-IDF scores
        const documentTerms = new Map<string, Map<string, number>>();
        const documentFrequency = new Map<string, number>();
        const totalDocuments = serpContents.length;

        // Build term frequency maps
        serpContents.forEach((doc: any) => {
          const terms = extractTerms(doc.content);
          const termCounts = new Map<string, number>();

          terms.forEach(term => {
            termCounts.set(term, (termCounts.get(term) || 0) + 1);
          });

          documentTerms.set(doc.url, termCounts);

          // Update document frequency
          Array.from(termCounts.keys()).forEach(term => {
            documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
          });
        });

        // Calculate TF-IDF and BM25 for each document
        const allTermScores: TermFrequency[] = [];
        const k1 = 1.5; // BM25 parameter
        const b = 0.75; // BM25 parameter
        const avgDocLength = serpContents.reduce((sum: number, doc: any) => sum + doc.wordCount, 0) / totalDocuments;

        documentTerms.forEach((termCounts, url) => {
          const docLength = serpContents.find((d: any) => d.url === url)?.wordCount || 1000;

          termCounts.forEach((tf, term) => {
            const df = documentFrequency.get(term) || 1;
            const idf = Math.log((totalDocuments - df + 0.5) / (df + 0.5) + 1);
            const tfIdf = tf * idf;

            // BM25 score
            const normalizedTf = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
            const bm25 = idf * normalizedTf;

            allTermScores.push({
              term,
              frequency: tf,
              tfIdf: parseFloat(tfIdf.toFixed(6)),
              bm25: parseFloat(bm25.toFixed(6))
            });
          });
        });

        // Aggregate and rank terms
        const termAggregates = new Map<string, { totalTfIdf: number; totalBm25: number; count: number }>();

        allTermScores.forEach(({ term, tfIdf, bm25 }) => {
          const current = termAggregates.get(term) || { totalTfIdf: 0, totalBm25: 0, count: 0 };
          current.totalTfIdf += tfIdf;
          current.totalBm25 += bm25;
          current.count += 1;
          termAggregates.set(term, current);
        });

        // Get top terms
        const topTerms = Array.from(termAggregates.entries())
          .map(([term, stats]) => ({
            term,
            avgTfIdf: stats.totalTfIdf / stats.count,
            avgBm25: stats.totalBm25 / stats.count,
            frequency: stats.count
          }))
          .sort((a, b) => b.avgBm25 - a.avgBm25)
          .slice(0, 100);

        // Store term frequencies
        const termFrequencyRecords = topTerms.map((t, index) => ({
          analysis_id: analysisId,
          source_url: "aggregate",
          source_position: null,
          term: t.term,
          term_frequency: t.avgTfIdf,
          document_frequency: t.frequency,
          tf_idf_score: t.avgTfIdf,
          bm25_score: t.avgBm25
        }));

        await supabase.from("term_frequency").insert(termFrequencyRecords);

        // Generate recommendations
        const recommendations = generateRecommendations(topTerms, targetKeyword);

        await supabase.from("content_recommendations").insert(
          recommendations.map(r => ({
            analysis_id: analysisId,
            category: r.category,
            priority: r.priority,
            title: r.title,
            description: r.description,
            suggested_terms: r.suggestedTerms,
            impact_score: r.impactScore,
            effort_level: r.effortLevel
          }))
        );

        // Calculate optimization score
        const optimizationScore = calculateOptimizationScore(serpContents);

        // Update analysis status
        await supabase
          .from("content_analyses")
          .update({
            status: "completed",
            serp_analyzed_count: serpContents.length,
            total_terms_extracted: topTerms.length,
            optimization_score: optimizationScore,
            completed_at: new Date().toISOString()
          })
          .eq("id", analysisId);

      } catch (error) {
        console.error("Analysis error:", error);
        await supabase
          .from("content_analyses")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error"
          })
          .eq("id", analysisId);
      }
    })();

    return new Response(
      JSON.stringify({
        success: true,
        analysisId,
        message: "Content analysis started"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Content optimizer error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions
function extractTerms(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
}

function generateRecommendations(topTerms: any[], targetKeyword: string) {
  const recommendations: any[] = [];

  // Find missing high-value terms
  const topMissingTerms = topTerms.slice(0, 20).filter(t => !t.term.includes(targetKeyword.toLowerCase()));

  if (topMissingTerms.length > 0) {
    recommendations.push({
      category: 'keywords',
      priority: 'high',
      title: 'Add High-Value Related Terms',
      description: `Include these semantic keywords found in top-ranking content to improve topical relevance.`,
      suggestedTerms: topMissingTerms.slice(0, 10).map(t => t.term),
      impactScore: 85,
      effortLevel: 'low'
    });
  }

  // Content length recommendation
  recommendations.push({
    category: 'structure',
    priority: 'medium',
    title: 'Optimize Content Length',
    description: 'Top-ranking pages average 1,800-2,500 words. Ensure comprehensive coverage of the topic.',
    suggestedTerms: [],
    impactScore: 70,
    effortLevel: 'medium'
  });

  // Heading structure
  recommendations.push({
    category: 'structure',
    priority: 'high',
    title: 'Improve Heading Hierarchy',
    description: 'Use H2-H4 tags to organize content with related keywords in subheadings.',
    suggestedTerms: topTerms.slice(0, 5).map(t => t.term),
    impactScore: 75,
    effortLevel: 'low'
  });

  return recommendations;
}

function calculateOptimizationScore(serpContents: any[]): number {
  if (serpContents.length === 0) return 50;

  const avgWordCount = serpContents.reduce((sum: number, doc: any) => sum + doc.wordCount, 0) / serpContents.length;
  const score = Math.min(100, (avgWordCount / 2000) * 100);

  return parseFloat(score.toFixed(2));
}
