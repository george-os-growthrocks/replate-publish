const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, model = "text-embedding-004" } = await req.json();
    
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('texts must be a non-empty array');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const results: number[][] = [];

    // Process texts in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      for (const text of batch) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: `models/${model}`,
              content: {
                parts: [{ text: text.substring(0, 10000) }] // Limit text length
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API error:', response.status, errorText);
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const embedding = data.embedding?.values || [];
        results.push(embedding);
      }

      // Rate limiting between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Generated ${results.length} embeddings`);

    return new Response(JSON.stringify({ 
      embeddings: results,
      model: model,
      dimensions: results[0]?.length || 768
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Error in generate-gemini-embeddings:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
