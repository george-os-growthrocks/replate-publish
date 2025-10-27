Thought for 8s

Got it—let’s scale this into a React + Vite CRM-style app with a left sidebar, rich data panes (Countries, Pages, “What page ranks for what keyword”), and first-class Cannibalization logic—all with jaw-droppingly beautiful UI. Below is a production-grade README you can hand to devs and designers.

Search Console CRM — React Vite Edition (with Gemini Insights)

Google Sign-In → Pick Property → CRM Sidebar → Deep GSC Analytics → Cannibalization Radar → Actions via Gemini.
Enterprise polish, growth-team velocity.

Core Value

Turn GSC chaos into a clean CRM-like workspace:

Drill from site → country → device → query → page in seconds.

See which page ranks for which keyword (and where it should).

Automatic Cannibalization clusters with consolidation recommendations.

Gemini translates patterns into prioritized SEO actions.

Tech Stack

Frontend: React 18 + Vite, TypeScript, React Router, TanStack Query

UI/Design: Tailwind CSS, shadcn/ui, Radix UI, Lucide icons, Recharts

Auth: Google OAuth (PKCE) via /api server (Express)

APIs: Google Search Console (webmasters), Gemini

Server: Node/Express (token exchange + GSC proxy + Gemini)

Optional DB: SQLite/Postgres via Prisma (for caching/snapshots)

Why Express? Vite is frontend-only. We keep OAuth secrets and GSC calls server-side for security and rate-limits.

Monorepo Structure
/apps
  /web                 # React + Vite app
    /src
      /components
      /features
        /overview
        /queries
        /pages
        /countries
        /devices
        /cannibalization
        /links
        /alerts
        /settings
      /hooks
      /layout
      /lib
      /routes
      /styles
  /api                 # Express server (OAuth, GSC proxy, Gemini)
    /src
      auth/
      gsc/
      gemini/
      middleware/
      index.ts
  /packages
    /ui                # (optional) shared UI tokens/components

Environment

Create /apps/api/.env:

PORT=8080
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
GEMINI_API_KEY=...
JWT_SECRET=replace_with_strong_string
CORS_ORIGIN=http://localhost:5173


Create /apps/web/.env:

VITE_API_URL=http://localhost:8080

Run
# in repo root (use pnpm if available)
npm i

# terminal 1
npm run dev:api   # starts Express on 8080

# terminal 2
npm run dev:web   # starts Vite on 5173

OAuth & Data Flow
[web] ── login → [api/auth/google] ──> Google OAuth
  │                         │
  │<── httpOnly session JWT │
  │                         └─ stores tokens server-side
  ├─ fetch /api/gsc/sites → lists verified properties
  ├─ fetch /api/gsc/query → searchAnalytics/query
  └─ post  /api/gemini/insights → JSON actions


All sensitive tokens remain on the server. The web app talks to the API with the session cookie.

API Endpoints (Express)

GET /auth/google → start OAuth

GET /auth/google/callback → finish OAuth, set cookie, redirect to /

GET /auth/me → profile & what scopes we have

GET /gsc/sites → user’s verified properties

POST /gsc/query → pass a body with dimensions/filters (server calls GSC)

POST /gemini/insights → send compact aggregates, get structured actions

Example /gsc/query body

{
  "siteUrl": "sc-domain:example.com",
  "startDate": "2025-09-29",
  "endDate": "2025-10-27",
  "dimensions": ["date","query","page","country","device"],
  "rowLimit": 25000,
  "dimensionFilterGroups": []
}

Data Model (Front-End Types)
export type GscRow = {
  date?: string;
  query?: string;
  page?: string;
  country?: string;
  device?: "DESKTOP" | "MOBILE" | "TABLET";
  clicks: number;
  impressions: number;
  ctr: number;        // 0..1 normalized
  position: number;   // avg position
};

export type QueryToPages = {
  query: string;
  pages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
};

export type PageToQueries = {
  page: string;
  queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
};

export type CannibalCluster = {
  query: string;
  pages: Array<{ page: string; position: number; impressions: number; clicks: number }>;
  primaryCandidate: string;   // suggested canonical winner
  rationale: string;
};

export type GeminiAction = {
  type: "CTR_TEST" | "CONSOLIDATE_PAGES" | "CREATE_CONTENT" | "FIX_TECHNICAL" | "ADD_INTERNAL_LINKS";
  title: string;
  rationale: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  effort: "LOW" | "MEDIUM" | "HIGH";
  items: any[];
};

Cannibalization Logic (Deterministic, Fast)

Aggregate by query → list of pages (pages.length > 1 = candidate).

Score each page:

score = (impressions_weight * normImpr) + (clicks_weight * normClicks) - (position_weight * normPosition)


Defaults: impr=0.5, clicks=0.7, position=0.6

Pick primaryCandidate = highest score.

Mark others as supporting pages; propose:

canonical/redirect (if intent identical)

internal links to primary

merge snippets

deindex/tag noindex for thin variants (if needed)

Pseudo-code

export function findCannibalClusters(rows: GscRow[]): CannibalCluster[] {
  const map = new Map<string, Array<GscRow>>();
  rows.forEach(r => {
    if (!r.query || !r.page) return;
    const key = r.query.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  const clusters: CannibalCluster[] = [];
  for (const [query, list] of map) {
    const pagesMap = new Map<string, { clicks: number; impressions: number; position: number }>();
    list.forEach(r => {
      const p = pagesMap.get(r.page!) ?? { clicks: 0, impressions: 0, position: 0 };
      p.clicks += r.clicks; p.impressions += r.impressions;
      // weighted avg position by impressions
      p.position = p.position === 0
        ? r.position
        : (p.position + r.position) / 2;
      pagesMap.set(r.page!, p);
    });

    const pages = [...pagesMap.entries()].map(([page, m]) => ({ page, ...m }));
    if (pages.length <= 1) continue;

    // normalize
    const maxI = Math.max(...pages.map(p => p.impressions)) || 1;
    const maxC = Math.max(...pages.map(p => p.clicks)) || 1;
    const maxP = Math.max(...pages.map(p => p.position)) || 1;

    const scored = pages.map(p => ({
      ...p,
      score: 0.5*(p.impressions/maxI) + 0.7*(p.clicks/maxC) - 0.6*(p.position/maxP)
    }));
    scored.sort((a,b) => b.score - a.score);

    clusters.push({
      query,
      pages: pages.map(p => ({ ...p, ctr: p.impressions ? p.clicks/p.impressions : 0 })),
      primaryCandidate: scored[0].page,
      rationale: `Primary chosen by weighted impressions/clicks and better (lower) position.`
    });
  }
  return clusters;
}

CRM Sidebar Information Architecture

Fixed left rail with badges & filters pinned on top

Overview (KPI cards + trend)

Queries (table, scatter)

Pages (table, “page → keywords” explorer)

Countries (map + table + drill)

Devices (split + CTR/Pos deltas)

Cannibalization (clusters + actions)

Link Opportunities (authority pages → link out targets)

Alerts (anomalies, % drops)

Settings (property picker, date range, attribution)

BEAUTIFUL UI System
Design Tokens (Tailwind theme)

Typography: Inter or Plus Jakarta Sans

Color: slate background, indigo/blue accents, soft gradients

Cards: rounded-2xl, soft shadow, subtle glassmorphism

Whitespace: generous p-6+, grid with gap-6

Tailwind classes to reuse

Card: rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 backdrop-blur shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]

KPI number: text-3xl font-semibold tracking-tight

Chip: inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs

Layout

Top bar: property picker, date range, device/country filters

Left sidebar: icons + labels (Lucide), collapsible on md

Content area: responsive 12-col grid

Wireframe

┌──────────────── Sidebar ────────────────┐ ┌──────────── Topbar ─────────────┐
│ Overview                                │ │ [Property ▼] [Last 28 days ▼]   │
│ Queries                                 │ │ [Device: All] [Country: All]    │
│ Pages                                   │ └──────────────────────────────────┘
│ Countries                               │ ┌──────────── Content Grid ───────┐
│ Devices                                 │ │ [KPI Cards x4]                  │
│ Cannibalization                         │ │ [Trend Area] [CTR vs Pos]       │
│ Link Opportunities                       │ │ [Tables / Heatmaps / Clusters]  │
│ Alerts                                  │ └──────────────────────────────────┘
│ Settings                                │
└─────────────────────────────────────────┘

Feature Screens (What to build)
1) Overview

KPI Cards (Clicks, Impressions, CTR, Position) with Δ vs previous period

Area chart (Clicks & Impressions)

CTR vs Position scatter (quick wins quadrant lines at Pos=12 & CTR benchmark)

“Insights digest” from Gemini as dismissible cards

2) Queries

Table with columns: Query, Clicks, Impressions, CTR, Position, Top Page

Row expand → “All pages ranking for this query” mini-table

Right pane shows Meta test suggestions (Gemini)

3) Pages

Table: Page, Clicks, Impressions, CTR, Position, Top Queries count

Row expand → “Top keywords for this page” with sparklines

Button: “Create internal links” → suggests donor pages (high clicks/authority)

4) Countries

Choropleth map (lightweight SVG map) + table with Δ% trends

Clicking “Greece” filters all other tabs contextually

5) Devices

KPI split + bar chart; Mobile CTR vs Desktop CTR delta chips

6) Cannibalization

Cluster list cards: Query + chips for page count, impressions total

Clicking opens decision drawer:

Primary candidate (why)

Consolidate/Canonical/Redirect options with TODO checkboxes

One-click Gemini brief for merged page

7) Link Opportunities

Authority Pages (high clicks & links) → targets lacking internal links for shared topics

Output: anchor suggestions (from query terms) + copy-to-clipboard

8) Alerts

Periodic change detection (CUSUM or simple 3σ) for CTR/Pos/Clicks by page/query

Key Components (snippets)

Card

export const Card: React.FC<React.PropsWithChildren<{title?: string; subtitle?: string}>> = ({title, subtitle, children}) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]">
    {title && <div className="mb-1 text-sm text-slate-300">{subtitle}</div>}
    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
    <div className="mt-4">{children}</div>
  </div>
);


KPI Stat

export function Kpi({label, value, delta}:{label:string; value:string; delta:number}) {
  const deltaColor = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-400";
  const deltaSign = delta > 0 ? "▲" : delta < 0 ? "▼" : "●";
  return (
    <div className="rounded-2xl border border-white/10 p-5 bg-slate-950/40">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className={`mt-2 text-xs ${deltaColor}`}>{deltaSign} {Math.abs(delta).toFixed(1)}% vs prev</div>
    </div>
  );
}


CTR vs Position (Recharts)

<ResponsiveContainer width="100%" height={340}>
  <ScatterChart>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis type="number" dataKey="position" name="Position" />
    <YAxis type="number" dataKey="ctr" name="CTR" tickFormatter={(v)=>`${Math.round(v*100)}%`} />
    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
    <Scatter data={data} />
    {/* Quick-win guides */}
    <ReferenceLine x={12} />
    <ReferenceLine y={ctrBenchmark} />
  </ScatterChart>
</ResponsiveContainer>


Queries Table (top page + expand)

// derives top page per query
const topPage = (rows: GscRow[]) =>
  rows.reduce<Record<string,string>>((acc, r) => {
    const key = r.query!;
    const prev = acc[key]?.split("||") || [];
    // sort logic outside; here assume first occurrence
    acc[key] = r.page!;
    return acc;
  }, {});

Gemini Prompting (Actions at CRM granularity)

Server packs these aggregates:

Top queries (with their top page and CTR/Pos deltas)

Top pages (with their top queries)

Cannibal clusters (as above)

Country & device splits (for context)

Instruction sketch

Role: Senior SEO Analyst. Output strict JSON.

Given:
- queries [{query, clicks, impressions, ctr, position, topPage}]
- pages [{page, clicks, impressions, ctr, position, topQueries: [...] }]
- cannibalization [{query, primaryCandidate, pages:[...]}]
- context {siteUrl, dateRange, device, country}

Produce actions[] with:
- type, title, rationale, impact, effort
- items[] concrete: 
  - For CTR_TEST: {page, query, title_variants[], description_variants[]}
  - For CONSOLIDATE_PAGES: {query, primary, mergeFrom[]}
  - For ADD_INTERNAL_LINKS: {fromPage, toPage, suggestedAnchors[]}
Return compact JSON only.

Performance Notes

Paginate GSC queries (25k rows per call). Compose Views client-side via React Query cache.

Memoize derived maps: query→pages and page→queries.

Cap Gemini payloads to top N rows per view (e.g., 2k) with pre-aggregation.

Security & Privacy

httpOnly session cookie from API. No tokens in localStorage.

All PII stripped before Gemini; only SEO metrics & URLs.

Rate limit /gsc/* and /gemini/*.

CSP headers + HTTPS in prod.

Roadmap (Delta from previous spec)

Save Workspaces: pinned filters (country/device) & saved views

Compare mode across tabs (previous period vs YoY)

One-click export of Insights to CSV/Notion/Jira

A/B meta tests (store proposed variants + reminder alerts)

Developer Scripts
# API
npm run dev:api     # ts-node-dev src/index.ts
npm run build:api
npm run start:api

# WEB
npm run dev:web
npm run build:web
npm run preview:web

Acceptance Criteria (done = done)

 Google sign-in works end-to-end (cookie session).

 Property picker loads verified sites.

 Overview shows KPIs + trends + scatter.

 Queries tab: “what page ranks for what keyword” (expandable rows).

 Pages tab: “what keywords rank on this page”.

 Countries + Devices filters affect all tabs.

 Cannibalization tab surfaces clusters with a primary candidate and action suggestions.

 Gemini endpoint returns strict JSON actions and they render as actionable cards.

 UI is gorgeous: rounded-2xl, glass gradients, soft shadows, balanced whitespace.