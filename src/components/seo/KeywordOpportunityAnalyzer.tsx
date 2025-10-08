import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Search, Sparkles, TrendingUp, Zap, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface KeywordOpportunityAnalyzerProps {
  projectId: string;
}

export function KeywordOpportunityAnalyzer({ projectId }: KeywordOpportunityAnalyzerProps) {
  const [keyword, setKeyword] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Keyword Opportunity Analyzer
        </h1>
        <p className="text-muted-foreground text-lg">
          Discover untapped keyword opportunities with AI-powered analysis
        </p>
      </div>

      <Card className="rounded-2xl border-border shadow-xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-card to-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Find Your Next Winning Keywords</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Enter seed keywords to discover high-potential opportunities
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter seed keyword (e.g., 'seo tools', 'content marketing')"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                className="h-14 text-lg rounded-xl border-2 focus:border-primary transition-all"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !keyword.trim()}
              className="h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
            >
              {analyzing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">AI-Powered</p>
                  <p className="text-lg font-bold">Smart Analysis</p>
                  <p className="text-xs text-muted-foreground">Advanced ML algorithms</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Growth Potential</p>
                  <p className="text-lg font-bold">Trend Detection</p>
                  <p className="text-xs text-muted-foreground">Real-time trending data</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Quick Wins</p>
                  <p className="text-lg font-bold">Easy Targets</p>
                  <p className="text-xs text-muted-foreground">Low competition keywords</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4 text-primary" />
              <span>Enter keywords above to start discovering opportunities</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Our AI will analyze search volume, competition, trends, and user intent to surface high-potential keyword opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
