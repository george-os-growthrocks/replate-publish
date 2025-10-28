import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Deno global type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { keyword } = await req.json();

    if (!keyword) {
      throw new Error('Keyword is required');
    }

    console.log('Answer The Public request for:', keyword);

    // Check cache first
    const { data: cached } = await supabaseClient
      .from('atp_queries_cache')
      .select('*')
      .eq('seed_keyword', keyword.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      console.log('Returning cached data for:', keyword);
      return new Response(
        JSON.stringify({
          keyword,
          questions: cached.questions,
          prepositions: cached.prepositions,
          comparisons: cached.comparisons,
          alphabetical: cached.alphabetical,
          total: cached.total_queries,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not cached, generate using Google Autocomplete
    console.log('Generating new data for:', keyword);

    const questions = {
      who: [] as string[],
      what: [] as string[],
      when: [] as string[],
      where: [] as string[],
      why: [] as string[],
      how: [] as string[],
      are: [] as string[],
      can: [] as string[],
      will: [] as string[],
    };

    const prepositions = {
      for: [] as string[],
      with: [] as string[],
      without: [] as string[],
      to: [] as string[],
      versus: [] as string[],
      vs: [] as string[],
      near: [] as string[],
      like: [] as string[],
    };

    const comparisons: string[] = [];
    const alphabetical: Record<string, string[]> = {};

    // Question prefixes
    const questionPrefixes = ['who', 'what', 'when', 'where', 'why', 'how', 'are', 'can', 'will'];
    
    for (const prefix of questionPrefixes) {
      try {
        const query = `${prefix} ${keyword}`;
        const suggestions = await fetchGoogleSuggestions(query);
        
        if (prefix in questions) {
          questions[prefix as keyof typeof questions] = suggestions.slice(0, 8);
        }
      } catch (error) {
        console.error(`Error fetching ${prefix} questions:`, error);
      }
    }

    // Preposition suffixes
    const prepositionSuffixes = ['for', 'with', 'without', 'to', 'versus', 'vs', 'near', 'like'];
    
    for (const suffix of prepositionSuffixes) {
      try {
        const query = `${keyword} ${suffix}`;
        const suggestions = await fetchGoogleSuggestions(query);
        
        if (suffix in prepositions) {
          prepositions[suffix as keyof typeof prepositions] = suggestions.slice(0, 8);
        }
      } catch (error) {
        console.error(`Error fetching ${suffix} prepositions:`, error);
      }
    }

    // Comparisons
    try {
      const vsQuery = `${keyword} vs`;
      const vsSuggestions = await fetchGoogleSuggestions(vsQuery);
      comparisons.push(...vsSuggestions.slice(0, 8));
    } catch (error) {
      console.error('Error fetching comparisons:', error);
    }

    // Alphabetical (A-Z)
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (const letter of alphabet) {
      try {
        const query = `${keyword} ${letter}`;
        const suggestions = await fetchGoogleSuggestions(query);
        
        if (suggestions.length > 0) {
          alphabetical[letter] = suggestions.slice(0, 5);
        }
      } catch (error) {
        console.error(`Error fetching ${letter} suggestions:`, error);
      }
    }

    // Calculate total
    const totalQuestions = Object.values(questions).reduce((sum, arr) => sum + arr.length, 0);
    const totalPrepositions = Object.values(prepositions).reduce((sum, arr) => sum + arr.length, 0);
    const totalAlphabetical = Object.values(alphabetical).reduce((sum, arr) => sum + arr.length, 0);
    const total = totalQuestions + totalPrepositions + comparisons.length + totalAlphabetical;

    // Cache the results (24 hours)
    await supabaseClient
      .from('atp_queries_cache')
      .upsert({
        seed_keyword: keyword.toLowerCase(),
        questions: questions as unknown as Record<string, unknown>,
        prepositions: prepositions as unknown as Record<string, unknown>,
        comparisons,
        alphabetical,
        total_queries: total,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    console.log('Generated and cached data for:', keyword, 'Total:', total);

    return new Response(
      JSON.stringify({
        keyword,
        questions,
        prepositions,
        comparisons,
        alphabetical,
        total,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Answer The Public Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchGoogleSuggestions(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Suggest API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Google returns [query, [suggestions]]
    if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
      return data[1];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Google suggestions:', error);
    return [];
  }
}

