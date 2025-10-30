// SEO AI Tools - Function Definitions for Gemini
// These tools allow the AI to fetch real-time data and execute actions

// Deno global type (for edge functions)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

interface ToolContext {
  selected_property?: string;
  currentProperty?: string;
  properties?: string[];
  gsc_queries?: Array<{ query: string; clicks: number; impressions: number; ctr?: number; position?: number }>;
  tracked_keywords?: Array<{ keyword: string; current_position: number; search_volume: number | null; previous_position?: number | null }>;
  [key: string]: unknown;
}

interface ToolArgs {
  keyword?: string;
  location?: string;
  dimension?: string;
  filter_query?: string;
  limit?: number;
  target?: string;
  url?: string;
  target_keyword?: string;
  [key: string]: unknown;
}

export const tools = [
  {
    function_declarations: [
      {
        name: "analyze_keyword",
        description: "Analyze a keyword using DataForSEO API. Gets search volume, difficulty, CPC, trends, related keywords, and SERP data. Use this when user asks about a specific keyword or wants keyword research.",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "The keyword to analyze (e.g., 'paros rent a car', 'seo tools')"
            },
            location: {
              type: "string",
              description: "Location code for search (default: '2840' for United States). Use '2300' for Greece, '2826' for UK, etc."
            }
          },
          required: ["keyword"]
        }
      },
      {
        name: "get_gsc_data",
        description: "Fetch Google Search Console data for the user's selected property. Gets queries, pages, clicks, impressions, CTR, and positions. Use this when user asks about their GSC performance, traffic, or specific queries.",
        parameters: {
          type: "object",
          properties: {
            dimension: {
              type: "string",
              description: "What to analyze: 'query' for keywords, 'page' for URLs, 'country' for locations, 'device' for devices",
              enum: ["query", "page", "country", "device"]
            },
            filter_query: {
              type: "string",
              description: "Optional: Filter by specific query or page"
            },
            limit: {
              type: "number",
              description: "Number of results (default: 20, max: 100)"
            }
          },
          required: ["dimension"]
        }
      },
      {
        name: "analyze_competitors",
        description: "Analyze SERP competitors for a keyword. Gets top ranking sites, their domain authority, backlinks, content length, SERP features, and ranking strategies. Use when user wants competitor analysis or asks 'who ranks for X'.",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "The keyword to analyze competition for"
            },
            location: {
              type: "string",
              description: "Location code (default: '2840' for US)"
            },
            limit: {
              type: "number",
              description: "Number of competitors to analyze (default: 10)"
            }
          },
          required: ["keyword"]
        }
      },
      {
        name: "check_backlinks",
        description: "Analyze backlink profile for a domain or URL. Gets total backlinks, referring domains, domain authority, top backlinks, anchor texts, and link quality. Use when user asks about backlinks or link building.",
        parameters: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "Domain or URL to analyze (e.g., 'example.com' or 'https://example.com/page')"
            },
            limit: {
              type: "number",
              description: "Number of backlinks to return (default: 50)"
            }
          },
          required: ["target"]
        }
      },
      {
        name: "run_site_audit",
        description: "Run a technical SEO audit on a URL. Checks on-page factors, meta tags, headings, images, Core Web Vitals, mobile-friendliness, and technical issues. Use when user asks about technical SEO or page optimization.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full URL to audit (e.g., 'https://example.com/page')"
            }
          },
          required: ["url"]
        }
      },
      {
        name: "analyze_page",
        description: "Analyze content and on-page SEO for a specific URL. Gets content quality, keyword usage, readability, internal links, and optimization opportunities. Use for content analysis or on-page optimization questions.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full URL to analyze"
            },
            target_keyword: {
              type: "string",
              description: "Optional: Keyword to optimize for"
            }
          },
          required: ["url"]
        }
      }
    ]
  }
];

// Tool execution logic
export async function executeTool(toolName: string, args: ToolArgs, context: ToolContext): Promise<Record<string, unknown>> {
  console.log(`🔧 Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case "analyze_keyword":
      return await analyzeKeyword(args.keyword || "", args.location || "2840", context);
    
    case "get_gsc_data":
      return await getGscData(args.dimension || "query", args.filter_query, args.limit || 20, context);
    
    case "analyze_competitors":
      return await analyzeCompetitors(args.keyword || "", args.location || "2840", args.limit || 10, context);
    
    case "check_backlinks":
      return await checkBacklinks(args.target || "", args.limit || 50, context);
    
    case "run_site_audit":
      return await runSiteAudit(args.url || "", context);
    
    case "analyze_page":
      return await analyzePage(args.url || "", args.target_keyword, context);
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Helper function to call DataForSEO API
async function callDataForSEO(endpoint: string, body: Record<string, unknown>) {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');
  
  if (!login || !password) {
    console.warn('DataForSEO credentials not configured');
    return null;
  }
  
  try {
    const auth = btoa(`${login}:${password}`);
    const res = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify([body]),
    });
    
    if (!res.ok) {
      console.error(`DataForSEO API error: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    return data[0]?.tasks?.[0]?.result?.[0] || null;
  } catch (error) {
    console.error('DataForSEO API call failed:', error);
    return null;
  }
}

// Individual tool implementations
async function analyzeKeyword(keyword: string, location: string, context: ToolContext) {
  console.log(`Analyzing keyword: ${keyword} in location ${location}`);
  
  // Try to get real data from DataForSEO
  const data = await callDataForSEO('dataforseo_labs/google/keywords_for_keywords/live', {
    keyword,
    location_code: parseInt(location) || 2840,
    language_code: 'en',
    limit: 10,
  });
  
  if (data) {
    return {
      keyword,
      search_volume: data.keyword_info?.search_volume || 0,
      keyword_difficulty: data.keyword_info?.competition_level || 0,
      cpc: data.keyword_info?.cpc || 0,
      related_keywords: data.keywords_data?.slice(0, 10).map((k: { keyword: string; search_volume: number; competition_level: number }) => ({
        keyword: k.keyword,
        volume: k.search_volume,
        difficulty: k.competition_level,
      })) || [],
      data_source: 'DataForSEO',
    };
  }
  
  // Fallback to placeholder if API not available
  console.warn('Using placeholder data for keyword analysis');
  return {
    keyword,
    search_volume: 1400,
    keyword_difficulty: 32,
    cpc: 1.85,
    trend: "+15% vs last month",
    related_keywords: [
      { keyword: "related term 1", volume: 2900, difficulty: 28 },
      { keyword: "related term 2", volume: 720, difficulty: 25 }
    ],
    serp_features: ["local_pack", "people_also_ask"],
    data_source: 'placeholder',
    note: 'DataForSEO API not configured. Please add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to environment variables.'
  };
}

async function getGscData(dimension: string, filterQuery: string | undefined, limit: number, context: ToolContext) {
  if (!context.selected_property) {
    return { error: "No property selected. Please select a property first." };
  }

  // Use the GSC data from context if available
  if (dimension === "query" && context.gsc_queries) {
    const queries = filterQuery 
      ? context.gsc_queries.filter((q) => q.query.includes(filterQuery))
      : context.gsc_queries;
    
    return {
      property: context.selected_property,
      dimension,
      total_queries: queries.length,
      queries: queries.slice(0, limit)
    };
  }

  return {
    property: context.selected_property,
    dimension,
    message: "GSC data will be fetched in real implementation"
  };
}

async function analyzeCompetitors(keyword: string, location: string, limit: number, context: ToolContext) {
  console.log(`Analyzing competitors for: ${keyword}`);
  
  // Try to get real data from DataForSEO SERP API
  const data = await callDataForSEO('dataforseo_labs/google/serp_competitors/live', {
    keyword,
    location_code: parseInt(location) || 2840,
    language_code: 'en',
    limit: Math.min(limit, 10),
  });
  
  if (data && data.items) {
    return {
      keyword,
      location,
      total_results: data.total_count || 0,
      top_competitors: data.items.slice(0, limit).map((item: { domain?: string; url?: string; rank_absolute?: number; serp_item?: { serp_features?: string[] } }, idx: number) => ({
        position: idx + 1,
        domain: item.domain || new URL(item.url || 'https://example.com').hostname,
        url: item.url || '',
        domain_authority: item.rank_absolute || 0,
        serp_features: item.serp_item?.serp_features || [],
      })),
      user_position: context.tracked_keywords?.find((k) => k.keyword.toLowerCase() === keyword.toLowerCase())?.current_position || "Not ranking",
      data_source: 'DataForSEO',
    };
  }
  
  // Fallback to placeholder if API not available
  console.warn('Using placeholder data for competitor analysis');
  return {
    keyword,
    location,
    total_results: 89500000,
    top_competitors: [
      {
        position: 1,
        domain: "ahrefs.com",
        url: "https://ahrefs.com/seo-tools",
        domain_authority: 92,
        backlinks: 1200000,
        content_length: 4500,
        serp_features: ["sitelinks", "faq"]
      },
      {
        position: 2,
        domain: "semrush.com",
        url: "https://semrush.com/tools",
        domain_authority: 90,
        backlinks: 980000,
        content_length: 3800,
        serp_features: ["sitelinks", "reviews"]
      }
    ],
    user_position: context.tracked_keywords?.find((k) => k.keyword.toLowerCase() === keyword.toLowerCase())?.current_position || "Not ranking",
    data_source: 'placeholder',
    note: 'DataForSEO API not configured.'
  };
}

async function checkBacklinks(target: string, limit: number, context: ToolContext) {
  console.log(`Checking backlinks for: ${target}`);
  
  // Try to get real data from DataForSEO Backlinks API
  const data = await callDataForSEO('backlinks/summary/live', {
    target,
    limit: Math.min(limit, 50),
  });
  
  if (data) {
    return {
      target,
      total_backlinks: data.backlinks || 0,
      referring_domains: data.referring_domains || 0,
      domain_authority: data.rank || 0,
      follow_backlinks: data.backlinks_dofollow || 0,
      nofollow_backlinks: data.backlinks_nofollow || 0,
      top_backlinks: (data.items || []).slice(0, limit).map((item: { url_from?: string; anchor?: string; dofollow?: boolean }) => ({
        from_url: item.url_from || '',
        anchor: item.anchor || 'No anchor',
        type: item.dofollow ? 'dofollow' : 'nofollow',
      })),
      data_source: 'DataForSEO',
    };
  }
  
  // Fallback to placeholder if API not available
  console.warn('Using placeholder data for backlink analysis');
  return {
    target,
    total_backlinks: 2340,
    referring_domains: 456,
    domain_authority: 45,
    follow_backlinks: 1890,
    nofollow_backlinks: 450,
    top_backlinks: [
      { from_url: "https://example.com/blog", anchor: "seo tools", da: 67, type: "dofollow" },
      { from_url: "https://test.com/resources", anchor: "keyword research", da: 54, type: "dofollow" }
    ],
    anchor_text_distribution: {
      branded: 45,
      exact_match: 20,
      partial_match: 25,
      generic: 10
    },
    data_source: 'placeholder',
    note: 'DataForSEO API not configured.'
  };
}

async function runSiteAudit(url: string, context: ToolContext) {
  console.log(`Running site audit for: ${url}`);
  
  // Try to get real data from Firecrawl first
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (firecrawlKey) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'markdown'],
          onlyMainContent: false,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        const html = responseData.html || '';
        const metadata = responseData.metadata || {};
        
        // Parse HTML for SEO elements
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
        const imgMatches = html.match(/<img[^>]*>/gi);
        const imgsWithoutAlt = imgMatches ? imgMatches.filter((img: string) => !img.includes('alt=')).length : 0;
        
        return {
          url,
          overall_score: calculateSEOScore(titleMatch, metaDescMatch, h1Matches, imgsWithoutAlt),
          issues: {
            errors: !titleMatch || !metaDescMatch ? 2 : 0,
            warnings: (h1Matches?.length || 0) !== 1 ? 1 : 0 + (imgsWithoutAlt > 0 ? 1 : 0),
            notices: 0
          },
          on_page: {
            title: titleMatch ? `✅ Present: "${titleMatch[1]}"` : "❌ Missing",
            meta_description: metaDescMatch 
              ? `✅ Present (${metaDescMatch[1].length} characters)` 
              : "❌ Missing",
            h1: h1Matches ? `✅ Present (${h1Matches.length} found)` : "❌ Missing",
            images_without_alt: imgsWithoutAlt,
            total_images: imgMatches?.length || 0,
          },
          metadata: metadata,
          data_source: 'Firecrawl',
        };
      }
    } catch (error) {
      console.error('Firecrawl error:', error);
    }
  }
  
  // Fallback to placeholder if API not available
  console.warn('Using placeholder data for site audit');
  return {
    url,
    overall_score: 72,
    issues: {
      errors: 12,
      warnings: 45,
      notices: 128
    },
    core_web_vitals: {
      lcp: 2.1,
      fid: 95,
      cls: 0.08,
      status: "good"
    },
    on_page: {
      title: "✅ Present",
      meta_description: "⚠️ Too short (98 characters)",
      h1: "✅ Present (1 found)",
      images_without_alt: 5,
      broken_links: 3
    },
    mobile_friendly: true,
    page_speed_score: 78,
    data_source: 'placeholder',
    note: 'Firecrawl API not configured.'
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateSEOScore(title: any, desc: any, h1s: any, imgsWithoutAlt: number): number {
  let score = 50; // Base score
  
  if (title) score += 20;
  if (desc) {
    const descLength = desc[1]?.length || 0;
    if (descLength >= 120 && descLength <= 160) score += 20;
    else if (descLength > 0) score += 10;
  }
  if (h1s && h1s.length === 1) score += 15;
  else if (h1s && h1s.length > 0) score += 5;
  
  if (imgsWithoutAlt === 0) score += 10;
  else if (imgsWithoutAlt < 3) score += 5;
  
  return Math.min(score, 100);
}

async function analyzePage(url: string, targetKeyword: string | undefined, context: ToolContext) {
  console.log(`Analyzing page: ${url}`);
  
  // Try to get real data from Firecrawl
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (firecrawlKey) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'markdown', 'links'],
          onlyMainContent: true,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        const html = responseData.html || '';
        const markdown = responseData.markdown || '';
        const links = responseData.links || [];
        
        // Calculate metrics
        const wordCount = markdown.split(/\s+/).length;
        const imageCount = (html.match(/<img[^>]*>/gi) || []).length;
        const videoCount = (html.match(/<video[^>]*>/gi) || []).length;
        const internalLinks = links.filter((link: string) => link.includes(new URL(url).hostname)).length;
        const externalLinks = links.length - internalLinks;
        
        const keywordCount = targetKeyword 
          ? (markdown.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), 'g')) || []).length
          : 0;
        const keywordDensity = targetKeyword ? (keywordCount / wordCount) * 100 : null;
        
        const recommendations: string[] = [];
        if (wordCount < 1000) recommendations.push(`Increase content length to 1500+ words (current: ${wordCount} words)`);
        if (keywordDensity && keywordDensity < 0.5) recommendations.push(`Increase keyword density (current: ${keywordDensity.toFixed(2)}%, target: 1-2%)`);
        if (internalLinks < 5) recommendations.push(`Add more internal links (current: ${internalLinks})`);
        if (imageCount === 0) recommendations.push('Add relevant images to improve engagement');
        
        return {
          url,
          target_keyword: targetKeyword,
          content_length: wordCount,
          keyword_density: keywordDensity,
          keyword_count: keywordCount,
          internal_links: internalLinks,
          external_links: externalLinks,
          images: imageCount,
          videos: videoCount,
          optimization_score: calculateOptimizationScore(wordCount, keywordDensity, internalLinks, imageCount),
          recommendations,
          data_source: 'Firecrawl',
        };
      }
    } catch (error) {
      console.error('Firecrawl error:', error);
    }
  }
  
  // Fallback to placeholder if API not available
  console.warn('Using placeholder data for page analysis');
  return {
    url,
    target_keyword: targetKeyword,
    content_length: 1200,
    keyword_density: targetKeyword ? 2.3 : null,
    readability_score: 68,
    internal_links: 15,
    external_links: 8,
    images: 12,
    videos: 0,
    optimization_score: 65,
    recommendations: [
      "Increase content length to 2500+ words",
      "Add FAQ section for featured snippets",
      "Improve keyword density (target: 1-2%)",
      "Add more internal links to related content",
      "Optimize images (5 missing alt tags)"
    ],
    data_source: 'placeholder',
    note: 'Firecrawl API not configured.'
  };
}

function calculateOptimizationScore(wordCount: number, keywordDensity: number | null, internalLinks: number, imageCount: number): number {
  let score = 0;
  
  // Content length (max 40 points)
  if (wordCount >= 1500) score += 40;
  else if (wordCount >= 1000) score += 30;
  else if (wordCount >= 500) score += 20;
  else score += 10;
  
  // Keyword density (max 30 points)
  if (keywordDensity) {
    if (keywordDensity >= 1 && keywordDensity <= 2) score += 30;
    else if (keywordDensity >= 0.5 && keywordDensity < 3) score += 20;
    else score += 10;
  }
  
  // Internal links (max 20 points)
  if (internalLinks >= 10) score += 20;
  else if (internalLinks >= 5) score += 15;
  else if (internalLinks >= 3) score += 10;
  else score += 5;
  
  // Images (max 10 points)
  if (imageCount >= 5) score += 10;
  else if (imageCount >= 3) score += 7;
  else if (imageCount >= 1) score += 5;
  
  return Math.min(score, 100);
}

