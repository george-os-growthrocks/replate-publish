SEO SaaS — Feature TODO Backlog (Execution Plan)

Legend: ☐ TODO · ☐⚙ In Progress · ☐✅ Done · Priority: P0 (now) · P1 (next) · P2 (later)

0) Platform & Governance

 License & Billing (key activation, renewals, status UI) — P0

 Workspaces & Roles (orgs, projects, RBAC, audit log) — P0

 SMTP Settings (per-workspace, test send, templates) — P0

 Legal Pages (Privacy, ToS, DPA, consent logs) — P0

 Command Palette & Global Search (Cmd/Ctrl+K, fuzzy across tools) — P1

 Sidebar Layouts/Dark Mode (full/no dropdown, theming) — P1

1) Auth & Data Connectors

 Google OAuth (token, refresh, scopes; GA4 + GSC) — P0

 Google Service Accounts (multi-account routing, per-site assignment) — P0

 Google Search Console v2

Connect via OAuth/Service Account; sites table view

Filters (word count, branded, index status), AI Filter, Topic Clusters

Bulk add queries → Organic Rank Tracker

URL Inspection & Page view — P0

 GA4 Integration (props list, top pages, traffic charts, export) — P0

 DataForSEO Integration

SERP/Keywords/Maps endpoints, Post/Ready/Get orchestration, priorities

Cost estimator, queue health, stuck-task cleanup — P0

 DFS Pricing Update (num→Depth) (post-Sep 19, 2025 changes) — P0

 Rent API Keys (DFS “rent” flow, quota checks) — P1

 Google Drive Data Sharing (cache clear, folder open, re-auth) — P1

 Proxies (bulk import, enable/disable, retry/backoff, EU quirks) — P1

 IndexNow + Bing Webmaster (submit, override behaviors) — P1

2) Research, Discovery & Clustering

 Keyword Explorer (autocomplete w/ modifiers, clickstream opt-in, PAA) — P0

 Semantic Keyword Clustering v2 (multi-lang models, UTF-8 harden) — P0

 SERP Clustering

Strict algo, pagination, CPC/Intent mapping, distribute to existing clusters

Ranking metrics, export, target-domain view, cost estimator — P0

 Backlink Gap & Bulk Analyses (backlinks, refs, traffic, keywords) — P1

 SERP Similarity & Comparison (historical view, diff) — P1

 NLP Text Analysis (Entities + Topics; TextRazor/Google drivers) — P1

 Content Struct (heading extractor, exclude domains, global settings) — P1

3) Tracking (Organic, Local, LLM)

 Organic Rank Tracker — P0

SERP Features + Local Pack positions

Dashboard (Coverage %, Visibility Score, trends)

Competitor Discovery, include subdomains, multi-position capture

Presets, tags, PDF/HTML export, Rankings Distribution

 Google Business (GMB) Rank Tracker — P0

Grid (square/circle), Bird’s-Eye, Trend & Comparison views

Tags, SoLV metric, annotations, glow markers, competitor coords

Export PDF/HTML, shareable link, schedule windows, native dark map

 Local SERP Checker (ad-hoc local snapshots) — P1

 NAP Finder (city/state/postal, multi-format phones, excluded domains) — P1

 LLM Rank Tracker — P1

Engines: ChatGPT, ChatGPT-Web, OpenRouter; export; competitor merge

Config alerts, tags, context-limit handling

4) Indexing & On-Page Ops

 Auto-Indexing Suite — P0

Sitemap index crawl (XML/RSS/HTML), URL Inspection API, GSC submit, IndexNow

Filters: “index checked/submitted at”, override behaviors

 Bulk SEO Metadata Optimizer — P0

Multi-worker, filesystem/HTML scan, WP posts/pages/products publishing

Retry, logs, progress + batch delete

 Bulk Check Mentions (selective re-check, filters, cleanup tmp files) — P1

 Sitemap Extractor (timeouts, protection bypass, UA rotation) — P1

5) Data Store, Reliability & Cost Guardrails

 SERP Data Warehouse — P0

Save historical SERP, retention policy, export/import, DB health

 Embedding/Vector DB (init, migration loader, settings UI) — P0

 Queue Orchestrator (Post/Ready/Get auto-refresh, stuck detectors, collectors) — P0

 Disk-Full & Fragmentation Alerts (dashboard cards + maintenance action) — P0

 Timezone Consistency (UTC baseline, consistent snapshots) — P0

 Cost Controls — P0

Depth-priced SERP requests, “re-check only if >X impressions & >30d old”

Clickstream toggle, proxy throttles, estimate before run

6) Analytics & Insights

 Global Dashboard (balances: DFS/rent, SERP tasks, snapshots, disk) — P0

 GSC Insights (Topic Clusters, AI Filter, Queries Over Time export) — P1

 Traffic Analytics & Competitors (filters, exports, opening hours) — P1

 Log File Analysis (bot distribution, free access mode) — P1

7) Reporting, White-Label & Automation

 White-Label Reports (GMB/Organic/LLM, PDF/HTML, dark-mode fidelity) — P0

 Automations (on snapshot finish → email, PDF export, webhook; vars) — P0

 Tags/Annotations (Org-wide taxonomy across tools) — P1

 Redaction Controls (client-safe exports) — P1

8) UX, DX & Supportability

 Progress Indicators (SERP Cluster steps, long jobs) — P1

 Tables at Scale (pagination, lazy load, preserve filters) — P1

 Helpful Errors (no-results, over-token, offline, DFS timeouts) — P1

 Changelog Surface & Update Flow (break changes pre-flight) — P1

9) Backup, Restore & Migration

 Backup Database + App Config (export/import, version mismatch guard) — P0

 SERP Data Import/Export (filters, validate min updated date, dedupe) — P0

 Cloud Snapshot Management (delete/clone, resync missing) — P1

10) Compliance & Stabilization

 Security Hardening (key storage post-encryption removal, notarization) — P0

 Platform QA (Windows/macOS timezone, vector DB loaders, drive cache) — P0

11) Pricing & Packaging (Strategic)

 Plan Gates (LLM tracker in Pro, white-label in Pro+, workspace seats) — P1

 Credit Metering (SERP depth tiers, clickstream add-on, PAA limits) — P1

Acceptance Criteria (for the P0 “must-ship” set)

GSC v2 Connector: user connects via OAuth/Service Account, selects properties, sees Queries/Pages tables with filters; can bulk-push queries to Organic Rank Tracker; URL Inspection works; Topic Clusters renders; AI Filter returns scoped rows.

Organic Rank Tracker: daily snapshot stores positions + SERP Features/Local Pack; dashboard shows Coverage % and Visibility Score; competitor discovery table; export PDF/HTML includes tags and SERP features.

GMB Rank Tracker: grid renders (square/circle), trend + comparison views; SoLV metric displays; export PDF/HTML; schedule windows respected; shareable report link works.

SERP Clustering: cost estimated pre-run (Depth aware); progress indicator during scrape/cluster; exports include CPC/Intent mapping; distribute new keywords to existing clusters.

Auto-Indexing: sitemap index crawl (XML/RSS/HTML), submit via GSC + IndexNow; filters by “index checked/submitted at”; override behaviors toggles.

Data Store & Backups: historical SERP retained per policy; DB maintenance runs; disk-full alert card; backup/restore DB + config succeeds across versions.

Quick Wins (high leverage, low lift)

 Disk-full & fragmentation cards (reduce silent failures) — P0

 Cost guardrails (Depth default + 30-day metric re-check rule) — P0

 PDF/HTML exports unified styling (dark-mode parity) — P0