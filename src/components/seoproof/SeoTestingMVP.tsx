// SeoTestingMVP.tsx
// One-file React/Vite component that implements an MVP of an SEO testing layer on top of your APIs.
// Assumptions (override as needed):
// - You already expose endpoints for GSC OAuth, performance data, tests, and a site changelog.
// - Configure API_BASE via VITE_API_BASE or fall back to '/api'.
// - shadcn/ui, lucide-react, and recharts are available in your project. TailwindCSS is assumed.
//
// 🔧 Expected endpoints (rename in API_CLIENT below to match your backend):
//   GET  {API_BASE}/gsc/status                           -> { connected: boolean, properties?: string[] }
//   GET  {API_BASE}/gsc/connect-url                      -> { url: string }
//   GET  {API_BASE}/gsc/performance?start=YYYY-MM-DD&end=YYYY-MM-DD&dimension=(page|query)&target=... -> { rows: Array<{date, clicks, impressions, ctr, position, page?, query?}> }
//   GET  {API_BASE}/changelog                            -> { items: Array<ChangelogItem> }
//   POST {API_BASE}/changelog                            -> body: { date: string, title: string, note?: string }
//   GET  {API_BASE}/insights/ctr-opportunities?start=YYYY-MM-DD&end=YYYY-MM-DD&minImpr=...
//   POST {API_BASE}/tests                                -> body: TestDefinition  -> { id: string }
//   GET  {API_BASE}/tests                                -> { items: Array<TestSummary> }
//   GET  {API_BASE}/tests/:id/results                    -> { pre: GscPoint[], post: GscPoint[], summary: UpliftSummary }
//
// 📦 Install (if not present):
//   pnpm add recharts lucide-react
//   (shadcn components assumed at @/components/ui/*; replace with your own if needed.)
//
// ✅ Drop this file anywhere inside your Vite + React + Tailwind app and render <SeoTestingMVP />.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, FlaskConical, TestTube, Rocket, Link2, SplitSquareHorizontal, LineChart as LineChartIcon, CalendarDays, Plus, RefreshCw, Download, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useSubscription, useCredits, useDeductCredits } from "@/hooks/useSubscription";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

// ----------------------------- Types -----------------------------

type GscPoint = {
  date: string; // YYYY-MM-DD
  clicks: number;
  impressions: number;
  ctr: number; // 0..1
  position: number;
  page?: string;
  query?: string;
};

type ChangelogItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  note?: string;
};

type Scope = 'url' | 'group' | 'query';

type TimeTestDefinition = {
  type: 'time';
  scope: Scope;
  target: string;     // URL, prefix/regex, or query
  preStart: string;   // YYYY-MM-DD
  preEnd: string;
  postStart: string;
  postEnd: string;
};

type SplitTestDefinition = {
  type: 'split';
  controlPattern: string; // prefix/regex/list key for URL group A
  variantPattern: string; // prefix/regex/list key for URL group B
  start: string;
  end: string;
};

type TestDefinition = TimeTestDefinition | SplitTestDefinition;

type TestSummary = {
  id: string;
  type: 'time' | 'split';
  title: string;
  createdAt: string;
  status: 'running' | 'completed' | 'queued' | 'error';
};

type UpliftSummary = {
  clicks: { delta: number; pct: number };
  impressions: { delta: number; pct: number };
  ctr: { delta: number; pct: number };
  position: { delta: number; pct: number };
  significance: 'low' | 'medium' | 'high';
};

// ----------------------------- API Client -----------------------------

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

const API_CLIENT = {
  async gscStatus(): Promise<{ connected: boolean; properties?: string[] }>{
    return http(`${API_BASE}/gsc/status`);
  },
  async gscConnectUrl(): Promise<{ url: string }>{
    return http(`${API_BASE}/gsc/connect-url`);
  },
  async performance(params: { start: string; end: string; dimension: 'page' | 'query'; target?: string }): Promise<{ rows: GscPoint[] }>{
    const q = new URLSearchParams({ start: params.start, end: params.end, dimension: params.dimension, ...(params.target ? { target: params.target } : {}) });
    return http(`${API_BASE}/gsc/performance?${q.toString()}`);
  },
  async listChangelog(): Promise<{ items: ChangelogItem[] }>{
    return http(`${API_BASE}/changelog`);
  },
  async addChangelog(item: { date: string; title: string; note?: string }): Promise<ChangelogItem>{
    return http(`${API_BASE}/changelog`, { method: 'POST', body: JSON.stringify(item) });
  },
  async listTests(): Promise<{ items: TestSummary[] }>{
    return http(`${API_BASE}/tests`);
  },
  async createTest(def: TestDefinition): Promise<{ id: string }>{
    return http(`${API_BASE}/tests`, { method: 'POST', body: JSON.stringify(def) });
  },
  async testResults(id: string): Promise<{ pre: GscPoint[]; post: GscPoint[]; summary?: UpliftSummary }>{
    return http(`${API_BASE}/tests/${id}/results`);
  },
  async ctrOpportunities(params: { start: string; end: string; minImpr?: number; maxCtr?: number }): Promise<{ rows: Array<{ query: string; impressions: number; clicks: number; ctr: number; avgPos: number }> }>{
    const q = new URLSearchParams({ start: params.start, end: params.end, ...(params.minImpr ? { minImpr: String(params.minImpr) } : {}), ...(params.maxCtr ? { maxCtr: String(params.maxCtr) } : {}) });
    return http(`${API_BASE}/insights/ctr-opportunities?${q.toString()}`);
  },
};

// ----------------------------- Utils -----------------------------

function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%`; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(n, max)); }

function dateAdd(d: string, days: number) {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const a = new Date(start + 'T00:00:00').getTime();
  const b = new Date(end + 'T00:00:00').getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1;
}

function summarizeUplift(pre: GscPoint[], post: GscPoint[]): UpliftSummary {
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const preClicks = sum(pre.map(p => p.clicks));
  const postClicks = sum(post.map(p => p.clicks));
  const preImpr = sum(pre.map(p => p.impressions));
  const postImpr = sum(post.map(p => p.impressions));
  const preCtr = preImpr > 0 ? preClicks / preImpr : 0;
  const postCtr = postImpr > 0 ? postClicks / postImpr : 0;
  const prePos = pre.length ? sum(pre.map(p => p.position)) / pre.length : 0;
  const postPos = post.length ? sum(post.map(p => p.position)) / post.length : 0;

  const clicksPct = preClicks ? (postClicks - preClicks) / preClicks : 0;
  const imprPct = preImpr ? (postImpr - preImpr) / preImpr : 0;
  const ctrPct = preCtr ? (postCtr - preCtr) / preCtr : 0;
  const posPct = prePos ? (prePos - postPos) / prePos : 0; // improvement when going down

  // Very rough significance heuristic (NOT a substitute for rigorous stats):
  const sample = Math.min(pre.length, post.length);
  const effect = Math.abs(clicksPct) + Math.abs(ctrPct) * 0.7;
  let significance: UpliftSummary['significance'] = 'low';
  if (sample >= 14 && effect > 0.15) significance = 'medium';
  if (sample >= 21 && effect > 0.30) significance = 'high';

  return {
    clicks: { delta: postClicks - preClicks, pct: clicksPct },
    impressions: { delta: postImpr - preImpr, pct: imprPct },
    ctr: { delta: postCtr - preCtr, pct: ctrPct },
    position: { delta: postPos - prePos, pct: posPct },
    significance,
  };
}

function toChartSeries(pre: GscPoint[], post: GscPoint[]) {
  const map = new Map<string, any>();
  pre.forEach(p => map.set(p.date, { date: p.date, preClicks: p.clicks, preImpr: p.impressions, preCtr: p.ctr * 100 }));
  post.forEach(p => {
    const row = map.get(p.date) || { date: p.date };
    row.postClicks = p.clicks; row.postImpr = p.impressions; row.postCtr = p.ctr * 100;
    map.set(p.date, row);
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function downloadCSV(filename: string, rows: any[]) {
  const keys = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach(k => s.add(k)); return s; }, new Set<string>())) as string[];
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ----------------------------- Subcomponents -----------------------------

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col rounded-2xl border p-4 bg-white/50 dark:bg-zinc-900/50 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-zinc-500 flex items-center gap-2">
        {label}
        {hint && (
          <TooltipProvider>
            <ShadTooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>{hint}</TooltipContent>
            </ShadTooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function DateRangeInputs({ start, end, onChange }:{ start: string; end: string; onChange: (s: string, e: string)=>void }){
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="grid gap-1">
        <Label className="text-xs">Start</Label>
        <Input type="date" value={start} onChange={e=>onChange(e.target.value, end)} />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">End</Label>
        <Input type="date" value={end} onChange={e=>onChange(start, e.target.value)} />
      </div>
    </div>
  );
}

function MetricDelta({ label, delta, pct }:{ label: string; delta: number; pct: number }){
  const pos = pct >= 0; const pctStr = (pct*100).toFixed(1)+"%";
  return (
    <div className="text-sm flex items-center justify-between border rounded-xl px-3 py-2">
      <span className="text-zinc-500">{label}</span>
      <span className={pos ? "text-emerald-600" : "text-rose-600"}>
        {delta.toLocaleString()} ({pctStr})
      </span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }:{ icon: any; title: string; subtitle?: string }){
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-cyan-500/15 border"><Icon className="h-5 w-5"/></div>
      <div>
        <div className="text-lg font-semibold leading-tight">{title}</div>
        {subtitle && <div className="text-sm text-zinc-500 -mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

// ----------------------------- Main Component -----------------------------

export default function SeoTestingMVP(){
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [properties, setProperties] = useState<string[]>([]);

  // Credit system integration
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();
  const { mutate: deductCredits } = useDeductCredits();

  const today = new Date().toISOString().slice(0,10);
  const [preStart, setPreStart] = useState(dateAdd(today, -56));
  const [preEnd, setPreEnd] = useState(dateAdd(today, -29));
  const [postStart, setPostStart] = useState(dateAdd(today, -28));
  const [postEnd, setPostEnd] = useState(dateAdd(today, -1));

  const [scope, setScope] = useState<Scope>('url');
  const [target, setTarget] = useState('');

  const [preData, setPreData] = useState<GscPoint[] | null>(null);
  const [postData, setPostData] = useState<GscPoint[] | null>(null);
  const [summary, setSummary] = useState<UpliftSummary | null>(null);

  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [newChange, setNewChange] = useState<{date: string; title: string; note?: string}>({ date: today, title: '' });

  const [insights, setInsights] = useState<Array<{ query: string; impressions: number; clicks: number; ctr: number; avgPos: number }>>([]);
  const [insightRange, setInsightRange] = useState<{start: string; end: string}>({ start: dateAdd(today, -28), end: today });

  const [creatingTest, setCreatingTest] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [tests, setTests] = useState<TestSummary[]>([]);

  const [controlPattern, setControlPattern] = useState('');
  const [variantPattern, setVariantPattern] = useState('');
  const [splitStart, setSplitStart] = useState(dateAdd(today, -28));
  const [splitEnd, setSplitEnd] = useState(today);

  useEffect(()=>{
    (async ()=>{
      try {
        setLoading(true);
        const st = await API_CLIENT.gscStatus();
        setConnected(!!st.connected);
        setProperties(st.properties || []);
        const ch = await API_CLIENT.listChangelog();
        setChangelog(ch.items || []);
        const t = await API_CLIENT.listTests();
        setTests(t.items || []);
        const ins = await API_CLIENT.ctrOpportunities({ start: insightRange.start, end: insightRange.end, minImpr: 200, maxCtr: 0.02 });
        setInsights(ins.rows || []);
      } catch (e:any){
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const connectGSC = async ()=>{
    try{
      const { url } = await API_CLIENT.gscConnectUrl();
      window.location.href = url;
    }catch(e:any){ setError(e.message); }
  };

  const dimension = scope === 'query' ? 'query' : 'page';

  const runTimeTest = async ()=>{
    setError(null);
    setPreData(null); setPostData(null); setSummary(null);

    // Check plan access (Growth+ for time tests)
    if (!subscription || subscription.plan.name === 'Free' || subscription.plan.name === 'Launch') {
      setError('Time-based tests require Growth plan or higher. Upgrade to access this feature.');
      return;
    }

    // Check credits (15 credits for time test)
    if (!credits || credits.available_credits < 15) {
      setError(`Insufficient credits. Time tests cost 15 credits. You have ${credits?.available_credits || 0} available.`);
      return;
    }

    try{
      // Deduct credits first
      await new Promise((resolve, reject) => {
        deductCredits({
          feature: 'seo_time_test',
          credits: 15,
          metadata: { test_type: 'time', scope, target, pre_period: `${preStart}-${preEnd}`, post_period: `${postStart}-${postEnd}` }
        }, {
          onSuccess: resolve,
          onError: (error) => reject(error)
        });
      });

      const [pre, post] = await Promise.all([
        API_CLIENT.performance({ start: preStart, end: preEnd, dimension: dimension as any, target: target || undefined }),
        API_CLIENT.performance({ start: postStart, end: postEnd, dimension: dimension as any, target: target || undefined })
      ]);
      setPreData(pre.rows);
      setPostData(post.rows);
      setSummary(summarizeUplift(pre.rows, post.rows));
    }catch(e:any){ setError(e.message); }
  };

  const saveChangelog = async ()=>{
    if(!newChange.title) return;
    try{
      const item = await API_CLIENT.addChangelog(newChange);
      setChangelog([item, ...changelog]);
      setNewChange({ date: today, title: '' });
    }catch(e:any){ setError(e.message); }
  };

  const createTimeTestRecord = async ()=>{
    setCreatingTest(true);
    try{
      const def: TimeTestDefinition = { type: 'time', scope, target, preStart, preEnd, postStart, postEnd };
      const { id } = await API_CLIENT.createTest(def);
      setTests([{ id, type: 'time', title: testTitle || `Time Test: ${target || dimension}`, createdAt: new Date().toISOString(), status: 'queued' }, ...tests]);
      setTestTitle('');
    }catch(e:any){ setError(e.message); }
    finally{ setCreatingTest(false); }
  };

  const createSplitTestRecord = async ()=>{
    setCreatingTest(true);
    try{
      const def: SplitTestDefinition = { type: 'split', controlPattern, variantPattern, start: splitStart, end: splitEnd };
      const { id } = await API_CLIENT.createTest(def);
      setTests([{ id, type: 'split', title: testTitle || `Split: A(${controlPattern}) vs B(${variantPattern})`, createdAt: new Date().toISOString(), status: 'queued' }, ...tests]);
      setTestTitle(''); setControlPattern(''); setVariantPattern('');
    }catch(e:any){ setError(e.message); }
    finally{ setCreatingTest(false); }
  };

  const chartData = useMemo(()=> (preData && postData) ? toChartSeries(preData, postData) : [], [preData, postData]);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border flex items-center justify-center">
            <FlaskConical className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xl font-semibold">SEO Testing MVP</div>
            <div className="text-sm text-zinc-500">Time-based and split tests on top of Google Search Console</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">GSC Connected</Badge>
          ) : (
            <Button onClick={connectGSC} className="gap-2"><Link2 className="h-4 w-4"/> Connect GSC</Button>
          )}

          {/* Credits display */}
          {credits && (
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {credits.available_credits} credits
            </Badge>
          )}

          {/* Plan display */}
          {subscription && (
            <Badge variant="outline" className={
              subscription.plan.name === 'Launch' ? 'border-blue-500 text-blue-600' :
              subscription.plan.name === 'Growth' ? 'border-purple-500 text-purple-600' :
              subscription.plan.name === 'Agency' ? 'border-orange-500 text-orange-600' :
              subscription.plan.name === 'Scale' ? 'border-indigo-500 text-indigo-600' :
              'border-zinc-500'
            }>
              {subscription.plan.name} Plan
            </Badge>
          )}

          <Button variant="outline" onClick={()=>window.location.reload()} className="gap-2"><RefreshCw className="h-4 w-4"/>Refresh</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 border rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 p-6 text-zinc-500"><Loader2 className="h-4 w-4 animate-spin"/> Loading…</div>
      ) : (
        <Tabs defaultValue="time" className="">
          <TabsList className="mb-4 grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="time" className="gap-2"><TestTube className="h-4 w-4"/> Time Test</TabsTrigger>
            <TabsTrigger value="split" className="gap-2"><SplitSquareHorizontal className="h-4 w-4"/> Split Test</TabsTrigger>
            <TabsTrigger value="changelog" className="gap-2"><CalendarDays className="h-4 w-4"/> Changelog</TabsTrigger>
            <TabsTrigger value="insights" className="gap-2"><LineChartIcon className="h-4 w-4"/> Insights</TabsTrigger>
          </TabsList>

          {/* Time Test */}
          <TabsContent value="time">
            <Card className="mb-5">
              <CardContent className="p-5">
                <SectionTitle icon={TestTube} title="Run a time-based test" subtitle="Compare pre vs post performance for a page, group or query"/>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Scope</Label>
                    <Select value={scope} onValueChange={(v)=>setScope(v as Scope)}>
                      <SelectTrigger><SelectValue placeholder="Select scope"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">Single URL / Prefix</SelectItem>
                        <SelectItem value="group">Group (pattern)</SelectItem>
                        <SelectItem value="query">Query</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label className="mt-3">{scope === 'query' ? 'Query' : 'URL / Pattern'}</Label>
                    <Input placeholder={scope==='query' ? 'e.g., best seo tools' : 'e.g., /blog/ or ^/category/'} value={target} onChange={e=>setTarget(e.target.value)} />
                  </div>

                  <div className="grid gap-3">
                    <Label>Pre period</Label>
                    <DateRangeInputs start={preStart} end={preEnd} onChange={(s,e)=>{ setPreStart(s); setPreEnd(e); }}/>
                    <div className="text-xs text-zinc-500">{daysBetween(preStart, preEnd)} days</div>
                  </div>

                  <div className="grid gap-3">
                    <Label>Post period</Label>
                    <DateRangeInputs start={postStart} end={postEnd} onChange={(s,e)=>{ setPostStart(s); setPostEnd(e); }}/>
                    <div className="text-xs text-zinc-500">{daysBetween(postStart, postEnd)} days</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button className="gap-2" onClick={runTimeTest}><Rocket className="h-4 w-4"/> Run test</Button>
                  <Input className="max-w-sm" placeholder="Optional: save as test title" value={testTitle} onChange={e=>setTestTitle(e.target.value)} />
                  <Button variant="outline" className="gap-2" disabled={creatingTest} onClick={createTimeTestRecord}>{creatingTest && <Loader2 className="h-4 w-4 animate-spin"/>} Save test</Button>
                </div>
              </CardContent>
            </Card>

            {(preData && postData && summary) && (
              <div className="grid lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2">
                  <CardContent className="p-5">
                    <SectionTitle icon={LineChartIcon} title="Performance over time" subtitle="Pre vs post"/>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="L" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="L" type="monotone" dataKey="preClicks" name="Clicks (pre)" dot={false} />
                          <Line yAxisId="L" type="monotone" dataKey="postClicks" name="Clicks (post)" dot={false} />
                          <Line yAxisId="R" type="monotone" dataKey="preCtr" name="CTR% (pre)" strokeDasharray="4 2" dot={false} />
                          <Line yAxisId="R" type="monotone" dataKey="postCtr" name="CTR% (post)" strokeDasharray="4 2" dot={false} />
                          {/* Changelog reference lines */}
                          {changelog.map(c => (
                            <ReferenceLine key={c.id} x={c.date} label={{ value: c.title, angle: -90, position: 'top', fontSize: 10 }} stroke="#999" strokeDasharray="2 2" />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 grid gap-3">
                    <SectionTitle icon={FlaskConical} title="Uplift summary" subtitle="Auto-computed deltas"/>
                    <MetricDelta label="Clicks" delta={summary.clicks.delta} pct={summary.clicks.pct} />
                    <MetricDelta label="Impressions" delta={summary.impressions.delta} pct={summary.impressions.pct} />
                    <MetricDelta label="CTR" delta={Number((summary.ctr.delta*100).toFixed(2))} pct={summary.ctr.pct} />
                    <MetricDelta label="Avg. Position (improvement)" delta={Number(summary.position.delta.toFixed(2))} pct={summary.position.pct} />
                    <div className="text-xs text-zinc-500">Significance: <Badge variant="outline" className={summary.significance==='high'?'border-emerald-500 text-emerald-600':summary.significance==='medium'?'border-amber-500 text-amber-600':'border-zinc-300'}>{summary.significance.toUpperCase()}</Badge></div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent tests */}
            <Card className="mt-5">
              <CardContent className="p-5">
                <SectionTitle icon={TestTube} title="Saved tests" subtitle="Recently created"/>
                {tests.length === 0 ? (
                  <div className="text-sm text-zinc-500">No tests yet.</div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tests.slice(0,6).map(t => (
                      <div key={t.id} className="border rounded-xl p-3">
                        <div className="text-sm font-medium truncate" title={t.title}>{t.title}</div>
                        <div className="text-xs text-zinc-500 mt-1">{new Date(t.createdAt).toLocaleString()}</div>
                        <div className="mt-2"><Badge variant="outline">{t.type}</Badge> <Badge className={t.status==='completed'?"bg-emerald-600":"bg-indigo-600"}>{t.status}</Badge></div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={async()=>{
                            try{ const r = await API_CLIENT.testResults(t.id); setPreData(r.pre); setPostData(r.post); setSummary(r.summary || summarizeUplift(r.pre, r.post)); }catch(e:any){ setError(e.message); }
                          }}>View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Split Test */}
          <TabsContent value="split">
            <Card>
              <CardContent className="p-5">
                <SectionTitle icon={SplitSquareHorizontal} title="Create a split test" subtitle="Compare control vs variant URL groups over the same period"/>
                {subscription?.plan.name === 'Free' || subscription?.plan.name === 'Launch' ? (
                  <div className="text-center py-8">
                    <div className="text-zinc-500 mb-4">Split testing requires Agency plan or higher</div>
                    <Button onClick={() => window.location.href = '/dashboard?tab=subscription'} className="gap-2">
                      <Rocket className="h-4 w-4" />
                      Upgrade to Agency Plan
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Control pattern</Label>
                    <Input placeholder="e.g., ^/category-a/ or list:groupA" value={controlPattern} onChange={e=>setControlPattern(e.target.value)} />
                    <Label className="mt-3">Variant pattern</Label>
                    <Input placeholder="e.g., ^/category-b/ or list:groupB" value={variantPattern} onChange={e=>setVariantPattern(e.target.value)} />
                  </div>
                  <div className="grid gap-3">
                    <Label>Start / End</Label>
                    <DateRangeInputs start={splitStart} end={splitEnd} onChange={(s,e)=>{ setSplitStart(s); setSplitEnd(e); }}/>
                    <div className="text-xs text-zinc-500">{daysBetween(splitStart, splitEnd)} days</div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Test title</Label>
                    <Input placeholder="Optional title" value={testTitle} onChange={e=>setTestTitle(e.target.value)} />
                    <Button className="mt-2 gap-2" disabled={creatingTest} onClick={createSplitTestRecord}>{creatingTest && <Loader2 className="h-4 w-4 animate-spin"/>} Save split test</Button>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Changelog */}
          <TabsContent value="changelog">
            <div className="grid md:grid-cols-3 gap-5">
              <Card className="md:col-span-2">
                <CardContent className="p-5">
                  <SectionTitle icon={CalendarDays} title="Site Changelog" subtitle="What changed and when"/>
                  <div className="grid gap-3">
                    {changelog.length === 0 && <div className="text-sm text-zinc-500">No entries yet.</div>}
                    {changelog.map(c => (
                      <div key={c.id} className="border rounded-xl p-3">
                        <div className="text-sm font-medium">{c.title}</div>
                        <div className="text-xs text-zinc-500">{c.date}</div>
                        {c.note && <div className="text-sm mt-1 whitespace-pre-wrap">{c.note}</div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 grid gap-3">
                  <SectionTitle icon={Plus} title="Add entry"/>
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input type="date" value={newChange.date} onChange={e=>setNewChange({...newChange, date: e.target.value})} />
                    <Label>Title</Label>
                    <Input placeholder="e.g., Deployed new title templates" value={newChange.title} onChange={e=>setNewChange({...newChange, title: e.target.value})} />
                    <Label>Note (optional)</Label>
                    <Textarea rows={5} placeholder="Details, tickets, links…" value={newChange.note || ''} onChange={e=>setNewChange({...newChange, note: e.target.value})} />
                    <Button className="mt-2" onClick={saveChangelog}><CheckCircle2 className="h-4 w-4 mr-2"/>Save</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights">
            <Card>
              <CardContent className="p-5">
                <SectionTitle icon={LineChartIcon} title="CTR Opportunities" subtitle="High impressions, low CTR queries"/>
                {subscription?.plan.name === 'Free' ? (
                  <div className="text-center py-8">
                    <div className="text-zinc-500 mb-4">CTR Opportunities analysis requires a paid plan</div>
                    <Button onClick={() => window.location.href = '/dashboard?tab=subscription'} className="gap-2">
                      <Rocket className="h-4 w-4" />
                      Upgrade to Access
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="md:col-span-2 grid grid-cols-2 gap-3">
                        <DateRangeInputs start={insightRange.start} end={insightRange.end} onChange={(s,e)=>setInsightRange({ start: s, end: e })} />
                        <Button variant="outline" className="gap-2" onClick={async()=>{
                          // Check credits (5 credits for insights)
                          if (!credits || credits.available_credits < 5) {
                            setError(`Insufficient credits. CTR analysis costs 5 credits. You have ${credits?.available_credits || 0} available.`);
                            return;
                          }

                          try{
                            // Deduct credits first
                            await new Promise((resolve, reject) => {
                              deductCredits({
                                feature: 'seo_ctr_opportunities',
                                credits: 5,
                                metadata: { date_range: `${insightRange.start}-${insightRange.end}` }
                              }, {
                                onSuccess: resolve,
                                onError: (error) => reject(error)
                              });
                            });

                            const ins = await API_CLIENT.ctrOpportunities({ start: insightRange.start, end: insightRange.end, minImpr: 200, maxCtr: 0.02 });
                            setInsights(ins.rows || []);
                          }catch(e:any){ setError(e.message); }
                        }}><RefreshCw className="h-4 w-4"/> Refresh (5 credits)</Button>
                      </div>
                      <div className="flex items-end"><Button variant="outline" className="gap-2 w-full" onClick={()=>downloadCSV(`ctr-opportunities-${insightRange.start}-${insightRange.end}.csv`, insights)}><Download className="h-4 w-4"/>Export CSV</Button></div>
                    </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">Query</th>
                        <th className="py-2 pr-4">Impressions</th>
                        <th className="py-2 pr-4">Clicks</th>
                        <th className="py-2 pr-4">CTR</th>
                        <th className="py-2 pr-4">Avg. Pos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.map((r, i) => (
                        <tr key={i} className="border-b hover:bg-zinc-50/50">
                          <td className="py-2 pr-4 max-w-[420px] truncate" title={r.query}>{r.query}</td>
                          <td className="py-2 pr-4">{r.impressions.toLocaleString()}</td>
                          <td className="py-2 pr-4">{r.clicks.toLocaleString()}</td>
                          <td className="py-2 pr-4">{fmtPct(r.ctr)}</td>
                          <td className="py-2 pr-4">{r.avgPos.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
