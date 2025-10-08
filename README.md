# IconicStack — Enterprise SEO Intelligence Platform

> **Status:** Production-ready MVP with advanced AI capabilities
> **Audience:** SEO professionals, technical SEO managers, agencies, and developers
> **Philosophy:** Best-in-class primitives from industry leaders, unified into one platform

---

## Overview

IconicStack combines the most powerful features from leading SEO platforms into a unified, modern web application:

- **Crawl & Audit** (Screaming Frog + Semrush): HTML-first with **conditional JS rendering**
- **Backlink Graph** (Ahrefs + Moz): Normalized edge list with temporal tracking
- **SERP & Rankings** (DataForSEO): Position tracking with feature extraction
- **Ground Truth** (GSC + GA4): Real performance data triangulation
- **Content Optimizer** (Surfer): BM25/TF-IDF term extraction and scoring
- **SEO Testing** (SEOTesting.com): Pre/post experiments with statistical significance
- **Forecasting** (SEOmonitor): CTR curves with Monte Carlo simulations
- **Internal Linking AI**: pgvector embeddings + PageRank authority flow

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  React 18 + Vite + TypeScript + TanStack Query + shadcn/ui    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                     API Gateway Layer                           │
│     Supabase Edge Functions (Deno) + Authentication            │
└────────┬─────────────────────────────┬──────────────────────────┘
         │                             │
┌────────┴──────────────┐   ┌──────────┴────────────────────────┐
│   Async Workers       │   │   External APIs                   │
│  - Crawlers           │   │  - DataForSEO                     │
│  - Job Queue          │   │  - Firecrawl                      │
│  - SERP Tracking      │   │  - Google OAuth (GSC/GA4)         │
└───────────────────────┘   └───────────────────────────────────┘
         │
┌────────┴──────────────────────────────────────────────────────┐
│                   Data Layer (Supabase)                        │
│  PostgreSQL + pgvector + RLS + Real-time Subscriptions        │
└────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **HTML-First Crawling**: Fast crawling with conditional JS rendering only when needed
2. **Data Triangulation**: Crawl data × SERP data × GSC/GA4 data = complete picture
3. **Idempotent Jobs**: All background tasks are retryable with full logging
4. **Row-Level Security**: Zero-trust database access with user-based policies
5. **Real-Time Updates**: WebSocket subscriptions for live progress tracking

---

## Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast builds and HMR
- **TanStack Query** for server state management
- **shadcn/ui** for accessible, customizable components
- **Tailwind CSS** for utility-first styling
- **Recharts** for advanced data visualization
- **Framer Motion** for smooth animations

### Backend
- **Supabase** for authentication, database, and edge functions
- **PostgreSQL 15+** with pgvector extension for embeddings
- **Row Level Security** for multi-tenant data isolation
- **Edge Functions (Deno)** for serverless API endpoints

### External APIs
- **DataForSEO** for keyword research and SERP tracking
- **Firecrawl** for HTML/JS rendering and content extraction
- **Google APIs** for Search Console and Analytics data
- **OpenAI/Anthropic** for AI-powered analysis (optional)

---

## Quick Start

### Prerequisites

- Node.js 18+ with npm
- Supabase CLI (optional, for local development)
- API keys for DataForSEO and Firecrawl

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd iconicstack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit .env with your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - DataForSEO credentials
# - Firecrawl API key
```

### Database Setup

The database migrations are automatically applied when you first connect. The schema includes:

- ✅ Core tables (projects, users, settings)
- ✅ Crawling infrastructure (pages, links, crawl_runs)
- ✅ SERP tracking (keywords, ranks, features)
- ✅ Content optimization (analyses, term_frequency, recommendations)
- ✅ Internal linking (embeddings, authority, opportunities)
- ✅ Job queue system with priority scheduling

### Development

```bash
# Start the development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm test
```

### Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Core Features

### 1. Site Crawling & Auditing

**HTML-First with Conditional Rendering**

The crawler uses a smart two-phase approach:

1. **Fast HTML Fetch**: Initial crawl extracts links, meta tags, and structure
2. **Conditional JS Render**: Only triggered when heuristics detect:
   - Empty body with heavy script tags
   - SPA routes (`/#/`, `/app/`)
   - No anchor tags found in HTML but expected

**What's Captured:**

- Status codes, canonical URLs, redirects
- Title, meta description, H1-H6 tags
- Word count, readability scores
- Internal/external link counts
- Image optimization (alt tags, sizes)
- Schema markup detection
- Core Web Vitals (optional)

**Edge Function:** `website-crawler`

```typescript
const { data } = await supabase.functions.invoke('website-crawler', {
  body: {
    projectId: 'uuid',
    domain: 'example.com',
    maxPages: 100,
    depth: 3
  }
});
```

### 2. Backlink Graph & Authority

**Temporal Link Tracking**

All links are stored as edges in a graph with:

- `first_seen`: When the link was first discovered
- `last_seen`: Most recent crawl where link exists
- `anchor`: Exact anchor text
- `rel`: Follow/nofollow attributes
- `link_type`: Internal/external classification

**PageRank-Like Authority**

```sql
SELECT calculate_page_authority('project-id', 0.85, 20);
```

This iterative algorithm:
1. Initializes all pages with equal authority
2. Distributes authority through links (damping factor 0.85)
3. Incorporates GSC impressions and clicks
4. Produces composite scores for opportunity ranking

**New vs Lost Links Dashboard**

Track link velocity over time:
- New backlinks in last 30 days
- Lost backlinks (disappeared links)
- Anchor text evolution
- Referring domain trends

### 3. SERP Tracking & Volatility

**Position Tracking**

- Daily rank checks via DataForSEO
- Desktop and mobile device tracking
- Location-specific rankings
- Historical position charts

**SERP Feature Extraction**

Automatically detects and tracks:
- Featured Snippets
- People Also Ask (PAA)
- Image Packs
- Video Carousels
- Knowledge Panels
- Local Packs
- AI Overviews
- Shopping Results

**Volatility Index**

Automatically calculated per project:

```sql
SELECT calculate_serp_volatility('project-id', CURRENT_DATE);
```

Returns 0-100 score based on:
- Percentage of keywords that moved > 3 positions
- Average position change magnitude
- Algorithm update correlation

### 4. Content Optimization Engine

**BM25 & TF-IDF Analysis**

The content optimizer:

1. Crawls top 10 SERP results for target keyword
2. Extracts all terms (excluding stop words)
3. Calculates term frequency (TF) per document
4. Calculates document frequency (DF) across corpus
5. Computes TF-IDF and BM25 scores
6. Ranks terms by relevance

**Mathematical Scoring:**

```typescript
// TF-IDF
tfIdf = termFrequency * log(totalDocs / documentFrequency)

// BM25 (with length normalization)
bm25 = idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)))

// Default parameters: k1 = 1.5, b = 0.75
```

**What You Get:**

- Top 100 terms ranked by BM25 score
- Suggested keywords to add
- Content length recommendations
- Heading structure suggestions
- Readability improvements
- Link density optimization

**Edge Function:** `content-optimizer-advanced`

```typescript
const { data } = await supabase.functions.invoke('content-optimizer-advanced', {
  body: {
    projectId: 'uuid',
    targetKeyword: 'best seo tools',
    analyzeCompetitors: true
  }
});
```

### 5. Internal Linking AI

**Semantic Similarity with pgvector**

1. Generate 1536-dimension embeddings for each page (OpenAI ada-002)
2. Store in pgvector for cosine similarity search
3. Find topically related pages with similarity > 0.5

**Opportunity Scoring**

```typescript
opportunityScore = (
  semanticSimilarity * 0.30 +
  sourceAuthority * 0.25 +
  targetImpressions * 0.25 +
  positionFactor * 0.20
) * 100
```

Position factors:
- Rank 11-20: 1.0 (quick wins)
- Rank 21-50: 0.7
- Rank 50+: 0.4

**Automatic Recommendations**

```sql
SELECT generate_link_opportunities('project-id', 50.0);
```

Returns top 1000 internal linking opportunities with:
- Source page (high authority)
- Target page (needs boost)
- Semantic similarity score
- Estimated traffic lift
- Suggested anchor texts

### 6. SEO Testing Framework

**Pre/Post Experiments**

Design experiments to test hypothesis:

```typescript
{
  hypothesis: "Adding FAQ schema will increase CTR",
  startDate: "2024-01-01",
  groupDef: {
    treatment: ["/blog/post-1", "/blog/post-2"],
    control: ["/blog/post-3", "/blog/post-4"]
  }
}
```

**Statistical Significance**

- Calculates clicks delta and impressions delta
- Runs t-tests for significance (p-value)
- Applies seasonality guardrails
- Tracks confidence intervals

**Change Detection**

Automatically captures:
- Title/meta changes
- Schema additions/removals
- Content modifications
- Link changes

### 7. Traffic Forecasting

**CTR Curve Models**

Position-based click probability using industry benchmarks:

| Position | Desktop CTR | Mobile CTR |
|----------|------------|------------|
| 1        | 28.45%     | 26.45%     |
| 2        | 15.15%     | 13.15%     |
| 3        | 10.05%     | 9.05%      |
| 4        | 7.35%      | 6.35%      |
| 5        | 5.55%      | 4.85%      |

**Monte Carlo Simulations**

For each keyword set:
1. Define target ranks (current → target)
2. Choose progression speed (aggressive/normal/conservative)
3. Run 10,000 simulations with variance
4. Calculate p10, p50, p90 scenarios

**Revenue Projections**

```typescript
revenue = forecastedSessions * conversionRate * averageOrderValue
```

With confidence intervals for each scenario.

### 8. Job Queue System

**Priority-Based Processing**

Jobs are processed by priority (1 = highest, 10 = lowest):

```typescript
{
  jobType: 'crawl_site',
  priority: 3,
  inputData: { projectId, domain },
  maxRetries: 3
}
```

**Job Types:**

- `crawl_site`: Full site crawl
- `rank_tracking`: Daily SERP checks
- `gsc_sync`: Pull Search Console data
- `content_analysis`: Run content optimizer
- `generate_embeddings`: Create page vectors
- `calculate_authority`: Update PageRank scores
- `link_opportunities`: Find internal linking suggestions

**Retry Logic**

Failed jobs are automatically retried with exponential backoff:
- Retry 1: Immediate
- Retry 2: 5 minutes
- Retry 3: 15 minutes
- After 3 failures: Mark as failed

---

## Database Schema

### Core Tables

**Projects & Users**
- `profiles`: User accounts and plan types
- `seo_projects`: SEO project containers
- `user_settings`: Preferences and API keys

**Crawling**
- `crawl_runs`: Crawl job management
- `pages`: Crawled pages with metadata
- `links`: Edge list for graph (src → dst)

**SERP**
- `serp_keywords`: Keyword universe
- `ranks`: Daily position tracking
- `serp_features`: Feature extraction
- `serp_volatility`: Ranking stability index

**Content**
- `content_analyses`: Analysis sessions
- `term_frequency`: TF-IDF calculations
- `content_scores`: Multi-dimensional scoring
- `content_recommendations`: AI suggestions

**Internal Linking**
- `page_embeddings`: Vector storage (1536-dim)
- `page_authority`: PageRank scores
- `internal_link_opportunities`: Recommendations

**Jobs**
- `jobs`: Background job queue
- `job_logs`: Execution logging
- `job_schedules`: Recurring tasks

### Functions

**Mathematical:**
- `calculate_tf_idf()`: TF-IDF scoring
- `calculate_bm25()`: BM25 relevance
- `calculate_content_score()`: Overall quality
- `calculate_page_authority()`: PageRank iteration

**Business Logic:**
- `generate_link_opportunities()`: Find link suggestions
- `calculate_serp_volatility()`: SERP stability
- `dequeue_next_job()`: Job queue management
- `complete_job()`: Job completion handler

---

## API Documentation

### Edge Functions

#### 1. Website Crawler

**Endpoint:** `POST /functions/v1/website-crawler`

**Request:**
```typescript
{
  projectId: string;
  domain: string;
  maxPages: number; // 1-2000
  depth?: number; // 1-10
}
```

**Response:**
```typescript
{
  success: true;
  crawlJobId: string;
  message: "Crawl started successfully"
}
```

**Credits:** 1 credit per page crawled

#### 2. Content Optimizer

**Endpoint:** `POST /functions/v1/content-optimizer-advanced`

**Request:**
```typescript
{
  projectId: string;
  targetKeyword: string;
  targetUrl?: string;
  analyzeCompetitors?: boolean;
}
```

**Response:**
```typescript
{
  success: true;
  analysisId: string;
  message: "Content analysis started"
}
```

**Processing:** Background async (30-90 seconds)

#### 3. SERP Tracker

**Endpoint:** `POST /functions/v1/serp-tracker`

**Request:**
```typescript
{
  projectId: string;
  keywords: string[];
  location: string; // "United States"
  device: "desktop" | "mobile";
}
```

#### 4. GSC Data Sync

**Endpoint:** `POST /functions/v1/fetch-gsc-data`

**Request:**
```typescript
{
  projectId: string;
  startDate: string; // ISO 8601
  endDate: string;
}
```

---

## Advanced Features

### Conditional JS Rendering Heuristics

The crawler decides to render JavaScript when:

```typescript
const shouldRender = (
  bodyText.length < 200 ||
  (scriptTags.length > 10 && bodyText.length < 1000) ||
  url.match(/\/(app|dashboard|profile)\//) ||
  (links.length === 0 && content.length > 0)
);
```

### Brand vs Non-Brand Classification

Queries are classified as brand if they contain:
- Company name
- Domain name
- Branded product names

This allows forecasting to focus on non-brand traffic potential.

### Seasonality Detection

For SEO testing, seasonality is detected by:
1. Computing 7-day moving average
2. Comparing current period to same period last year
3. Flagging significance tests if seasonality variance > 20%

### Authority Flow Calculation

Internal linking recommendations consider:

```typescript
authorityTransfer = sourceAuthority * (1 / outboundLinks) * dampingFactor
```

Higher authority pages with fewer outbound links pass more value.

---

## Performance Optimizations

### Database Indexes

100+ strategic indexes on:
- Foreign keys for join optimization
- Composite indexes for complex queries (project_id + date)
- Hash indexes on URLs for exact lookups
- GiST indexes on JSONB columns
- IVFFlat indexes on vector embeddings

### Query Optimization

- Materialized views for dashboard metrics
- Partitioning on time-series tables (ranks, gsc_query)
- Connection pooling with PgBouncer
- Query result caching with TanStack Query

### Frontend Performance

- Code splitting by route
- Lazy loading for heavy components
- Optimistic updates for mutations
- Debounced search inputs
- Virtual scrolling for large lists

---

## Security

### Row Level Security (RLS)

Every table has RLS enabled with policies:

```sql
CREATE POLICY "Users can view own projects"
  ON seo_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Authentication

- JWT-based authentication via Supabase Auth
- Email/password with optional OAuth
- Session management with refresh tokens
- Rate limiting on sensitive endpoints

### Data Protection

- API keys encrypted at rest
- Signed URLs for S3 snapshots (future)
- HTTPS everywhere
- CORS properly configured
- Input validation and sanitization

---

## Roadmap

### In Progress
- [ ] Keyword clustering with k-means
- [ ] Multi-property benchmarking
- [ ] Team collaboration features
- [ ] White-label reporting

### Planned
- [ ] A/B testing via edge middleware
- [ ] WordPress plugin integration
- [ ] Shopify app
- [ ] Mobile app (React Native)
- [ ] API rate limit dashboard
- [ ] Cost tracking per feature

### Future Ideas
- [ ] Voice search optimization
- [ ] Video SEO tracking
- [ ] International SEO management
- [ ] AI content generation
- [ ] Automated fix suggestions

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Development Guidelines

- TypeScript strict mode required
- ESLint and Prettier for code style
- Write tests for new features
- Update documentation as needed
- Follow existing patterns

---

## License

MIT License - see LICENSE file for details

---

## Credits

This platform draws inspiration from the best features of:

- **Ahrefs** - Backlink analysis and rank tracking
- **SEMrush** - Comprehensive SEO toolkit
- **Screaming Frog** - Website crawling
- **Moz** - Domain authority and link metrics
- **Surfer SEO** - Content optimization
- **SEOTesting.com** - Statistical SEO experiments
- **SEOmonitor** - Forecasting and ROI modeling

Built with modern web technologies and best practices.

---

## Support

- 📧 Email: support@iconicstack.dev
- 💬 Discord: [Join our community](https://discord.gg/iconicstack)
- 📖 Docs: [docs.iconicstack.dev](https://docs.iconicstack.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/iconicstack/issues)

---

**Built with ❤️ by the IconicStack team**
