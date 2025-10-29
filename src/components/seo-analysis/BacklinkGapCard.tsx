/**
 * Backlink Gap Card Component
 * Shows backlink requirements vs competitors
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link2, TrendingUp, Award, Target } from "lucide-react";
import { calculateBacklinkGap } from "@/lib/seo-calculations";
import type { SerpResult } from "@/types/seo-metrics";

interface BacklinkGapCardProps {
  currentBacklinks: number;
  serpResults: SerpResult[];
  className?: string;
}

export function BacklinkGapCard({
  currentBacklinks,
  serpResults,
  className = ""
}: BacklinkGapCardProps) {
  const gap = calculateBacklinkGap(currentBacklinks, serpResults);

  const getGapColor = (score: number) => {
    if (score >= 80) return "text-red-400";
    if (score >= 50) return "text-amber-400";
    if (score >= 20) return "text-blue-400";
    return "text-emerald-400";
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case 2: return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case 3: return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case 4: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4 text-cyan-400" />
          Backlink Gap Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current vs Target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Your Backlinks</span>
            <span className="font-medium">{gap.currentBacklinks.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Top Results Average</span>
            <span className="font-medium">{gap.topResultsAverage.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Estimated Needed (70%)</span>
            <span className="font-bold text-cyan-400">{gap.estimatedBacklinksNeeded.toLocaleString()}</span>
          </div>
        </div>

        {/* Gap Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Backlink Gap Score</span>
            <span className={`font-bold ${getGapColor(gap.backlinkGapScore)}`}>
              {gap.backlinkGapScore}/100
            </span>
          </div>
          <Progress value={gap.backlinkGapScore} className="h-2" />
          {gap.gap > 0 ? (
            <div className="text-sm">
              Need <span className="font-bold text-cyan-400">{gap.gap.toLocaleString()}</span> more backlinks
              <span className="text-muted-foreground ml-1">({gap.gapPercentage}% gap)</span>
            </div>
          ) : (
            <div className="text-sm text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Backlink profile is competitive! ✓
            </div>
          )}
        </div>

        {/* Quality Breakdown */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400">Quality Breakdown</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Badge className={getTierColor(1)} variant="outline">
                Tier 1 (DA 70+)
              </Badge>
              <div className="text-lg font-bold">{gap.qualityBreakdown.tier1Needed}</div>
              <div className="text-xs text-muted-foreground">High authority</div>
            </div>
            
            <div className="space-y-1">
              <Badge className={getTierColor(2)} variant="outline">
                Tier 2 (DA 50-69)
              </Badge>
              <div className="text-lg font-bold">{gap.qualityBreakdown.tier2Needed}</div>
              <div className="text-xs text-muted-foreground">Medium authority</div>
            </div>
            
            <div className="space-y-1">
              <Badge className={getTierColor(3)} variant="outline">
                Tier 3 (DA 30-49)
              </Badge>
              <div className="text-lg font-bold">{gap.qualityBreakdown.tier3Needed}</div>
              <div className="text-xs text-muted-foreground">Low authority</div>
            </div>
            
            <div className="space-y-1">
              <Badge className={getTierColor(4)} variant="outline">
                Tier 4 (DA 0-29)
              </Badge>
              <div className="text-lg font-bold">{gap.qualityBreakdown.tier4Needed}</div>
              <div className="text-xs text-muted-foreground">Very low authority</div>
            </div>
          </div>
        </div>

        {/* Strategy Badge */}
        {gap.qualityOverQuantity && (
          <div className="pt-2 border-t border-border/50">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 w-full justify-center">
              <Target className="h-3 w-3 mr-1" />
              Focus on Quality Over Quantity
            </Badge>
          </div>
        )}

        {/* Recommendation */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-cyan-400">
            💡 {gap.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
