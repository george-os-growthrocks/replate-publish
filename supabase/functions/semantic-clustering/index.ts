import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KeywordWithEmbedding {
  id: string;
  keyword: string;
  embedding: number[];
  search_volume: number;
  difficulty: number;
  search_intent: string;
}

interface Cluster {
  parent: string;
  members: string[];
  cohesion_score: number;
  avg_embedding: number[];
  topic_strength: number;
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

// Cluster keywords by semantic similarity
function clusterKeywords(
  keywords: KeywordWithEmbedding[],
  threshold = 0.78
): Cluster[] {
  const clusters: Cluster[] = [];
  const used = new Set<string>();

  for (let i = 0; i < keywords.length; i++) {
    if (used.has(keywords[i].id)) continue;

    const members: KeywordWithEmbedding[] = [keywords[i]];
    used.add(keywords[i].id);

    // Find similar keywords
    for (let j = i + 1; j < keywords.length; j++) {
      if (used.has(keywords[j].id)) continue;

      const similarity = cosineSimilarity(
        keywords[i].embedding,
        keywords[j].embedding
      );

      if (similarity >= threshold) {
        members.push(keywords[j]);
        used.add(keywords[j].id);
      }
    }

    // Calculate cluster metrics
    const memberKeywords = members.map(m => m.keyword);
    
    // Calculate average embedding
    const avgEmbedding = new Array(keywords[i].embedding.length).fill(0);
    for (const member of members) {
      for (let k = 0; k < member.embedding.length; k++) {
        avgEmbedding[k] += member.embedding[k] / members.length;
      }
    }

    // Calculate cohesion score (avg pairwise similarity)
    let cohesionScore = 0;
    let pairCount = 0;
    for (let m = 0; m < members.length; m++) {
      for (let n = m + 1; n < members.length; n++) {
        cohesionScore += cosineSimilarity(
          members[m].embedding,
          members[n].embedding
        );
        pairCount++;
      }
    }
    cohesionScore = pairCount > 0 ? cohesionScore / pairCount : 0;

    // Topic strength based on volume and cohesion
    const avgVolume = members.reduce((sum, m) => sum + m.search_volume, 0) / members.length;
    const topicStrength = Math.min(1, (cohesionScore * 0.6) + (Math.log(avgVolume + 1) / Math.log(10001) * 0.4));

    // Select parent keyword (highest volume in cluster)
    const parent = members.reduce((prev, curr) => 
      curr.search_volume > prev.search_volume ? curr : prev
    );

    clusters.push({
      parent: parent.keyword,
      members: memberKeywords,
      cohesion_score: cohesionScore,
      avg_embedding: avgEmbedding,
      topic_strength: topicStrength
    });
  }

  return clusters.sort((a, b) => b.topic_strength - a.topic_strength);
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

    const { projectId, threshold = 0.78 } = await req.json();

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log('Clustering keywords for project:', projectId);

    // Fetch keywords with embeddings
    const { data: keywords, error: fetchError } = await supabaseClient
      .from('keyword_tracking')
      .select('id, keyword, embedding, search_volume, difficulty, search_intent')
      .eq('project_id', projectId)
      .not('embedding', 'is', null);

    if (fetchError) throw fetchError;

    if (!keywords || keywords.length === 0) {
      return new Response(JSON.stringify({ 
        clusters: [],
        message: 'No keywords with embeddings found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${keywords.length} keywords with embeddings`);

    // Perform clustering
    const clusters = clusterKeywords(keywords as KeywordWithEmbedding[], threshold);

    console.log(`Created ${clusters.length} clusters`);

    // Save clusters to database
    const { error: deleteError } = await supabaseClient
      .from('keyword_clusters')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) throw deleteError;

    const clusterInserts = clusters.map(cluster => ({
      project_id: projectId,
      cluster_name: cluster.parent,
      center_keyword: cluster.parent,
      keywords: cluster.members,
      avg_search_volume: Math.floor(
        cluster.members.reduce((sum, kw) => {
          const k = keywords.find(k => k.keyword === kw);
          return sum + (k?.search_volume || 0);
        }, 0) / cluster.members.length
      ),
      cohesion_score: cluster.cohesion_score,
      avg_embedding: `[${cluster.avg_embedding.join(',')}]`,
      topic_strength: cluster.topic_strength
    }));

    if (clusterInserts.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('keyword_clusters')
        .insert(clusterInserts);

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ 
      clusters: clusters.length,
      results: clusters.map(c => ({
        parent: c.parent,
        size: c.members.length,
        cohesion: c.cohesion_score.toFixed(2),
        strength: c.topic_strength.toFixed(2)
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in semantic-clustering:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
