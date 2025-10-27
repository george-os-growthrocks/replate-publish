# Search Console CRM - Feature Documentation

## 🚀 Overview

A comprehensive React + Vite CRM-style application for Google Search Console data analysis with AI-powered insights. Built with TypeScript, Supabase, and beautiful UI components.

## 🎯 Core Features

### 1. **Unified Dashboard Layout**
- **Left Sidebar Navigation**: Collapsible sidebar with user profile, property selector, and navigation
- **Global Filters**: Date range, device type, and country filters that affect all pages
- **Top Bar**: Quick access to property selector, date picker, and device/country filters
- **Responsive Design**: Beautiful glassmorphism UI with Tailwind CSS and shadcn/ui components

### 2. **Overview Dashboard** (`/dashboard`)
The main dashboard showing:
- **KPI Cards**: Clicks, Impressions, CTR, Average Position with trend indicators
- **Time Series Chart**: Interactive Recharts visualization of clicks and impressions over time
- **Top Queries Table**: Your best-performing search queries
- **AI Insights Panel**: Gemini-powered SEO recommendations

### 3. **Search Queries Page** (`/queries`)
**What page ranks for what keyword** - Deep dive into query performance:
- **Expandable Rows**: Click any query to see ALL pages ranking for it
- **Multi-page Detection**: Visual indicator when multiple pages rank for same query
- **Detailed Metrics**: Clicks, Impressions, CTR, Position per page
- **Search & Filter**: Find queries quickly with built-in search
- **Stats Cards**: Total queries, clicks, avg CTR, avg position

**Use Case**: Identify which pages are competing for the same queries (cannibalization preview)

### 4. **Pages Analysis** (`/pages`)
**What keywords rank on each page** - Understand page performance:
- **Expandable Rows**: Click any page to see ALL keywords it ranks for
- **Top 20 Keywords**: Shows most impactful keywords per page
- **Performance Metrics**: Clicks, impressions, CTR, position per keyword
- **Page Authority**: See which pages drive the most traffic
- **Keyword Count**: How many keywords each page ranks for

**Use Case**: Optimize individual pages by understanding their keyword portfolio

### 5. **Cannibalization Analysis** (`/cannibalization`)
**Automatic detection and resolution** - Find and fix keyword conflicts:

#### Features:
- **Smart Clustering**: Detects queries ranking on 2+ pages
- **Impact Scoring**: High/Medium/Low impact based on impressions volume
- **Primary Candidate Selection**: Algorithm chooses best page using:
  - Weighted impressions (50%)
  - Weighted clicks (70%)
  - Inverse position score (60%)
  
#### For Each Cluster:
- **Visual Cards**: Color-coded by impact level (red=high, amber=medium)
- **Page Comparison**: See all competing pages with scores
- **Primary Badge**: Clearly marked winner page
- **Action Dialog**: Click "View Action Plan" for:
  - Consolidation checklist (canonical tags, redirects, content merge)
  - Supporting pages to merge/redirect
  - Internal link recommendations

#### Stats:
- Total clusters found
- High/medium/low impact breakdown
- Total impressions affected

**Use Case**: Boost rankings by consolidating competing pages into single authority pages

### 6. **Countries Page** (`/countries`)
**Geographic performance breakdown**:
- **Country Table**: Performance by geographic location
- **Metrics**: Clicks, impressions, CTR, position per country
- **Filter Action**: Click "Filter to this country" to apply global filter
- **Top Country**: Quick stats showing best-performing location
- **Country Names**: Human-readable names (USA, UK, Greece, etc.)

**Use Case**: Identify which markets perform best and focus localization efforts

### 7. **Data Processing Engine**

#### Cannibalization Detection Algorithm:
```typescript
// For each query:
1. Group all rows by query
2. Extract pages ranking for that query
3. Aggregate metrics per page
4. Normalize scores (0-1 range)
5. Calculate composite score:
   score = 0.5*(impressions/max) + 0.7*(clicks/max) + 0.6*(minPos/position)
6. Sort by score
7. Highest score = Primary Candidate
8. Filter clusters with 2+ pages and 50+ impressions
```

#### Data Grouping:
- **groupByQuery**: Aggregates GSC data to show pages per query
- **groupByPage**: Aggregates GSC data to show queries per page
- **Smart Aggregation**: Handles CTR calculation, position averaging by impressions

### 8. **Filter Context System**
Global state management for filters that affects all pages:
- **Property URL**: Currently selected Search Console property
- **Date Range**: From/To dates for data queries
- **Country**: Geographic filter (applies to API calls)
- **Device**: Desktop/Mobile/Tablet filter
- **Search Query**: Local filter for UI tables

All filters persist across page navigation and trigger data refetch automatically.

### 9. **API Integration**

#### Supabase Edge Functions:
- **gsc-sites**: Fetch verified properties
- **gsc-query**: Query Search Console data with dimensions/filters
- **gemini-insights**: AI-powered insights generation

#### Data Flow:
```
Frontend (React Query) 
  → Supabase Edge Function (Deno)
    → Google Search Console API
      → Returns aggregated data
        → Frontend processes & visualizes
```

#### useGscData Hook:
```typescript
useGscData({
  propertyUrl: "sc-domain:example.com",
  startDate: "2025-09-29",
  endDate: "2025-10-27",
  dimensions: ["query", "page", "country", "device"],
  country: "usa", // optional filter
  device: "MOBILE" // optional filter
})
```

### 10. **UI Design System**

#### Visual Language:
- **Typography**: Clean, modern with clear hierarchy
- **Colors**: Slate backgrounds with indigo/blue accents
- **Cards**: `rounded-2xl` with soft borders and subtle gradients
- **Spacing**: Generous padding (p-6) and gaps (gap-6)
- **Icons**: Lucide React icons throughout
- **Animations**: Smooth transitions on hover/expand

#### Key Components:
- **KPI Cards**: Large numbers with trend indicators
- **Expandable Tables**: Click to reveal nested data
- **Badge Components**: Status/severity indicators
- **Dialog Modals**: Action plans and details
- **Skeleton Loaders**: Loading states for better UX

### 11. **Performance Optimizations**
- **React Query Caching**: 5-minute stale time, automatic refetch
- **Memoization**: useMemo for expensive calculations (grouping, clustering)
- **Pagination**: Tables show top 100 rows by default
- **Lazy Expansion**: Nested data only renders when expanded
- **API Batching**: 25k rows per request with dimension filters

## 📊 Data Flow Architecture

```
User Action (Select Property, Change Dates)
  ↓
FilterContext Updates
  ↓
useGscData Hook Triggered (React Query)
  ↓
Supabase Edge Function Called
  ↓
Google Search Console API
  ↓
Raw Data Returned
  ↓
Frontend Processing (groupByQuery, groupByPage, findCannibalClusters)
  ↓
UI Components Render with Processed Data
```

## 🎨 Page Hierarchy

```
/ (Landing Page)
/auth (Google Sign-In)
/dashboard (Overview) ← Default after login
  ├─ /queries (Queries Analysis)
  ├─ /pages (Pages Analysis)
  ├─ /countries (Geographic Breakdown)
  └─ /cannibalization (Conflict Detection)
```

All dashboard routes use **DashboardLayout** which provides:
- Sidebar navigation
- Top bar with filters
- Auth protection
- Consistent styling

## 🔧 Technical Stack

### Frontend:
- **React 18** with hooks
- **TypeScript** for type safety
- **React Router** v6 with future flags
- **TanStack Query** for data fetching
- **Tailwind CSS** + **shadcn/ui**
- **Recharts** for visualizations
- **Lucide React** icons

### Backend:
- **Supabase** (Auth + Edge Functions)
- **Deno** runtime for Edge Functions
- **Google Search Console API**
- **Gemini AI** for insights

### State Management:
- **FilterContext** (React Context)
- **React Query** (Server state)
- **Local useState** (UI state)

## 📈 Key Metrics & Calculations

### CTR (Click-Through Rate):
```
CTR = Clicks / Impressions
```

### Average Position:
```
Weighted Average = Σ(position × impressions) / Σ(impressions)
```

### Cannibalization Score:
```
score = 0.5×(impressions/max) + 0.7×(clicks/max) + 0.6×(minPos/pos)
```
Higher score = better primary candidate

### Impact Level:
- **High**: totalImpressions > 500
- **Medium**: totalImpressions 100-500
- **Low**: totalImpressions < 100

## 🚀 Usage Examples

### Example 1: Find Cannibalization Issues
1. Navigate to `/cannibalization`
2. See sorted list of clusters (high impact first)
3. Click "View Action Plan" on any cluster
4. Follow checklist to consolidate pages
5. Monitor impact over 2-4 weeks

### Example 2: Analyze Query Performance
1. Go to `/queries`
2. Search for specific query (e.g., "best coffee maker")
3. Click to expand and see all ranking pages
4. Identify if multiple pages compete (cannibalization)
5. Check CTR and position of each page

### Example 3: Optimize Individual Pages
1. Navigate to `/pages`
2. Click on a high-traffic page
3. See all keywords it ranks for
4. Identify opportunities:
   - High impressions, low CTR → Improve meta description
   - Position 11-20 → Add internal links
   - Many keywords → Consider splitting into focused pages

### Example 4: Geographic Analysis
1. Visit `/countries`
2. Review performance by country
3. Click "Filter to this country" on top performer
4. All other pages now show data for that country only
5. Identify localization opportunities

## 🎯 SEO Use Cases

### 1. Consolidation Strategy
Use cannibalization page to:
- Identify keyword conflicts
- Merge thin content
- Set canonical tags
- Add 301 redirects
- Strengthen authority signals

### 2. Content Gap Analysis
Use queries + pages to:
- Find high-impression, low-click opportunities
- Identify pages with few keywords (expand content)
- Discover queries without dedicated pages (create content)

### 3. International SEO
Use countries page to:
- Identify strong markets
- Plan hreflang implementation
- Prioritize translation efforts
- Adjust content for local preferences

### 4. Quick Win Identification
Look for:
- Position 11-20 with high impressions → Low-hanging fruit
- High CTR but low position → Improve rankings
- Low CTR with good position → Improve titles/descriptions

## 🔒 Security & Privacy

- **Authentication**: Google OAuth via Supabase
- **Tokens**: Provider tokens stay server-side
- **API Keys**: Stored in Supabase secrets
- **No Data Storage**: All queries are real-time
- **Privacy**: No user data sent to Gemini (only aggregated metrics)

## 🚧 Future Enhancements

Potential additions:
- [ ] Devices page (Desktop vs Mobile comparison)
- [ ] Link Opportunities (internal linking suggestions)
- [ ] Alerts system (anomaly detection for drops)
- [ ] Export to CSV/PDF
- [ ] Saved filters/workspaces
- [ ] CTR vs Position scatter plot
- [ ] Competitor comparison
- [ ] Historical trend comparison
- [ ] One-click Gemini briefs for consolidation

## 📚 Developer Notes

### Adding New Pages:
1. Create page component in `src/pages/`
2. Import in `src/App.tsx`
3. Add route with DashboardLayout wrapper
4. Add menu item in `DashboardLayout.tsx`
5. Use `useFilters()` hook for global state
6. Use `useGscData()` hook for data fetching

### Extending Cannibalization Logic:
See `src/lib/cannibalization.ts`:
- Adjust weights in score calculation
- Change minPages/minImpressions thresholds
- Add new clustering algorithms

### Custom Filters:
Update `FilterContext.tsx` to add new global filters that all pages can access.

---

Built with ❤️ for SEO professionals who want data-driven insights without the complexity.

