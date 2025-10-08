import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PageWithEmbedding {
  id: string;
  page_url: string;
  page_title: string;
  page_content: string;
  embedding: number[];
  keywords: any[];
}

interface LinkOpportunity {
  source_url: string;
  target_url: string;
  anchor_text: string;
  semantic_score: number;
  relevance_score: number;
  confidence_level: string;
  context_snippet: string;
  reason: string;
}

// Calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Extract n-grams for anchor text candidates
function extractNGrams(text: string, n: number): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3); // Filter short words
  
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

// Generate anchor text suggestions
function generateAnchorText(
  sourceContent: string,
  targetTitle: string,
  targetKeywords: string[]
): string {
  // Prioritize exact keyword matches
  for (const keyword of targetKeywords) {
    if (sourceContent.toLowerCase().includes(keyword.toLowerCase())) {
      return keyword;
    }
  }
  
  // Use target title if it appears in source
  const titleWords = targetTitle.toLowerCase().split(/\s+/);
  for (let i = 0; i < titleWords.length - 1; i++) {
    const phrase = titleWords.slice(i, Math.min(i + 4, titleWords.length)).join(' ');
    if (sourceContent.toLowerCase().includes(phrase)) {
      return titleWords.slice(i, Math.min(i + 4, titleWords.length)).join(' ');
    }
  }
  
  // Fall back to target title
  return targetTitle.substring(0, 60);
}

// Find link opportunities
function findLinkOpportunities(
  sources: PageWithEmbedding[],
  targets: PageWithEmbedding[],
  minSimilarity = 0.75
): LinkOpportunity[] {
  const opportunities: LinkOpportunity[] = [];

  for (const source of sources) {
    // Skip if source has too many outbound links already
    if (source.keywords && source.keywords.length > 20) continue;

    for (const target of targets) {
      // Don't link to self
      if (source.page_url === target.page_url) continue;

      const semanticScore = cosineSimilarity(source.embedding, target.embedding);

      if (semanticScore >= minSimilarity) {
        // Extract target keywords from target page
        const targetKeywords = target.keywords 
          ? target.keywords.map((k: any) => k.keyword || k)
          : [target.page_title];

        // Generate anchor text
        const anchorText = generateAnchorText(
          source.page_content || '',
          target.page_title || target.page_url,
          targetKeywords
        );

        // Find context snippet where anchor would fit
        const lowerContent = (source.page_content || '').toLowerCase();
        const anchorLower = anchorText.toLowerCase();
        const contextIndex = lowerContent.indexOf(anchorLower);
        
        let contextSnippet = '';
        if (contextIndex >= 0) {
          const start = Math.max(0, contextIndex - 50);
          const end = Math.min(lowerContent.length, contextIndex + anchorText.length + 50);
          contextSnippet = source.page_content?.substring(start, end) || '';
        }

        // Calculate relevance score
        const keywordMatch = targetKeywords.some((k: string) => 
          (source.page_content || '').toLowerCase().includes(k.toLowerCase())
        ) ? 0.3 : 0;
        
        const relevanceScore = (semanticScore * 0.7) + keywordMatch;

        // Determine confidence level
        let confidenceLevel = 'low';
        if (relevanceScore >= 0.85) confidenceLevel = 'high';
        else if (relevanceScore >= 0.75) confidenceLevel = 'medium';

        opportunities.push({
          source_url: source.page_url,
          target_url: target.page_url,
          anchor_text: anchorText,
          semantic_score: semanticScore,
          relevance_score: relevanceScore,
          confidence_level: confidenceLevel,
          context_snippet: contextSnippet,
          reason: `High semantic similarity (${(semanticScore * 100).toFixed(1)}%) between pages`
        });
      }
    }
  }

  // Sort by relevance score
  return opportunities.sort((a, b) => b.relevance_score - a.relevance_score);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { projectId, minSimilarity = 0.75, limit = 100 } = await req.json();

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log('Finding semantic link opportunities for project:', projectId);

    // Fetch pages with embeddings
    const { data: pages, error: fetchError } = await supabaseClient
      .from('internal_linking_pages')
      .select('id, page_url, page_title, page_content, embedding, keywords')
      .eq('project_id', projectId)
      .not('embedding', 'is', null);

    if (fetchError) throw fetchError;

    if (!pages || pages.length < 2) {
      return new Response(JSON.stringify({ 
        opportunities: [],
        message: 'Not enough pages with embeddings found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${pages.length} pages with embeddings`);

    // Find opportunities
    const opportunities = findLinkOpportunities(
      pages as PageWithEmbedding[],
      pages as PageWithEmbedding[],
      minSimilarity
    ).slice(0, limit);

    console.log(`Found ${opportunities.length} link opportunities`);

    // Save to database
    const { error: deleteError } = await supabaseClient
      .from('internal_linking_opportunities')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) throw deleteError;

    if (opportunities.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('internal_linking_opportunities')
        .insert(
          opportunities.map(opp => ({
            project_id: projectId,
            source_page: opp.source_url,
            target_page: opp.target_url,
            anchor_text: opp.anchor_text,
            relevance_score: opp.relevance_score,
            semantic_score: opp.semantic_score,
            confidence_level: opp.confidence_level,
            context_snippet: opp.context_snippet,
            opportunity_type: 'semantic_match'
          }))
        );

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ 
      opportunities: opportunities.length,
      results: opportunities.slice(0, 20).map(opp => ({
        from: opp.source_url,
        to: opp.target_url,
        anchor: opp.anchor_text,
        score: opp.relevance_score.toFixed(2),
        confidence: opp.confidence_level
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in semantic-linking:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
