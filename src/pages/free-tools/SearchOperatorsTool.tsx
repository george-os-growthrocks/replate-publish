import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Search, Copy, ExternalLink, Plus, X, Trash2, CheckCircle2, Zap, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { RelatedToolsSection } from "@/components/free-tools/RelatedToolsSection";
import { getRelatedTools } from "@/lib/free-tools-data";
import { ToolSEOSection } from "@/components/seo/ToolSEOSection";

interface OperatorRow {
  id: string;
  key: string;
  value: string;
}

const OPERATOR_OPTIONS = [
  { value: "site", label: "site:", desc: "Restrict to domain/subdomain/path" },
  { value: "inurl", label: "inurl:", desc: "Term in URL path" },
  { value: "allinurl", label: "allinurl:", desc: "All terms in URL" },
  { value: "intitle", label: "intitle:", desc: "Term in <title>" },
  { value: "allintitle", label: "allintitle:", desc: "All terms in <title>" },
  { value: "intext", label: "intext:", desc: "Term in body text" },
  { value: "allintext", label: "allintext:", desc: "All terms in body text" },
  { value: "filetype", label: "filetype:", desc: "Restrict by file extension" },
  { value: "ext", label: "ext:", desc: "Alias for filetype:" },
  { value: "quoted", label: '"phrase"', desc: "Exact phrase match" },
  { value: "exclude", label: "-term", desc: "Exclude a term" },
  { value: "or", label: "OR", desc: "Either X or Y" },
  { value: "group", label: "(group)", desc: "Group logic" },
  { value: "after", label: "after:", desc: "Results after date (YYYY-MM-DD)" },
  { value: "before", label: "before:", desc: "Results before date" },
  { value: "define", label: "define:", desc: "Definitions" },
  { value: "cache", label: "cache:", desc: "View Google's cached copy" },
  { value: "related", label: "related:", desc: "Sites similar to domain" },
];

const uid = () => Math.random().toString(36).substr(2, 9);

export default function SearchOperatorsTool() {
  const [rows, setRows] = useState<OperatorRow[]>([]);
  const [host, setHost] = useState("google.com");
  const [hl, setHl] = useState("en");
  const [gl, setGl] = useState("us");
  const [num, setNum] = useState("10");
  const [verbatim, setVerbatim] = useState(false);
  const [safe, setSafe] = useState("off");
  const [variants, setVariants] = useState<Array<{ id: string; label: string; query: string }>>([]);
  const [presets, setPresets] = useState<Array<{ id: string; name: string; rows: OperatorRow[] }>>([]);
  const [presetName, setPresetName] = useState("");

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("search-operator-presets");
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  // Load state from URL hash
  useEffect(() => {
    if (window.location.hash) {
      try {
        const state = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
        if (state.rows) setRows(state.rows);
        if (state.host) setHost(state.host);
        if (state.hl) setHl(state.hl);
        if (state.gl) setGl(state.gl);
      } catch (e) {
        // Invalid hash, ignore
      }
    }
  }, []);

  const buildQuery = useMemo(() => {
    const parts: string[] = [];
    rows.forEach((row) => {
      switch (row.key) {
        case "quoted":
          parts.push(`"${row.value}"`);
          break;
        case "exclude":
          parts.push(`-${row.value}`);
          break;
        case "or":
          parts.push(row.value.includes(",") ? `(${row.value})` : row.value);
          break;
        case "group":
          parts.push(`(${row.value})`);
          break;
        case "site":
        case "inurl":
        case "allinurl":
        case "intitle":
        case "allintitle":
        case "intext":
        case "allintext":
        case "filetype":
        case "ext":
        case "after":
        case "before":
        case "define":
        case "cache":
        case "related":
          parts.push(`${row.key}:${row.value}`);
          break;
        default:
          parts.push(row.value);
      }
    });
    return parts.join(" ").trim();
  }, [rows]);

  const buildGoogleUrl = (query: string, params: any) => {
    const base = `https://www.${params.host}/search`;
    const urlParams = new URLSearchParams({
      q: query,
      hl: params.hl,
      gl: params.gl,
      num: params.num,
      safe: params.safe,
    });
    if (params.verbatim) urlParams.append("tbs", "li:1");
    return `${base}?${urlParams.toString()}`;
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const share = () => {
    const state = { rows, host, hl, gl };
    const hash = encodeURIComponent(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    copy(url);
    toast.success("Shareable link copied!");
  };

  const addRow = () => {
    setRows([...rows, { id: uid(), key: "", value: "" }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: "key" | "value", val: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const makeVariants = () => {
    if (!buildQuery) {
      toast.error("Build a query first");
      return;
    }

    const topic = rows.find((r) => r.key === "intext" || r.key === "quoted")?.value || "topic";
    const domain = rows.find((r) => r.key === "site")?.value || "example.com";

    setVariants([
      {
        id: uid(),
        label: "Resources / Lists",
        query: `${topic} (intitle:resources OR inurl:resources) -site:${domain}`,
      },
      {
        id: uid(),
        label: "Pricing / Cost",
        query: `intitle:pricing ${topic} OR "how much does * cost"`,
      },
      {
        id: uid(),
        label: "Recent Content",
        query: `${buildQuery} after:2024-01-01`,
      },
      {
        id: uid(),
        label: "Comparison",
        query: `intitle:"${topic} vs" OR intitle:"vs ${topic}"`,
      },
      {
        id: uid(),
        label: "Guide / Tutorial",
        query: `intitle:guide ${topic} OR intitle:tutorial ${topic}`,
      },
    ]);
  };

  const savePreset = () => {
    if (!presetName.trim() || rows.length === 0) {
      toast.error("Enter a name and add operators");
      return;
    }
    const newPreset = {
      id: uid(),
      name: presetName,
      rows: [...rows],
    };
    const updated = [...presets, newPreset].slice(-50);
    setPresets(updated);
    localStorage.setItem("search-operator-presets", JSON.stringify(updated));
    setPresetName("");
    toast.success("Preset saved!");
  };

  const loadPreset = (preset: typeof presets[0]) => {
    setRows(preset.rows);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  return (
    <>
      <Helmet>
        <title>Free Search Operators Builder - Google Search Query Generator | AnotherSEOGuru</title>
        <meta
          name="description"
          content="Build advanced Google search queries with visual operator composer. Create site:, intitle:, inurl:, filetype: queries instantly. Free SEO tool with copy, share, and recipes."
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/search-operators" />
        <meta property="og:title" content="Free Search Operators Builder Tool" />
        <meta property="og:description" content="Visual Google search operator builder. Create advanced queries for SEO research." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Free Tool - No Signup Required
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                Free <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Search Operators Builder</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Build advanced Google search queries visually. Combine operators like <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">site:</code>, <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">intitle:</code>, <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">filetype:</code> to create powerful SEO research queries.
              </p>
            </div>

            {/* Main Tool */}
            <div className="grid lg:grid-cols-3 gap-6 mb-12">
              {/* Builder Panel */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    Operator Builder
                  </CardTitle>
                  <CardDescription>
                    Add operators to build your search query
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rows */}
                  {rows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Add operators below to build your query</p>
                    </div>
                  ) : (
                    rows.map((row) => (
                      <div key={row.id} className="flex gap-2 items-start p-4 rounded-lg border border-border bg-muted/30">
                        <Select
                          value={row.key}
                          onValueChange={(val) => updateRow(row.id, "key", val)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATOR_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div>
                                  <div className="font-medium">{opt.label}</div>
                                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={row.value}
                          onChange={(e) => updateRow(row.id, "value", e.target.value)}
                          placeholder="Enter value..."
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}

                  <Button onClick={addRow} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Operator
                  </Button>

                  {/* Query Preview */}
                  {buildQuery && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Generated Query</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copy(buildQuery)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={share}
                            >
                              Share Link
                            </Button>
                          </div>
                        </div>
                        <code className="block p-3 rounded bg-background border text-sm break-all">
                          {buildQuery}
                        </code>
                        <Button
                          className="w-full mt-3"
                          asChild
                        >
                          <a
                            href={buildGoogleUrl(buildQuery, { host, hl, gl, num, verbatim, safe })}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Google
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Settings & Variants */}
              <div className="space-y-4">
                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Google Host</Label>
                      <Select value={host} onValueChange={setHost}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google.com">google.com</SelectItem>
                          <SelectItem value="google.co.uk">google.co.uk</SelectItem>
                          <SelectItem value="google.de">google.de</SelectItem>
                          <SelectItem value="google.fr">google.fr</SelectItem>
                          <SelectItem value="google.es">google.es</SelectItem>
                          <SelectItem value="google.it">google.it</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Language (hl)</Label>
                      <Input value={hl} onChange={(e) => setHl(e.target.value)} placeholder="en" />
                    </div>
                    <div>
                      <Label>Country (gl)</Label>
                      <Input value={gl} onChange={(e) => setGl(e.target.value)} placeholder="us" />
                    </div>
                    <div>
                      <Label>Results per page</Label>
                      <Select value={num} onValueChange={setNum}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="verbatim"
                        checked={verbatim}
                        onChange={(e) => setVerbatim(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="verbatim" className="cursor-pointer">
                        Verbatim mode
                      </Label>
                    </div>
                    <div>
                      <Label>SafeSearch</Label>
                      <Select value={safe} onValueChange={setSafe}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Variants */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Variants Generator</CardTitle>
                      <Button size="sm" onClick={makeVariants}>
                        Generate
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {variants.length > 0 ? (
                      <div className="space-y-2">
                        {variants.map((v) => (
                          <div key={v.id} className="p-3 rounded-lg border border-border bg-muted/30">
                            <div className="text-xs font-medium mb-1">{v.label}</div>
                            <code className="text-xs block mb-2 break-all">{v.query}</code>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copy(v.query)}
                                className="text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                asChild
                                className="text-xs"
                              >
                                <a
                                  href={buildGoogleUrl(v.query, { host, hl, gl, num, verbatim, safe })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Open
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click Generate to create query variants</p>
                    )}
                  </CardContent>
                </Card>

                {/* Presets */}
                {presets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Saved Presets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {presets.map((p) => (
                        <Button
                          key={p.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => loadPreset(p)}
                        >
                          {p.name}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Recipes */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  One-click Recipes
                </CardTitle>
                <CardDescription>
                  Pre-built queries for common SEO tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <RecipeCard
                    title="Find gated PDFs leaking"
                    onClick={() => {
                      setRows([
                        { id: uid(), key: "site", value: "yourdomain.com" },
                        { id: uid(), key: "filetype", value: "pdf" },
                        { id: uid(), key: "or", value: '"white paper", ebook, "case study"' },
                      ]);
                    }}
                  >
                    site: + filetype:pdf + OR group for typical gated terms.
                  </RecipeCard>

                  <RecipeCard
                    title="Internal-link targets"
                    onClick={() => {
                      setRows([
                        { id: uid(), key: "site", value: "yourdomain.com" },
                        { id: uid(), key: "intext", value: "target anchor" },
                        { id: uid(), key: "exclude", value: "/target-url/" },
                      ]);
                    }}
                  >
                    Discover unlinked mentions to link to your money page.
                  </RecipeCard>

                  <RecipeCard
                    title="Resource pages (link ops)"
                    onClick={() => {
                      setRows([
                        { id: uid(), key: "quoted", value: "{topic}" },
                        { id: uid(), key: "group", value: "intitle:resources OR inurl:resources" },
                      ]);
                    }}
                  >
                    Curated lists that actually link out.
                  </RecipeCard>

                  <RecipeCard
                    title='Exclude brand from "best" lists'
                    onClick={() => {
                      setRows([
                        { id: uid(), key: "quoted", value: "best {category}" },
                        { id: uid(), key: "exclude", value: "yourbrand" },
                        { id: uid(), key: "after", value: "2024-01-01" },
                      ]);
                    }}
                  >
                    Outreach hit list for parity coverage.
                  </RecipeCard>
                </div>
              </CardContent>
            </Card>

            {/* Save Preset */}
            {rows.length > 0 && (
              <Card className="mb-12">
                <CardHeader>
                  <CardTitle className="text-lg">Save as Preset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Preset name..."
                      className="flex-1"
                    />
                    <Button onClick={savePreset}>Save</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Tools */}
            <RelatedToolsSection tools={getRelatedTools("search-operators")} />

            {/* SEO Content */}
            <ToolSEOSection
              toolName="Search Operators Builder"
              toolDescription="Free visual Google search operator builder for SEO research. Create advanced queries with site:, intitle:, inurl:, filetype: operators instantly."
              toolUrl="/free-tools/search-operators"
            />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

function RecipeCard({
  title,
  children,
  onClick,
}: {
  title: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all bg-card"
    >
      <div className="text-sm font-semibold mb-1 text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground">{children}</div>
    </button>
  );
}
