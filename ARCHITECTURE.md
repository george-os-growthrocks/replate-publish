# IconicStack Architecture Documentation

## System Overview

IconicStack is a modern, cloud-native SEO intelligence platform built on Supabase (PostgreSQL + Edge Functions) with a React/TypeScript frontend. The architecture follows microservices principles with serverless edge functions, real-time data synchronization, and advanced mathematical algorithms.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                               │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  React 18 SPA (Vite + TypeScript + TailwindCSS)               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │ Landing  │  │Dashboard │  │SEO Suite │  │Settings  │      │   │
│  │  │Pages     │  │& Reports │  │Components│  │& Profile │      │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │   │
│  └───────┼─────────────┼─────────────┼─────────────┼────────────┘   │
│          │             │             │             │                  │
│          └─────────────┴─────────────┴─────────────┘                  │
│                              │                                         │
│                   TanStack Query (State Management)                   │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────┼─────────────────────────────────────────┐
│                     SUPABASE API GATEWAY                               │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Authentication (JWT) + Row Level Security Enforcement       │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                               │                                        │
│       ┌───────────────────────┴───────────────────────┐              │
│       │                                                 │              │
│  ┌────┴────────┐                                 ┌─────┴──────┐      │
│  │   PostgREST │                                 │   Edge     │      │
│  │   Auto API  │                                 │  Functions │      │
│  └────┬────────┘                                 └─────┬──────┘      │
│       │                                                 │              │
└───────┼─────────────────────────────────────────────────┼──────────────┘
        │                                                 │
┌───────┼─────────────────────────────────────────────────┼──────────────┐
│       │                   DATA LAYER                    │              │
│  ┌────▼──────────────────────────────────────────────────▼──────┐    │
│  │           PostgreSQL 15+ with Extensions                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │    │
│  │  │   Core      │  │   SEO       │  │  Analytics  │         │    │
│  │  │   Tables    │  │   Tables    │  │   Tables    │         │    │
│  │  │             │  │             │  │             │         │    │
│  │  │ • profiles  │  │ • pages     │  │ • gsc_query │         │    │
│  │  │ • projects  │  │ • links     │  │ • ga4_sess. │         │    │
│  │  │ • settings  │  │ • ranks     │  │ • serp_vol. │         │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │    │
│  │                                                              │    │
│  │  ┌──────────────────────────────────────────────────┐     │    │
│  │  │         Advanced Extensions                       │     │    │
│  │  │  • pgvector (1536-dim embeddings)                │     │    │
│  │  │  • pg_trgm (fuzzy text search)                   │     │    │
│  │  │  • uuid-ossp (UUID generation)                   │     │    │
│  │  └──────────────────────────────────────────────────┘     │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────┘
        │
┌───────┴───────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTIONS (Deno Runtime)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐   │
│  │   Crawler   │  │   Content   │  │  Internal   │  │   SERP   │   │
│  │   Engine    │  │  Optimizer  │  │   Linking   │  │  Tracker │   │
│  │             │  │             │  │     AI      │  │          │   │
│  │ • Firecrawl │  │ • TF-IDF    │  │ • PageRank  │  │ • DataFS │   │
│  │ • HTML      │  │ • BM25      │  │ • Embeddings│  │ • Ranks  │   │
│  │ • JS Render │  │ • Analysis  │  │ • Similarity│  │ • Features│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘   │
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐   │
│  │     GSC     │  │     GA4     │  │   Testing   │  │ Forecast │   │
│  │    Sync     │  │    Sync     │  │  Framework  │  │  Engine  │   │
│  │             │  │             │  │             │  │          │   │
│  │ • OAuth     │  │ • OAuth     │  │ • Stats     │  │ • CTR    │   │
│  │ • API Fetch │  │ • Metrics   │  │ • Pre/Post  │  │ • Monte  │   │
│  │ • Storage   │  │ • Events    │  │ • P-values  │  │   Carlo  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘   │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
┌────────────────────────────────────┴──────────────────────────────────┐
│                         EXTERNAL SERVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  DataForSEO  │  │  Firecrawl   │  │ Google APIs  │               │
│  │              │  │              │  │              │               │
│  │ • SERP Data  │  │ • Crawling   │  │ • GSC        │               │
│  │ • Keywords   │  │ • Rendering  │  │ • GA4        │               │
│  │ • Competition│  │ • Extraction │  │ • OAuth      │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │   OpenAI     │  │  Anthropic   │                                 │
│  │              │  │              │                                 │
│  │ • Embeddings │  │ • Claude API │                                 │
│  │ • GPT-4      │  │ • Analysis   │                                 │
│  └──────────────┘  └──────────────┘                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture

### Entity Relationship Model

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   profiles  │────────>│seo_projects │<───────>│   pages     │
│             │ 1     * │             │ 1     * │             │
│ • id (PK)   │         │ • id (PK)   │         │ • id (PK)   │
│ • email     │         │ • user_id   │         │ • project_id│
│ • plan_type │         │ • domain    │         │ • url       │
└─────────────┘         │ • gsc_prop  │         │ • title     │
                        │ • ga4_prop  │         │ • status    │
                        └──────┬──────┘         └──────┬──────┘
                               │                       │
                               │ 1                   * │
                        ┌──────▼──────┐         ┌──────▼──────┐
                        │ crawl_runs  │         │    links    │
                        │             │         │             │
                        │ • id (PK)   │         │ • src_page  │
                        │ • project_id│         │ • dst_url   │
                        │ • status    │         │ • anchor    │
                        │ • pages_done│         │ • first_seen│
                        └─────────────┘         │ • last_seen │
                                                └─────────────┘
                               │ 1
                        ┌──────▼──────┐
                        │serp_keywords│
                        │             │
                        │ • id (PK)   │
                        │ • keyword   │
                        │ • volume    │
                        │ • difficulty│
                        └──────┬──────┘
                               │ *
                        ┌──────▼──────┐
                        │    ranks    │
                        │             │
                        │ • project_id│
                        │ • keyword_id│
                        │ • position  │
                        │ • date      │
                        └─────────────┘
```

### Content Optimizer Schema

```
┌──────────────────┐
│content_analyses  │
│                  │
│ • id (PK)        │
│ • project_id     │
│ • target_keyword │
│ • status         │
│ • opt_score      │
└────────┬─────────┘
         │ 1
         │
    ┌────┴────┬────────────┬──────────────┐
    │ *       │ *          │ *            │
┌───▼────┐┌──▼───────┐┌───▼──────────┐┌──▼──────────┐
│term_   ││content_  ││content_      ││serp_content_│
│freq.   ││scores    ││recommend.    ││analysis     │
│        ││          ││              ││             │
│• term  ││• url     ││• category    ││• position   │
│• tf    ││• score   ││• priority    ││• url        │
│• tf_idf││• word_ct ││• title       ││• word_count │
│• bm25  ││• read.   ││• impact      ││• structure  │
└────────┘└──────────┘└──────────────┘└─────────────┘
```

### Internal Linking Schema

```
┌────────────────┐
│     pages      │
│                │
│ • id (PK)      │
│ • project_id   │
│ • url          │
└────────┬───────┘
         │
    ┌────┴──────┬─────────────┐
    │ 1         │ 1           │
┌───▼────────┐┌─▼──────────┐┌▼────────────────┐
│page_       ││page_       ││internal_link_   │
│embeddings  ││authority   ││opportunities    │
│            ││            ││                 │
│• vector    ││• authority ││• source_page    │
│  (1536-d)  ││  _score    ││• target_page    │
│• model     ││• composite ││• similarity     │
│            ││  _score    ││• opp_score      │
│            ││• gsc_impr  ││• reasoning      │
└────────────┘└────────────┘└─────────┬───────┘
                                      │ 1
                            ┌─────────▼────────┐
                            │anchor_suggestions│
                            │                  │
                            │• anchor_text     │
                            │• context         │
                            │• relevance       │
                            └──────────────────┘
```

---

## Data Flow Diagrams

### Content Optimization Flow

```
┌─────────┐
│  User   │ Creates analysis request
└────┬────┘ (keyword + project)
     │
     ▼
┌────────────────────┐
│ content-optimizer  │
│   Edge Function    │
└────┬───────────────┘
     │
     ├─────────────> Create analysis record (status: analyzing)
     │
     ├─────────────> Fetch SERP data (DataForSEO)
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Top 10 Results   │
     │           │ • URL            │
     │           │ • Position       │
     │           │ • Snippet        │
     │           └────────┬─────────┘
     │                    │
     │                    ▼
     ├─────────────> Crawl each URL (Firecrawl)
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Extract Content  │
     │           │ • Title          │
     │           │ • Body text      │
     │           │ • Headings       │
     │           │ • Word count     │
     │           └────────┬─────────┘
     │                    │
     │                    ▼
     ├─────────────> Term Extraction
     │               │ (Remove stop words, min length 4)
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Term Frequency   │
     │           │ per document     │
     │           └────────┬─────────┘
     │                    │
     │                    ▼
     ├─────────────> Calculate TF-IDF & BM25
     │               │
     │               │ For each term:
     │               │ • TF = count / total_terms
     │               │ • IDF = log(N / df)
     │               │ • TF-IDF = TF * IDF
     │               │ • BM25 = IDF * normalized_TF
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Rank Terms       │
     │           │ by BM25 score    │
     │           └────────┬─────────┘
     │                    │
     │                    ▼
     ├─────────────> Store term_frequency records
     │
     ├─────────────> Generate recommendations
     │               │ • Missing high-value terms
     │               │ • Content length gaps
     │               │ • Heading structure
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Store content_   │
     │           │ recommendations  │
     │           └────────┬─────────┘
     │                    │
     ├─────────────> Update analysis (status: completed)
     │
     ▼
┌────────────────────┐
│  User views        │
│  recommendations   │
│  + top terms       │
└────────────────────┘
```

### Internal Linking Flow

```
┌─────────┐
│  User   │ Triggers link opportunity generation
└────┬────┘
     │
     ▼
┌────────────────────┐
│ generate_link_     │
│ opportunities()    │
│ SQL Function       │
└────┬───────────────┘
     │
     ├─────────────> Delete old pending opportunities
     │
     ├─────────────> Cross join page_embeddings
     │               │ (all source × all target)
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Calculate cosine │
     │           │ similarity       │
     │           │                  │
     │           │ similarity =     │
     │           │ 1 - (v1 <=> v2)  │
     │           └────────┬─────────┘
     │                    │
     ├─────────────> Filter: similarity > 0.5
     │               Exclude: existing links
     │
     ├─────────────> Join page_authority
     │               │ Get source authority
     │               │ Get target GSC data
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Calculate        │
     │           │ Opportunity Score│
     │           │                  │
     │           │ score =          │
     │           │   similarity*0.3 │
     │           │   + auth*0.25    │
     │           │   + impr*0.25    │
     │           │   + pos*0.2      │
     │           └────────┬─────────┘
     │                    │
     ├─────────────> Filter: score >= min_score (50.0)
     │
     ├─────────────> Order by score DESC
     │
     ├─────────────> Limit 1000
     │
     ├─────────────> Insert opportunities
     │               │ with reasoning
     │               │
     │               ▼
     │           ┌──────────────────┐
     │           │ Reasoning:       │
     │           │ • Quick win      │
     │           │ • High impr.     │
     │           │ • Topically rel. │
     │           └──────────────────┘
     │
     ▼
┌────────────────────┐
│  User views top    │
│  opportunities     │
│  ranked by score   │
└────────────────────┘
```

### Crawling & Analysis Flow

```
┌─────────┐
│  User   │ Starts crawl
└────┬────┘
     │
     ▼
┌────────────────────┐
│ website-crawler    │
│ Edge Function      │
└────┬───────────────┘
     │
     ├─────────────> Create crawl_run record
     │               Status: crawling
     │
     ├─────────────> Initialize queue with seed URL
     │
     │               ┌──────────────────────────┐
     │               │ While queue not empty    │
     │               │ AND pages < maxPages     │
     │               └──────────┬───────────────┘
     │                          │
     ├─────────────> Pop URL from queue
     │               │
     │               ├─> Check if crawled (skip if yes)
     │               │
     │               ├─> Fetch HTML (Firecrawl)
     │               │   │
     │               │   ▼
     │               │   ┌──────────────────┐
     │               │   │ Extract:         │
     │               │   │ • Status code    │
     │               │   │ • Title, meta    │
     │               │   │ • Headings       │
     │               │   │ • Links          │
     │               │   │ • Images         │
     │               │   │ • Schema markup  │
     │               │   └────────┬─────────┘
     │               │            │
     │               ├─> Insert crawled_pages record
     │               │
     │               ├─> Extract internal links
     │               │   ├─> Add to queue (if not crawled)
     │               │   └─> Insert internal_links records
     │               │
     │               ├─> Extract external links
     │               │   └─> Insert external_links records
     │               │
     │               ├─> Update progress
     │               │   (pages_crawled++, progress%)
     │               │
     │               └─> Delay 500ms (rate limiting)
     │
     │               Loop back to queue
     │
     ├─────────────> Update status: analyzing
     │
     ├─────────────> Call analyze-seo function
     │               │ Calculates:
     │               │ • Page scores
     │               │ • SEO issues
     │               │ • Recommendations
     │               │
     │               ▼
     ├─────────────> Update status: completed
     │
     ▼
┌────────────────────┐
│  User views        │
│  crawl results     │
│  + SEO issues      │
└────────────────────┘
```

---

## Function Call Patterns

### Content Analysis

```typescript
// 1. User initiates analysis
const { data: analysis } = await supabase.functions.invoke(
  'content-optimizer-advanced',
  {
    body: {
      projectId: 'uuid',
      targetKeyword: 'best seo tools',
      analyzeCompetitors: true
    }
  }
);

// Returns immediately: { analysisId, message }

// 2. Backend processes async (30-90 sec)
// - Fetches SERP data
// - Crawls top 10 URLs
// - Calculates TF-IDF/BM25
// - Generates recommendations

// 3. User polls or subscribes for completion
const { data: results } = await supabase
  .from('content_analyses')
  .select(`
    *,
    term_frequency(*),
    content_recommendations(*)
  `)
  .eq('id', analysis.analysisId)
  .single();

// 4. Display top terms and recommendations
```

### Link Opportunity Generation

```typescript
// 1. Ensure embeddings exist
const { data: embeddings } = await supabase
  .from('page_embeddings')
  .select('count')
  .eq('project_id', projectId);

if (embeddings.count === 0) {
  // Generate embeddings first
  await generatePageEmbeddings(projectId);
}

// 2. Calculate page authority
const { data } = await supabase.rpc('calculate_page_authority', {
  p_project_id: projectId,
  p_damping_factor: 0.85,
  p_iterations: 20
});

// 3. Generate opportunities
const { data: count } = await supabase.rpc('generate_link_opportunities', {
  p_project_id: projectId,
  p_min_score: 50.0
});

// Returns: number of opportunities created

// 4. Fetch top opportunities
const { data: opportunities } = await supabase
  .from('internal_link_opportunities')
  .select(`
    *,
    source_page:pages!source_page_id(url, title),
    target_page:pages!target_page_id(url, title),
    anchor_suggestions(*)
  `)
  .eq('project_id', projectId)
  .eq('status', 'pending')
  .order('opportunity_score', { ascending: false })
  .limit(100);
```

### SERP Tracking

```typescript
// 1. Create keyword records
const keywords = ['seo tools', 'best seo software', 'seo platform'];

for (const keyword of keywords) {
  await supabase
    .from('serp_keywords')
    .upsert({
      keyword,
      locale: 'en-US',
      device: 'desktop'
    });
}

// 2. Run daily rank check (scheduled job)
const { data } = await supabase.functions.invoke('serp-tracker', {
  body: {
    projectId,
    keywords,
    location: 'United States',
    device: 'desktop'
  }
});

// 3. Calculate volatility
const { data: volatility } = await supabase.rpc(
  'calculate_serp_volatility',
  {
    p_project_id: projectId,
    p_date: new Date().toISOString().split('T')[0]
  }
);

// 4. Query historical ranks
const { data: ranks } = await supabase
  .from('ranks')
  .select(`
    *,
    keyword:serp_keywords(keyword, volume)
  `)
  .eq('project_id', projectId)
  .gte('date', thirtyDaysAgo)
  .order('date', { ascending: true });
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐
│ User    │ Login with email/password
└────┬────┘
     │
     ▼
┌────────────────────┐
│ Supabase Auth      │ Validates credentials
└────┬───────────────┘
     │
     ├─────> Generate JWT token
     │       │ Payload: user_id, role, exp
     │       │ Signed with secret key
     │       │
     │       ▼
     ├─────> Return JWT to client
     │
     ▼
┌────────────────────┐
│ Client stores JWT  │ In memory + local storage
└────┬───────────────┘
     │
     │ All subsequent requests
     ▼
┌────────────────────┐
│ Authorization:     │
│ Bearer <JWT>       │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Supabase verifies  │ JWT signature + expiration
└────┬───────────────┘
     │
     ├─────> Extract user_id from JWT
     │
     ├─────> Apply RLS policies
     │       │ USING (auth.uid() = user_id)
     │       │
     │       ▼
     ├─────> Query authorized data only
     │
     ▼
┌────────────────────┐
│ Return filtered    │
│ results            │
└────────────────────┘
```

### Row Level Security

```sql
-- All tables follow this pattern:

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Users can view own X"
  ON table_name FOR SELECT
  TO authenticated
  USING (
    -- Direct ownership
    auth.uid() = user_id
    OR
    -- Project-based access
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = table_name.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );

-- Write Policy
CREATE POLICY "Users can insert own X"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM seo_projects
      WHERE seo_projects.id = table_name.project_id
      AND seo_projects.user_id = auth.uid()
    )
  );
```

---

## Performance Architecture

### Query Optimization Strategy

```
┌──────────────────────────────────────────────────────────┐
│               Query Performance Layers                    │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Layer 1: TanStack Query Cache (Client-side)       │ │
│  │ • 5 minute stale time                              │ │
│  │ • Optimistic updates                               │ │
│  │ • Background refetching                            │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼ Cache Miss                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Layer 2: Supabase Connection Pool                 │ │
│  │ • PgBouncer pooling                                │ │
│  │ • Connection reuse                                 │ │
│  │ • Query queue management                           │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Layer 3: Database Indexes                          │ │
│  │ • B-tree on FKs and common filters                │ │
│  │ • Hash indexes on URLs                             │ │
│  │ • Composite indexes (project_id, date)            │ │
│  │ • GiST indexes on JSONB                            │ │
│  │ • IVFFlat indexes on vectors                       │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Layer 4: Query Execution                           │ │
│  │ • PostgreSQL query planner                         │ │
│  │ • Index scans (not seq scans)                      │ │
│  │ • Shared buffers (fast memory access)              │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Index Strategy

```sql
-- Pattern 1: Foreign Keys (always indexed)
CREATE INDEX idx_table_parent_id ON table(parent_id);

-- Pattern 2: Common Filters
CREATE INDEX idx_table_status ON table(status)
WHERE status IN ('active', 'processing');

-- Pattern 3: Sort Columns
CREATE INDEX idx_table_created_at ON table(created_at DESC);

-- Pattern 4: Composite (project + date queries)
CREATE INDEX idx_table_project_date ON table(project_id, date DESC);

-- Pattern 5: URL Lookups (hash for exact match)
CREATE INDEX idx_table_url ON table USING hash(url);

-- Pattern 6: JSONB Searches
CREATE INDEX idx_table_metadata ON table USING gin(metadata);

-- Pattern 7: Vector Similarity
CREATE INDEX idx_embeddings_vector ON page_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## Scalability Considerations

### Horizontal Scaling Points

```
┌──────────────────────────────────────────────────────┐
│            Read Replicas (Future)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Replica 1  │  │ Replica 2  │  │ Replica 3  │   │
│  │ (Analytics)│  │  (Reports) │  │   (API)    │   │
│  └────────────┘  └────────────┘  └────────────┘   │
│         │               │               │           │
│         └───────────────┴───────────────┘           │
│                         │                           │
│                         ▼                           │
│            ┌────────────────────┐                  │
│            │ Primary Database   │                  │
│            │ (Writes)           │                  │
│            └────────────────────┘                  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│         Edge Function Scaling (Automatic)            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Function 1 │  │ Function 2 │  │ Function N │   │
│  │ (US-East)  │  │ (EU-West)  │  │ (Asia-SE)  │   │
│  └────────────┘  └────────────┘  └────────────┘   │
│                 Auto-scales to load                  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│         Job Queue Scaling (Future)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  Worker 1  │  │  Worker 2  │  │  Worker N  │   │
│  │ (Crawls)   │  │  (SERP)    │  │  (Analysis)│   │
│  └────────────┘  └────────────┘  └────────────┘   │
│         │               │               │           │
│         └───────────────┴───────────────┘           │
│                         │                           │
│              ┌──────────▼──────────┐                │
│              │  Job Queue (Redis)  │                │
│              └─────────────────────┘                │
└──────────────────────────────────────────────────────┘
```

### Data Partitioning Strategy (Future)

```sql
-- Time-series tables: Partition by date
CREATE TABLE ranks_2024 PARTITION OF ranks
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE ranks_2025 PARTITION OF ranks
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Large tables: Partition by project
CREATE TABLE pages_project_1 PARTITION OF pages
  FOR VALUES IN ('project-uuid-1');

CREATE TABLE pages_project_2 PARTITION OF pages
  FOR VALUES IN ('project-uuid-2');
```

---

## Monitoring & Observability

### System Monitoring Points

```
┌─────────────────────────────────────────────────────────┐
│                  Monitoring Stack                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Metrics    │  │     Logs     │  │    Traces    │ │
│  │              │  │              │  │              │ │
│  │ • API Latency│  │ • Edge Func  │  │ • Request    │ │
│  │ • DB Queries │  │   Logs       │  │   Flow       │ │
│  │ • Queue Depth│  │ • Error Logs │  │ • DB Queries │ │
│  │ • Cache Hits │  │ • Access Logs│  │ • External   │ │
│  │              │  │              │  │   API Calls  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                    ┌───────▼────────┐                   │
│                    │  Supabase      │                   │
│                    │  Dashboard     │                   │
│                    └────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Key Metrics to Track

1. **Database Performance**
   - Query execution time (p50, p95, p99)
   - Index usage percentage
   - Cache hit ratio
   - Connection pool utilization

2. **API Performance**
   - Request latency by endpoint
   - Success rate (2xx vs 4xx vs 5xx)
   - Concurrent connections
   - Rate limit violations

3. **Job Queue Health**
   - Queue depth by priority
   - Job success rate
   - Average processing time
   - Retry rate

4. **External API Usage**
   - DataForSEO API calls/day
   - Firecrawl pages crawled
   - GSC API quota usage
   - Cost per operation

5. **User Metrics**
   - Active users
   - Projects per user
   - Pages crawled per project
   - Feature adoption rates

---

## Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────┐
│                 DNS & CDN Layer                          │
│              Cloudflare / Netlify DNS                    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                Frontend Hosting                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Static Assets (Netlify/Vercel)               │    │
│  │  • HTML, CSS, JS bundles                       │    │
│  │  • Images, fonts                               │    │
│  │  • Service worker                              │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│               Supabase Cloud                             │
│  ┌────────────────────────────────────────────────┐    │
│  │  Edge Functions (Globally Distributed)         │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database (Primary + Replicas)      │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Authentication & Real-time                    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

IconicStack leverages modern cloud architecture to deliver:

✅ **Scalable Database** - PostgreSQL with pgvector for embeddings
✅ **Serverless Compute** - Edge Functions for background processing
✅ **Real-time Updates** - WebSocket subscriptions for live data
✅ **Security First** - Row Level Security on all tables
✅ **Performance Optimized** - 100+ indexes, connection pooling, caching
✅ **Extensible** - Easy to add new features and integrations

The architecture supports horizontal scaling, high availability, and can handle enterprise-level workloads while maintaining sub-second query performance.
