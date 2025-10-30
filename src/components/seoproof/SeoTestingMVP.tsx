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
import { Loader2, FlaskConical, LineChart as LineChartIcon, Plus, AlertCircle, CheckCircle2, BarChart3, X } from 'lucide-react';
import { useSubscription, useCredits, useDeductCredits } from "@/hooks/useSubscription";
import { toast } from 'sonner';
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

type TestRun = {
  id: string;
  user_id: string;
  target_url: string;
  changes_made: string[]; // What was changed (meta title, meta desc, etc.)
  keywords_to_track: string[]; // Keywords to monitor
  test_duration_days: number; // Usually 14
  started_at: string;
  status: 'running' | 'completed' | 'paused';
  baseline_data: GscPoint[]; // Pre-change data
  daily_data: GscPoint[]; // Daily tracking data
  final_results?: {
    clicks_change: number;
    impressions_change: number;
    ctr_change: number;
    position_change: number;
    keyword_improvements: Array<{
      keyword: string;
      position_change: number;
      clicks_change: number;
    }>;
  };
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

// Supabase client for direct database access
import { supabase } from '@/integrations/supabase/client';
import { getGoogleToken } from '../../../supabase/functions/_shared/get-google-token';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credit system integration
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();
  const { mutate: deductCredits } = useDeductCredits();

  // Test creation state
  const [targetUrl, setTargetUrl] = useState('');
  const [changesMade, setChangesMade] = useState<string[]>([]);
  const [keywordsToTrack, setKeywordsToTrack] = useState<string[]>([]);
  const [testDuration, setTestDuration] = useState(14);

  // Current tests
  const [currentTests, setCurrentTests] = useState<TestRun[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestRun | null>(null);

  // Form state
  const [newChange, setNewChange] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('seo_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCurrentTests(data || []);
    } catch (err: any) {
      console.error('Failed to load tests:', err);
    }
  };

  const startNewTest = async () => {
    if (!targetUrl || changesMade.length === 0) {
      setError('Please fill in target URL and at least one change');
      return;
    }

    // Check plan access (Growth+ required)
    if (!subscription || subscription.plan.name === 'Free' || subscription.plan.name === 'Launch') {
      setError('SEO testing requires Growth plan or higher. Upgrade to access this feature.');
      return;
    }

    // Check credits (20 credits for automated testing)
    if (!credits || credits.available_credits < 20) {
      setError(`Insufficient credits. Automated testing costs 20 credits. You have ${credits?.available_credits || 0} available.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Deduct credits
      await new Promise((resolve, reject) => {
        deductCredits({
          feature: 'seo_automated_test',
          credits: 20,
          metadata: {
            target_url: targetUrl,
            changes_made: changesMade,
            keywords_to_track: keywordsToTrack,
            test_duration_days: testDuration
          }
        }, {
          onSuccess: resolve,
          onError: (error) => reject(error)
        });
      });

      // Get baseline data (last 7 days before changes)
      const baselineEnd = new Date().toISOString().slice(0, 10);
      const baselineStart = dateAdd(baselineEnd, -7);

      // For now, create the test record - actual data collection will be done by a scheduled function
      const { data: testRecord, error: insertError } = await supabase
        .from('seo_tests')
        .insert({
          user_id: user.id,
          type: 'time',
          title: `Testing: ${targetUrl}`,
          definition: {
            target_url: targetUrl,
            changes_made: changesMade,
            keywords_to_track: keywordsToTrack,
            test_duration_days: testDuration,
            baseline_start: baselineStart,
            baseline_end: baselineEnd
          },
          status: 'running'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Reset form
      setTargetUrl('');
      setChangesMade([]);
      setKeywordsToTrack([]);

      // Reload tests
      await loadTests();

      toast.success('SEO test started! We\'ll track performance for the next 14 days.');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addChange = () => {
    if (newChange.trim()) {
      setChangesMade([...changesMade, newChange.trim()]);
      setNewChange('');
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setKeywordsToTrack([...keywordsToTrack, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeChange = (index: number) => {
    setChangesMade(changesMade.filter((_, i) => i !== index));
  };

  const removeKeyword = (index: number) => {
    setKeywordsToTrack(keywordsToTrack.filter((_, i) => i !== index));
  };

  const viewTestResults = (test: TestRun) => {
    setSelectedTest(test);
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-500/15 to-emerald-500/15 border flex items-center justify-center">
            <FlaskConical className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xl font-semibold">SERPProof - Automated SEO Testing</div>
            <div className="text-sm text-zinc-500">Track SEO changes and measure performance impact over time</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600 hover:bg-emerald-600">GSC Connected</Badge>

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
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 border rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4"/> {error}
        </div>
      )}

      <Tabs defaultValue="create" className="">
        <TabsList className="mb-4 grid grid-cols-2 w-full md:w-auto">
          <TabsTrigger value="create" className="gap-2"><Plus className="h-4 w-4"/> Start New Test</TabsTrigger>
          <TabsTrigger value="results" className="gap-2"><LineChartIcon className="h-4 w-4"/> View Results</TabsTrigger>
        </TabsList>
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <SectionTitle icon={Plus} title="Start New SEO Test" subtitle="Track the impact of your SEO changes over time"/>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Target URL</Label>
                    <Input
                      placeholder="https://example.com/page"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">The page you're making SEO changes to</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Changes Made</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., Updated meta title, added keyword"
                        value={newChange}
                        onChange={(e) => setNewChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addChange()}
                      />
                      <Button onClick={addChange} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {changesMade.map((change, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <span>{change}</span>
                          <Button
                            onClick={() => removeChange(index)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Keywords to Track</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., best seo tools"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <Button onClick={addKeyword} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {keywordsToTrack.map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <span>{keyword}</span>
                          <Button
                            onClick={() => removeKeyword(index)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Test Duration</Label>
                    <Select value={testDuration.toString()} onValueChange={(value) => setTestDuration(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="21">21 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={startNewTest}
                    disabled={loading || !targetUrl || changesMade.length === 0}
                    className="w-full gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Start {testDuration}-Day Test (20 credits)
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h3>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      <li>1. Enter the URL you're optimizing</li>
                      <li>2. List the changes you're making</li>
                      <li>3. Add keywords to track performance</li>
                      <li>4. We'll collect baseline data for 7 days</li>
                      <li>5. Monitor performance for {testDuration} days after changes</li>
                      <li>6. Get detailed before/after analysis</li>
                    </ol>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Requirements:</h3>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                      <li>• Growth plan or higher</li>
                      <li>• 20 credits available</li>
                      <li>• GSC property with the target URL</li>
                      <li>• At least one change described</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <SectionTitle icon={LineChartIcon} title="Test Results" subtitle="View performance impact of your SEO changes"/>
              {currentTests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tests yet. Start your first SEO test to see results here.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{test.title}</h3>
                        <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                          {test.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{test.target_url}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Started: {new Date(test.started_at).toLocaleDateString()}</span>
                        <span>Duration: {test.test_duration_days} days</span>
                        <Button size="sm" onClick={() => viewTestResults(test)}>
                          View Results
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTest && selectedTest.final_results && (
            <Card>
              <CardContent className="p-6">
                <SectionTitle icon={BarChart3} title="Detailed Results" subtitle={`Performance analysis for ${selectedTest.target_url}`}/>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedTest.final_results.clicks_change > 0 ? '+' : ''}
                      {selectedTest.final_results.clicks_change}
                    </div>
                    <div className="text-sm text-muted-foreground">Clicks Change</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedTest.final_results.impressions_change > 0 ? '+' : ''}
                      {selectedTest.final_results.impressions_change}
                    </div>
                    <div className="text-sm text-muted-foreground">Impressions Change</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedTest.final_results.ctr_change > 0 ? '+' : ''}
                      {selectedTest.final_results.ctr_change.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground">CTR Change</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Keyword Performance</h4>
                  {selectedTest.final_results.keyword_improvements.map((kw, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">{kw.keyword}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Position: {kw.position_change > 0 ? '+' : ''}{kw.position_change}</span>
                        <span>Clicks: {kw.clicks_change > 0 ? '+' : ''}{kw.clicks_change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
