import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Link2, 
  ArrowRight, 
  Sparkles, 
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface LinkOpportunity {
  id: string;
  source_page: string;
  target_page: string;
  anchor_text: string;
  relevance_score: number;
  semantic_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  context_snippet: string;
}

interface InternalLinkingAnalyzerProps {
  projectId: string;
}

export function InternalLinkingAnalyzer({ projectId }: InternalLinkingAnalyzerProps) {
  const [opportunities, setOpportunities] = useState<LinkOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadOpportunities();
  }, [projectId]);

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_linking_opportunities')
        .select('*')
        .eq('project_id', projectId)
        .order('relevance_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map and ensure proper types
      const typedOpportunities: LinkOpportunity[] = (data || []).map(d => ({
        ...d,
        confidence_level: (d.confidence_level || 'medium') as 'high' | 'medium' | 'low'
      }));
      
      setOpportunities(typedOpportunities);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    }
  };

  const analyzeLinks = async () => {
    setLoading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('semantic-linking', {
        body: { projectId, minSimilarity: 0.75, limit: 100 }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      toast({
        title: "Analysis complete! ✨",
        description: `Found ${data.opportunities} link opportunities`,
      });

      await loadOpportunities();
    } catch (error: any) {
      console.error('Error analyzing links:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze internal links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getConfidenceBadge = (level: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return variants[level as keyof typeof variants] || 'outline';
  };

  const getConfidenceColor = (level: string) => {
    const colors = {
      high: 'text-green-600',
      medium: 'text-yellow-600',
      low: 'text-gray-500'
    };
    return colors[level as keyof typeof colors] || 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500/5 to-purple-500/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Link2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-blue-600 bg-clip-text text-transparent">
                  AI-Powered Internal Linking
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Semantic analysis finds the best linking opportunities across your content
                </p>
              </div>
            </div>
            <Button
              onClick={analyzeLinks}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Links
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {loading && (
          <CardContent className="pb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analyzing semantic relationships...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {opportunities.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Link Opportunities ({opportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all duration-300 bg-background/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={getConfidenceBadge(opp.confidence_level) as any}>
                        {opp.confidence_level}
                      </Badge>
                      <span className={`text-sm font-medium ${getConfidenceColor(opp.confidence_level)}`}>
                        {(opp.relevance_score * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3" />
                      Semantic Score: {(opp.semantic_score * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-medium truncate">{opp.source_page}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="text-blue-600 font-medium truncate">{opp.anchor_text}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">To:</span>
                      <span className="font-medium truncate">{opp.target_page}</span>
                    </div>

                    {opp.context_snippet && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                        <span className="text-muted-foreground">Context: </span>
                        <span className="italic">"{opp.context_snippet}"</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {opportunities.length === 0 && !loading && (
        <Card className="p-12 text-center border-dashed">
          <Link2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Link Opportunities Yet</h3>
          <p className="text-muted-foreground mb-4">
            Run an analysis to discover semantic linking opportunities
          </p>
          <Button onClick={analyzeLinks} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Start Analysis
          </Button>
        </Card>
      )}
    </div>
  );
}
