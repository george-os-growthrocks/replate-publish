import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type PageDoc = {
  url: string;
  title?: string;
  content: string;
  incoming: string[];
  outgoing: string[];
};

type Token = {
  text: string;
  freq: number;
  tfidf: number;
  pos?: 'NOUN' | 'PROPN' | 'ADJ' | 'PHRASE';
};

type GscRow = {
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  position: number;
  ctr?: number;
};

type GscPageAgg = {
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
};

type DfsKeyword = {
  keyword: string;
  volume: number;
  kd: number;
  cpc?: number;
  serpFeatures?: string[];
};

type KeywordJoin = {
  keyword: string;
  volume: number;
  kd: number;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
  topUrl?: string;
  trendIndex?: number;
};

type KeywordScore = {
  keyword: string;
  score: number;
  details: {
    volume: number;
    kd: number;
    impressions: number;
    relevance: number;
  };
};

type PageScore = {
  url: string;
  score: number;
  details: {
    impressions: number;
    ctrPotential: number;
    incoming: number;
    position: number;
  };
};

type LinkOpportunity = {
  sourceUrl: string;
  keyword: string;
  kwScore: number;
  target: PageScore & { anchor: string };
  priority: number;
  action: 'BUILD' | 'OPTIMIZE' | 'MAINTAIN' | 'DEPRIORITIZE';
};

type CsvRow = {
  source_url: string;
  anchor: string;
  target_url: string;
  keyword: string;
  kw_score: number;
  page_score: number;
  priority: number;
  action: string;
  volume: number;
  kd: number;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
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

    const { site, country = 'us', language = 'en', windowDays = 90, projectId } = await req.json();

    if (!site || !projectId) {
      return new Response(
        JSON.stringify({ error: "site and projectId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Internal Linking Analyze] Starting for ${site}`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);

    // 1. Fetch pages from database
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, url, title, content, traffic')
      .eq('project_id', projectId)
      .limit(200);

    if (pagesError || !pages || pages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No pages found for project" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Pages] Found ${pages.length} pages`);

    // 2. Fetch GSC data
    const { data: gscData, error: gscError } = await supabase
      .from('gsc_query')
      .select('query, page, impressions, clicks, position')
      .eq('project_id', projectId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('impressions', { ascending: false })
      .limit(1000);

    console.log(`[GSC] Found ${gscData?.length || 0} GSC records`);

    // 3. Fetch DataForSEO keyword data
    const { data: dfsData, error: dfsError } = await supabase
      .from('serp_keywords')
      .select('keyword, search_volume, keyword_difficulty, cpc')
      .eq('project_id', projectId)
      .order('search_volume', { ascending: false })
      .limit(500);

    console.log(`[DataForSEO] Found ${dfsData?.length || 0} keyword records`);

    // 4. Build page documents with link structure
    const { data: linksData } = await supabase
      .from('links')
      .select('source_url, target_url')
      .eq('project_id', projectId);

    const pageDocMap = new Map<string, PageDoc>();
    const incomingMap = new Map<string, string[]>();
    const outgoingMap = new Map<string, string[]>();

    // Build link structure
    if (linksData) {
      for (const link of linksData) {
        if (!incomingMap.has(link.target_url)) incomingMap.set(link.target_url, []);
        if (!outgoingMap.has(link.source_url)) outgoingMap.set(link.source_url, []);
        incomingMap.get(link.target_url)!.push(link.source_url);
        outgoingMap.get(link.source_url)!.push(link.target_url);
      }
    }

    // Build page documents
    for (const page of pages) {
      pageDocMap.set(page.url, {
        url: page.url,
        title: page.title || '',
        content: page.content || '',
        incoming: incomingMap.get(page.url) || [],
        outgoing: outgoingMap.get(page.url) || []
      });
    }

    console.log(`[Page Docs] Built ${pageDocMap.size} page documents`);

    // 5. Tokenization (TF-IDF)
    const tokensByPage = await calculateTokenization(pageDocMap, supabase, projectId);

    console.log(`[Tokenization] Processed ${Object.keys(tokensByPage).length} pages`);

    // 6. Join GSC + DataForSEO data
    const keywordJoins = joinKeywordData(gscData || [], dfsData || []);

    console.log(`[Join] Created ${keywordJoins.length} keyword joins`);

    // 7. Calculate keyword scores
    const keywordScores = calculateKeywordScores(keywordJoins, tokensByPage);

    console.log(`[Scoring] Calculated ${keywordScores.length} keyword scores`);

    // 8. Calculate page scores
    const pageScores = calculatePageScores(pages, gscData || [], pageDocMap);

    console.log(`[Scoring] Calculated ${pageScores.length} page scores`);

    // 9. Generate link opportunities
    const opportunities = generateOpportunities(
      keywordScores,
      pageScores,
      tokensByPage,
      keywordJoins
    );

    console.log(`[Opportunities] Generated ${opportunities.length} opportunities`);

    // 10. Store opportunities in database
    await storeOpportunities(supabase, projectId, opportunities);

    // 11. Generate CSV export rows
    const exportRows = generateCsvExport(opportunities, keywordJoins);

    console.log(`[Export] Generated ${exportRows.length} CSV rows`);

    return new Response(
      JSON.stringify({
        tokensByPage,
        opportunities: opportunities.slice(0, 100),
        exportRows,
        meta: {
          generatedAt: new Date().toISOString(),
          site,
          windowDays,
          totalPages: pages.length,
          totalOpportunities: opportunities.length,
          totalKeywords: keywordJoins.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function calculateTokenization(
  pageDocMap: Map<string, PageDoc>,
  supabase: any,
  projectId: string
): Promise<Record<string, Token[]>> {
  const result: Record<string, Token[]> = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);

  const allDocs = Array.from(pageDocMap.values());
  const docCount = allDocs.length;

  for (const [url, doc] of pageDocMap) {
    const text = `${doc.title} ${doc.content}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const wordFreq = new Map<string, number>();

    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    const tokens: Token[] = [];
    const uniqueWords = Array.from(wordFreq.keys());

    for (const word of uniqueWords) {
      const tf = wordFreq.get(word)! / words.length;
      const docsWithWord = allDocs.filter(d =>
        `${d.title} ${d.content}`.toLowerCase().includes(word)
      ).length;
      const idf = Math.log(docCount / (docsWithWord + 1));
      const tfidf = tf * idf;

      if (tfidf > 0.01) {
        tokens.push({
          text: word,
          freq: wordFreq.get(word)!,
          tfidf,
          pos: word.length > 8 ? 'NOUN' : 'ADJ'
        });
      }
    }

    tokens.sort((a, b) => b.tfidf - a.tfidf);
    result[url] = tokens.slice(0, 50);
  }

  return result;
}

function joinKeywordData(gscRows: GscRow[], dfsKeywords: any[]): KeywordJoin[] {
  const dfsMap = new Map<string, DfsKeyword>();
  for (const kw of dfsKeywords) {
    dfsMap.set(kw.keyword.toLowerCase(), {
      keyword: kw.keyword,
      volume: kw.search_volume || 0,
      kd: kw.keyword_difficulty || 0,
      cpc: kw.cpc || 0
    });
  }

  const gscAgg = new Map<string, GscRow[]>();
  for (const row of gscRows) {
    const key = row.query.toLowerCase();
    if (!gscAgg.has(key)) gscAgg.set(key, []);
    gscAgg.get(key)!.push(row);
  }

  const joined: KeywordJoin[] = [];
  for (const [keyword, rows] of gscAgg) {
    const dfs = dfsMap.get(keyword);
    if (!dfs || dfs.volume < 10) continue;

    const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
    const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);
    const avgPosition = rows.reduce((sum, r) => sum + r.position, 0) / rows.length;
    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    joined.push({
      keyword: dfs.keyword,
      volume: dfs.volume,
      kd: dfs.kd,
      impressions: totalImpressions,
      clicks: totalClicks,
      position: avgPosition,
      ctr,
      topUrl: rows[0]?.page,
      trendIndex: 1.0
    });
  }

  return joined.sort((a, b) => b.volume - a.volume);
}

function calculateKeywordScores(
  keywordJoins: KeywordJoin[],
  tokensByPage: Record<string, Token[]>
): KeywordScore[] {
  const scores: KeywordScore[] = [];

  for (const kw of keywordJoins) {
    let relevance = 0;
    for (const tokens of Object.values(tokensByPage)) {
      const match = tokens.find(t => t.text.includes(kw.keyword.toLowerCase()) || kw.keyword.toLowerCase().includes(t.text));
      if (match) relevance = Math.max(relevance, match.tfidf);
    }

    const marketPotential = kw.volume * (1 - kw.kd / 100) * 0.01;
    const gscSignal = kw.impressions > 0 ? Math.log10(kw.impressions + 1) : 0;
    const score = marketPotential * (1 + gscSignal) * (1 + relevance * 10);

    scores.push({
      keyword: kw.keyword,
      score,
      details: {
        volume: kw.volume,
        kd: kw.kd,
        impressions: kw.impressions,
        relevance
      }
    });
  }

  return scores.sort((a, b) => b.score - a.score);
}

function calculatePageScores(
  pages: any[],
  gscData: GscRow[],
  pageDocMap: Map<string, PageDoc>
): PageScore[] {
  const scores: PageScore[] = [];

  for (const page of pages) {
    const pageGsc = gscData.filter(g => g.page === page.url);
    const impressions = pageGsc.reduce((sum, g) => sum + g.impressions, 0);
    const avgPosition = pageGsc.length > 0
      ? pageGsc.reduce((sum, g) => sum + g.position, 0) / pageGsc.length
      : 100;

    const doc = pageDocMap.get(page.url);
    const incomingCount = doc?.incoming.length || 0;

    const ctrPotential = avgPosition <= 10
      ? Math.max(0.3 - avgPosition * 0.03, 0.01)
      : 0.01;

    const score = impressions * ctrPotential * (1 + incomingCount * 0.1);

    scores.push({
      url: page.url,
      score,
      details: {
        impressions,
        ctrPotential,
        incoming: incomingCount,
        position: avgPosition
      }
    });
  }

  return scores.sort((a, b) => b.score - a.score);
}

function generateOpportunities(
  keywordScores: KeywordScore[],
  pageScores: PageScore[],
  tokensByPage: Record<string, Token[]>,
  keywordJoins: KeywordJoin[]
): LinkOpportunity[] {
  const opportunities: LinkOpportunity[] = [];
  const kwMap = new Map(keywordJoins.map(k => [k.keyword, k]));

  for (const kwScore of keywordScores.slice(0, 50)) {
    const kwData = kwMap.get(kwScore.keyword);
    if (!kwData) continue;

    for (const pageScore of pageScores.slice(0, 30)) {
      const tokens = tokensByPage[pageScore.url] || [];
      const hasKeyword = tokens.some(t =>
        t.text.includes(kwScore.keyword.toLowerCase()) ||
        kwScore.keyword.toLowerCase().includes(t.text)
      );

      if (!hasKeyword) continue;

      for (const sourcePageUrl of Object.keys(tokensByPage)) {
        if (sourcePageUrl === pageScore.url) continue;

        const priority = kwScore.score * pageScore.score;

        let action: 'BUILD' | 'OPTIMIZE' | 'MAINTAIN' | 'DEPRIORITIZE' = 'DEPRIORITIZE';
        if (priority > 1000 && kwData.position > 10) action = 'BUILD';
        else if (priority > 500 && kwData.position <= 10) action = 'OPTIMIZE';
        else if (priority > 200) action = 'MAINTAIN';

        opportunities.push({
          sourceUrl: sourcePageUrl,
          keyword: kwScore.keyword,
          kwScore: kwScore.score,
          target: {
            ...pageScore,
            anchor: generateAnchor(kwScore.keyword)
          },
          priority,
          action
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.priority - a.priority).slice(0, 200);
}

function generateAnchor(keyword: string): string {
  const templates = [
    `Learn more about ${keyword}`,
    `Complete guide to ${keyword}`,
    `${keyword} best practices`,
    `Understanding ${keyword}`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateCsvExport(
  opportunities: LinkOpportunity[],
  keywordJoins: KeywordJoin[]
): CsvRow[] {
  const kwMap = new Map(keywordJoins.map(k => [k.keyword, k]));
  const rows: CsvRow[] = [];

  for (const opp of opportunities) {
    const kw = kwMap.get(opp.keyword);
    if (!kw) continue;

    rows.push({
      source_url: opp.sourceUrl,
      anchor: opp.target.anchor,
      target_url: opp.target.url,
      keyword: opp.keyword,
      kw_score: Math.round(opp.kwScore * 100) / 100,
      page_score: Math.round(opp.target.score * 100) / 100,
      priority: Math.round(opp.priority),
      action: opp.action,
      volume: kw.volume,
      kd: kw.kd,
      impressions: kw.impressions,
      clicks: kw.clicks,
      position: Math.round(kw.position * 10) / 10,
      ctr: Math.round(kw.ctr * 10000) / 100
    });
  }

  return rows;
}

async function storeOpportunities(
  supabase: any,
  projectId: string,
  opportunities: LinkOpportunity[]
) {
  for (const opp of opportunities.slice(0, 50)) {
    await supabase.from('internal_link_opportunities').upsert({
      project_id: projectId,
      source_url: opp.sourceUrl,
      target_url: opp.target.url,
      keyword: opp.keyword,
      anchor_text: opp.target.anchor,
      keyword_score: opp.kwScore,
      page_score: opp.target.score,
      priority_score: opp.priority,
      action_type: opp.action.toLowerCase(),
      status: 'pending'
    });
  }
}