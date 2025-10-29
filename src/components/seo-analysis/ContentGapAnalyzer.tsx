/**
 * Content Gap Analyzer Component
 * Shows content gaps vs top-ranking competitors
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, TrendingUp, Link, Clock, AlertCircle } from "lucide-react";
import { analyzeContentGap } from "@/lib/seo-calculations";
import type { SerpResult, IntentAnalysis } from "@/types/seo-metrics";

interface ContentGapAnalyzerProps {
  currentContentLength: number;
  serpResults: SerpResult[];
  difficulty: number;
  intent: IntentAnalysis['primary'];
  className?: string;
}

export function ContentGapAnalyzer({
  currentContentLength,
  serpResults,
  difficulty,
  intent,
  className = ""
}: ContentGapAnalyzerProps) {
  const gap = analyzeContentGap(currentContentLength, serpResults, difficulty, intent);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getGapSeverity = (gapWords: number) => {
    if (gapWords <= 0) return { label: "Excellent", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    if (gapWords <= 500) return { label: "Minor Gap", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    if (gapWords <= 1500) return { label: "Moderate Gap", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { label: "Major Gap", color: "bg-red-500/10 text-red-400 border-red-500/20" };
  };

  const severity = getGapSeverity(gap.wordCountGap.gap);

  return (
    <Card className={`bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-orange-400" />
          Content Gap Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Word Count Comparison */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Your Content</span>
            <span className="font-medium">{gap.wordCountGap.current.toLocaleString()} words</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Top Results Average</span>
            <span className="font-medium">{gap.wordCountGap.topResultsAverage.toLocaleString()} words</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Recommended</span>
            <span className="font-bold text-orange-400">{gap.wordCountGap.recommended.toLocaleString()} words</span>
          </div>
        </div>

        {/* Gap Visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Gap</span>
            <Badge className={severity.color}>
              {severity.label}
            </Badge>
          </div>
          {gap.wordCountGap.gap > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <span>
                Need <span className="font-bold text-orange-400">{gap.wordCountGap.gap.toLocaleString()}</span> more words
                {gap.wordCountGap.current > 0 && (
                  <span className="text-muted-foreground ml-1">
                    (+{Math.round((gap.wordCountGap.gap / gap.wordCountGap.current) * 100)}%)
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>Content length exceeds competitors! ✓</span>
            </div>
          )}
        </div>

        {/* Topical Depth Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Topical Depth Score</span>
            <span className={`font-bold ${getScoreColor(gap.topicalDepth.score)}`}>
              {gap.topicalDepth.score}/100
            </span>
          </div>
          <Progress value={gap.topicalDepth.score} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Coverage: {gap.topicalDepth.coveragePercentage}%
          </div>
        </div>

        {/* Backlinks & Time Estimate */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link className="h-3 w-3" />
              Backlinks Needed
            </div>
            <div className="font-bold text-lg">{gap.backlinksNeeded}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Time to Rank
            </div>
            <div className="font-bold text-lg">
              {gap.timeToRank.realistic} mo
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-semibold text-orange-400 mb-2">Action Items:</p>
          <ul className="space-y-1">
            {gap.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                <span className="text-orange-400">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
