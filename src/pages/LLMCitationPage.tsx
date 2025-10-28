import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFilters } from "@/contexts/FilterContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Eye, 
  Users, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Plus,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface LLMStats {
  model: string;
  citationRate: number;
  avgPosition: number;
  totalCitations: number;
  totalQueries: number;
  trend: number;
}

interface CitationResult {
  id: string;
  query: string;
  llm_model: string;
  is_cited: boolean;
  citation_position: number | null;
  citation_context: string | null;
  tracked_date: string;
  competitors_cited: string[];
  full_response?: string | null;
}

interface Competitor {
  competitor_domain: string;
  total_mentions: number;
  avg_position: number;
}

const LLM_MODELS = [
  { 
    id: "chatgpt", 
    name: "ChatGPT", 
    logo: "/assets/openai.webp",
    color: "from-green-500 to-emerald-600" 
  },
  { 
    id: "claude", 
    name: "Claude", 
    logo: "/assets/Claude_A.png",
    color: "from-purple-500 to-violet-600" 
  },
  { 
    id: "gemini", 
    name: "Gemini", 
    logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    color: "from-blue-500 to-cyan-600" 
  },
  { 
    id: "perplexity", 
    name: "Perplexity", 
    logo: "/assets/perplexity.png",
    color: "from-orange-500 to-amber-600" 
  },
];

export default function LLMCitationPage() {
  const { propertyUrl: selectedProperty } = useFilters();
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [stats, setStats] = useState<LLMStats[]>([]);
  const [citations, setCitations] = useState<CitationResult[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  
  // Query input
  const [queryInput, setQueryInput] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(["gemini"]);
  
  // Get domain from URL
  const domain = selectedProperty?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "";

  useEffect(() => {
    if (selectedProperty) {
      loadData();
    }
  }, [selectedProperty]);

  const loadData = async () => {
    if (!selectedProperty) return;

    setLoading(true);
    try {
      // Get user first
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error("Please sign in to continue");
        setLoading(false);
        return;
      }

      // Normalize URL for consistent matching
      const normalizeUrl = (url: string): string => {
        try {
          if (url.startsWith('sc-domain:')) {
            return url.replace('sc-domain:', '').replace('www.', '');
          }
          const urlObj = new URL(url);
          return urlObj.hostname.replace('www.', '');
        } catch {
          return url.replace('www.', '');
        }
      };

      const normalizedProperty = normalizeUrl(selectedProperty);
      console.log("🔍 Looking for project with normalized URL:", normalizedProperty);

      // Get all user projects and find matching one
      const { data: allProjects, error: allError } = await supabase
        .from("seo_projects")
        .select("id, url")
        .eq("user_id", session.session.user.id);

      if (allError) {
        console.error("❌ Error fetching projects:", allError);
      }

      console.log("📊 All user projects:", allProjects);

      // Find matching project by normalized URL
      let project = allProjects?.find(p => {
        const normalizedProjectUrl = normalizeUrl(p.url);
        return normalizedProjectUrl === normalizedProperty;
      });

      if (!project) {
        console.log("🆕 Creating new project for:", selectedProperty);
        
        // Create clean URL for storage
        let cleanUrl = selectedProperty;
        let projectName = selectedProperty;
        
        try {
          if (selectedProperty.startsWith('sc-domain:')) {
            const domain = selectedProperty.replace('sc-domain:', '');
            cleanUrl = 'https://' + domain;
            projectName = domain;
          } else {
            const url = new URL(selectedProperty);
            cleanUrl = url.origin;
            projectName = url.hostname;
          }
        } catch (e) {
          console.error("URL parsing error:", e);
        }

        const { data: newProject, error: createError } = await supabase
          .from("seo_projects")
          .insert({
            url: cleanUrl,
            user_id: session.session.user.id,
            name: projectName,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("❌ Error creating project:", createError);
          toast.error("Failed to create project: " + (createError.message || "Unknown error"));
          setLoading(false);
          return;
        }

        project = newProject;
        console.log("✅ Project created:", project);
        toast.success("Project created! You can now track LLM citations.");
      } else {
        console.log("✅ Found existing project:", project);
      }

      const projectId = project.id;

      // Get recent trends
      const { data: trendsData, error: trendsError } = await supabase.functions.invoke(
        "llm-citation-tracker",
        {
          body: {
            action: "get_trends",
            project_id: projectId,
          },
        }
      );

      if (trendsError) throw trendsError;

      // Calculate stats for each model
      const modelStats: LLMStats[] = LLM_MODELS.map((model) => {
        const modelTrends = (trendsData.data || [])
          .filter((t: any) => t.llm_model === model.id)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const latest = modelTrends[0];
        const previous = modelTrends[1];

        return {
          model: model.id,
          citationRate: latest?.citation_rate || 0,
          avgPosition: latest?.avg_position || 0,
          totalCitations: latest?.total_citations || 0,
          totalQueries: latest?.total_queries_tracked || 0,
          trend: latest && previous ? latest.citation_rate - previous.citation_rate : 0,
        };
      });

      setStats(modelStats);

      // Get recent citations with full_response
      const { data: citationsData, error: citationsError } = await supabase
        .from("llm_citations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (citationsError) {
        console.error("Error fetching citations:", citationsError);
      } else {
        console.log("📊 Fetched citations:", citationsData);
        setCitations(citationsData || []);
      }

      // Get competitors
      const { data: competitorsData, error: competitorsError } = await supabase.functions.invoke(
        "llm-citation-tracker",
        {
          body: {
            action: "get_competitors",
            project_id: projectId,
          },
        }
      );

      if (competitorsError) throw competitorsError;
      setCompetitors(competitorsData.data || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!selectedProperty || !queryInput.trim()) {
      toast.error("Please enter a query to track");
      return;
    }

    if (selectedModels.length === 0) {
      toast.error("Please select at least one LLM model");
      return;
    }

    setTracking(true);
    try {
      // Get user first
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error("Please sign in to continue");
        setTracking(false);
        return;
      }

      // Normalize URL helper (same as loadData)
      const normalizeUrl = (url: string): string => {
        try {
          if (url.startsWith('sc-domain:')) {
            return url.replace('sc-domain:', '').replace('www.', '');
          }
          const urlObj = new URL(url);
          return urlObj.hostname.replace('www.', '');
        } catch {
          return url.replace('www.', '');
        }
      };

      const normalizedProperty = normalizeUrl(selectedProperty);

      // Get all user projects and find matching one
      const { data: allProjects } = await supabase
        .from("seo_projects")
        .select("id, url")
        .eq("user_id", session.session.user.id);

      let project = allProjects?.find(p => {
        const normalizedProjectUrl = normalizeUrl(p.url);
        return normalizedProjectUrl === normalizedProperty;
      });

      // If project doesn't exist, create it
      if (!project) {
        // Create clean URL for storage
        let cleanUrl = selectedProperty;
        let projectName = selectedProperty;
        
        try {
          if (selectedProperty.startsWith('sc-domain:')) {
            const domain = selectedProperty.replace('sc-domain:', '');
            cleanUrl = 'https://' + domain;
            projectName = domain;
          } else {
            const url = new URL(selectedProperty);
            cleanUrl = url.origin;
            projectName = url.hostname;
          }
        } catch (e) {
          console.error("URL parsing error:", e);
        }

        const { data: newProject, error: createError } = await supabase
          .from("seo_projects")
          .insert({
            url: cleanUrl,
            user_id: session.session.user.id,
            name: projectName,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("❌ Error creating project:", createError);
          toast.error("Failed to create project: " + (createError.message || "Unknown error"));
          setTracking(false);
          return;
        }

        project = newProject;
        console.log("✅ Project created:", project);
        toast.success("Project created! You can now track LLM citations.");
      }

      const queries = queryInput.split("\n").filter((q) => q.trim());
      
      // Get clean domain for tracking
      let domain = selectedProperty;
      try {
        if (selectedProperty.startsWith('sc-domain:')) {
          domain = selectedProperty.replace('sc-domain:', '');
        } else {
          domain = new URL(selectedProperty).hostname;
        }
      } catch (e) {
        console.error("Domain parsing error:", e);
      }

      toast.info(`Tracking ${queries.length} ${queries.length === 1 ? "query" : "queries"} across ${selectedModels.length} LLM${selectedModels.length === 1 ? "" : "s"}...`);

      const { data, error } = await supabase.functions.invoke("llm-citation-tracker", {
        body: {
          action: "track",
          project_id: project.id,
          domain,
          queries,
          models: selectedModels,
        },
      });

      if (error) throw error;

      const results = data.results || [];
      const successful = results.filter((r: any) => r.success).length;
      const cited = results.filter((r: any) => r.success && r.is_cited).length;

      toast.success(`Tracked ${successful} queries. You were cited in ${cited} responses! 🎉`);

      // Reload data
      loadData();
      setQueryInput("");
    } catch (error: any) {
      console.error("Error tracking:", error);
      toast.error(error.message || "Failed to track citations");
    } finally {
      setTracking(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  };

  if (!selectedProperty) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a property from the dropdown above to track LLM citations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            LLM Citation Tracker
          </h1>
          <p className="text-muted-foreground">
            Track if your domain appears in ChatGPT, Claude, Gemini, and Perplexity responses
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">Tracking:</span> <span className="font-semibold text-foreground">{domain}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('=== LLM CITATION DEBUG ===');
              console.log('Selected Property:', selectedProperty);
              console.log('Stats:', stats);
              console.log('Citations:', citations);
              console.log('Competitors:', competitors);
              console.log('Loading:', loading);
              console.log('Tracking:', tracking);
              console.log('Query Input:', queryInput);
              console.log('Selected Models:', selectedModels);
              toast.success('Debug info logged to console. Press F12 to view.');
            }}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Debug Log
          </Button>
          <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <Sparkles className="w-4 h-4 mr-2" />
          Revolutionary Feature
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {LLM_MODELS.map((model) => {
          const modelStats = stats.find((s) => s.model === model.id);
          const citationRate = modelStats?.citationRate || 0;
          const avgPosition = modelStats?.avgPosition || 0;
          const trend = modelStats?.trend || 0;

          return (
            <Card
              key={model.id}
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${model.color}`} />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <img 
                      src={model.logo} 
                      alt={`${model.name} logo`}
                      className="w-6 h-6 object-contain"
                    />
                    {model.name}
                  </span>
                  {trend !== 0 && (
                    <Badge
                      variant={trend > 0 ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {trend > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(trend).toFixed(1)}%
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Citation Rate</span>
                    <span className="text-2xl font-bold text-foreground">
                      {citationRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={citationRate} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Position</span>
                  <span className="font-semibold text-foreground">
                    {avgPosition > 0 ? `#${avgPosition.toFixed(1)}` : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Citations</span>
                  <span className="font-semibold text-foreground">
                    {modelStats?.totalCitations || 0} / {modelStats?.totalQueries || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Track New Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Track New Queries
          </CardTitle>
          <CardDescription>
            Enter queries to check if your domain appears in LLM responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Queries (one per line)
            </label>
            <Textarea
              placeholder="What are the best SEO tools?&#10;How to improve website rankings?&#10;Top AI-powered SEO platforms"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              rows={4}
              disabled={tracking}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select LLM Models
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LLM_MODELS.map((model) => (
                <div
                  key={model.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedModels.includes(model.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleModel(model.id)}
                >
                  <Checkbox
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={() => toggleModel(model.id)}
                  />
                  <img 
                    src={model.logo} 
                    alt={`${model.name} logo`}
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-sm font-medium">{model.name}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleTrack}
            disabled={tracking || !queryInput.trim() || selectedModels.length === 0}
            className="w-full gradient-primary"
            size="lg"
          >
            {tracking ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Tracking Citations...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Track Citations
              </>
            )}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> Each query costs approximately $0.11 to track across all 4 LLMs.
              Free tier includes 5 queries/month.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tabs for detailed data */}
      <Tabs defaultValue="citations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="citations">Citation History</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>

        <TabsContent value="citations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Recent Citations ({citations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : citations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No citations tracked yet. Start by tracking some queries above!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead>LLM</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Context</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {citations.map((citation) => {
                        const model = LLM_MODELS.find((m) => m.id === citation.llm_model);
                        return (
                          <TableRow key={citation.id}>
                            <TableCell className="font-medium">{citation.query}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <img 
                                  src={model?.logo} 
                                  alt={`${model?.name} logo`}
                                  className="w-5 h-5 object-contain"
                                />
                                {model?.name}
                              </span>
                            </TableCell>
                            <TableCell>
                              {citation.is_cited ? (
                                <Badge className="bg-success/10 text-success border-success/20 gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Cited
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Not Cited
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {citation.citation_position ? (
                                <Badge variant="outline">#{citation.citation_position}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(citation.tracked_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="max-w-md">
                              {citation.is_cited && citation.citation_context ? (
                                <p className="text-sm text-muted-foreground truncate">
                                  {citation.citation_context}
                                </p>
                              ) : citation.full_response ? (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {citation.full_response.substring(0, 150)}...
                                  </p>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-primary"
                                    onClick={() => {
                                      const competitors = citation.competitors_cited && citation.competitors_cited.length > 0 
                                        ? `\n\n🏆 Competitors mentioned: ${citation.competitors_cited.join(", ")}`
                                        : "\n\n(No competitor domains detected)";
                                      
                                      alert(`📝 Full ${model?.name} Response:\n\n${citation.full_response}${competitors}`);
                                    }}
                                  >
                                    View Full Response →
                                  </Button>
                                  {citation.competitors_cited && citation.competitors_cited.length > 0 && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                      ⚠️ {citation.competitors_cited.length} competitor(s) cited instead
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No response data</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Competitor Citations ({competitors.length})
              </CardTitle>
              <CardDescription>
                Domains that appear in LLM responses alongside yours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : competitors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No competitor data yet. Track more queries to see competitors!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Total Mentions</TableHead>
                        <TableHead>Avg Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitors.map((competitor, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {competitor.competitor_domain}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{competitor.total_mentions}</Badge>
                          </TableCell>
                          <TableCell>
                            {competitor.avg_position > 0 ? (
                              <span className="text-sm font-medium">
                                #{competitor.avg_position.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

