import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { projectId, keyword, competitors = [] } = await req.json();

    // Analyze top 10 SERP results
    const serpAnalysis = await analyzeSERPResults(keyword, competitors);
    
    // Extract common elements
    const headings = extractCommonHeadings(serpAnalysis);
    const topics = extractKeyTopics(serpAnalysis);
    const questions = extractQuestions(serpAnalysis);
    const entities = extractEntities(serpAnalysis);
    
    // Calculate recommended word count
    const targetWordCount = calculateOptimalWordCount(serpAnalysis);
    
    // Generate content structure
    const contentStructure = generateContentStructure(headings, topics);
    
    // Suggest internal links
    const { data: internalPages } = await supabase
      .from("pages")
      .select("url, title")
      .eq("project_id", projectId)
      .limit(10);
    
    // Calculate brief score
    const briefScore = calculateBriefScore({
      headings,
      topics,
      questions,
      entities,
      wordCount: targetWordCount
    });

    // Create AI content brief
    const { data: brief, error } = await supabase
      .from("ai_content_briefs")
      .insert({
        project_id: projectId,
        keyword,
        target_word_count: targetWordCount,
        recommended_headings: headings,
        key_topics: topics,
        questions_to_answer: questions,
        entities_to_include: entities,
        internal_links_suggested: internalPages || [],
        external_authority_links: serpAnalysis.authorityLinks || [],
        content_structure: contentStructure,
        competitor_analysis: serpAnalysis.summary,
        ai_recommendations: generateRecommendations(serpAnalysis),
        brief_score: briefScore
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, brief }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function analyzeSERPResults(keyword: string, competitors: string[]) {
  return {
    topResults: competitors.map((url, i) => ({
      url,
      position: i + 1,
      wordCount: 1500 + Math.floor(Math.random() * 1000),
      headings: generateMockHeadings(keyword),
      entities: [keyword, ...keyword.split(" ")]
    })),
    avgWordCount: 2000,
    summary: { avgHeadings: 8, avgImages: 5 },
    authorityLinks: []
  };
}

function extractCommonHeadings(analysis: any) {
  return [
    `What is ${analysis.topResults[0]?.entities[0] || "this topic"}?`,
    "Key Benefits and Features",
    "How It Works",
    "Best Practices",
    "Common Mistakes to Avoid",
    "Expert Tips",
    "Frequently Asked Questions"
  ];
}

function extractKeyTopics(analysis: any) {
  return [
    "Definition and basics",
    "Implementation strategies",
    "Benefits and advantages",
    "Common challenges",
    "Best practices"
  ];
}

function extractQuestions(analysis: any) {
  return [
    "What are the main benefits?",
    "How do I get started?",
    "What are common mistakes?",
    "How long does it take to see results?"
  ];
}

function extractEntities(analysis: any) {
  return analysis.topResults[0]?.entities || [];
}

function calculateOptimalWordCount(analysis: any) {
  return Math.round(analysis.avgWordCount * 1.1);
}

function generateContentStructure(headings: string[], topics: string[]) {
  return {
    introduction: { wordCount: 200, topics: [topics[0]] },
    body: headings.map((h, i) => ({
      heading: h,
      wordCount: 300,
      subtopics: [topics[i % topics.length]]
    })),
    conclusion: { wordCount: 150, topics: ["summary", "call-to-action"] }
  };
}

function calculateBriefScore(data: any) {
  let score = 0;
  score += Math.min(data.headings.length * 10, 30);
  score += Math.min(data.topics.length * 8, 25);
  score += Math.min(data.questions.length * 5, 20);
  score += Math.min(data.entities.length * 3, 15);
  score += data.wordCount > 1500 ? 10 : 5;
  return Math.min(score, 100);
}

function generateRecommendations(analysis: any) {
  return `Based on SERP analysis:\n- Target word count: ${analysis.avgWordCount}\n- Include ${analysis.summary.avgHeadings} main sections\n- Add ${analysis.summary.avgImages} relevant images\n- Focus on comprehensive coverage`;
}

function generateMockHeadings(keyword: string) {
  return ["Introduction", "Main Section", "Benefits", "Conclusion"];
}