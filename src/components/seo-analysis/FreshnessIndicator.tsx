/**
 * Freshness Indicator Component
 * Shows content freshness requirements and update frequency
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { analyzeFreshness } from "@/lib/seo-calculations";
import type { SerpResult } from "@/types/seo-metrics";

interface FreshnessIndicatorProps {
  keyword: string;
  serpResults: SerpResult[];
  className?: string;
}

export function FreshnessIndicator({
  keyword,
  serpResults,
  className = ""
}: FreshnessIndicatorProps) {
  const freshness = analyzeFreshness(keyword, serpResults);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'important':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'minor':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getQueryTypeIcon = (type: string) => {
    switch (type) {
      case 'news':
        return '📰';
      case 'trending':
        return '🔥';
      case 'seasonal':
        return '🗓️';
      case 'evergreen':
        return '🌲';
      default:
        return '📄';
    }
  };

  const getUpdateFrequencyBadge = (frequency: string) => {
    const badges = {
      daily: { label: 'Update Daily', color: 'bg-red-500/10 text-red-400 border-red-500/20', urgency: 'Critical' },
      weekly: { label: 'Update Weekly', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', urgency: 'High' },
      monthly: { label: 'Update Monthly', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', urgency: 'Moderate' },
      quarterly: { label: 'Update Quarterly', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', urgency: 'Low' }
    };
    return badges[frequency as keyof typeof badges] || badges.quarterly;
  };

  const updateBadge = getUpdateFrequencyBadge(freshness.updateFrequencyRecommended);

  const getAgeLabel = (days: number) => {
    if (days < 7) return 'Very Fresh';
    if (days < 30) return 'Fresh';
    if (days < 90) return 'Recent';
    if (days < 180) return 'Aging';
    return 'Old';
  };

  const getAgeColor = (days: number) => {
    if (days < 30) return 'text-emerald-400';
    if (days < 90) return 'text-blue-400';
    if (days < 180) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <Card className={`bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-pink-400" />
          Content Freshness Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Type */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Query Type</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getQueryTypeIcon(freshness.queryType)}</span>
              <Badge variant="outline">
                {freshness.queryType.charAt(0).toUpperCase() + freshness.queryType.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Average Content Age */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Top Results Avg Age</span>
            <span className={`font-bold ${getAgeColor(freshness.avgTopResultAge)}`}>
              {freshness.avgTopResultAge} days
            </span>
          </div>
          <Badge className={getImportanceColor(
            freshness.avgTopResultAge < 30 ? 'critical' : 
            freshness.avgTopResultAge < 90 ? 'important' : 'minor'
          )}>
            {getAgeLabel(freshness.avgTopResultAge)}
          </Badge>
        </div>

        {/* Freshness Importance */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Freshness Importance</span>
            <Badge className={getImportanceColor(freshness.freshnessImportance)}>
              {freshness.freshnessImportance.toUpperCase()}
            </Badge>
          </div>
          
          {freshness.freshnessImportance === 'critical' && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Fresh content is critical for this query!</span>
            </div>
          )}
          {freshness.freshnessImportance === 'minor' && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <span>Evergreen content - freshness less important</span>
            </div>
          )}
        </div>

        {/* Update Frequency Recommendation */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-pink-400" />
            <span className="text-xs font-semibold text-pink-400">Update Schedule</span>
          </div>
          
          <Badge className={`${updateBadge.color} w-full justify-center py-2`}>
            {updateBadge.label}
          </Badge>
          
          <div className="text-xs text-muted-foreground text-center">
            Urgency: <span className="font-medium">{updateBadge.urgency}</span>
          </div>
        </div>

        {/* Content Boost */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Recent Content Bonus</div>
            <div className="font-bold text-lg text-pink-400">
              +{(freshness.recentContentBonus * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">CTR boost</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Next Update</div>
            <div className="font-bold text-lg">
              {freshness.updateFrequencyRecommended === 'daily' && '1d'}
              {freshness.updateFrequencyRecommended === 'weekly' && '7d'}
              {freshness.updateFrequencyRecommended === 'monthly' && '30d'}
              {freshness.updateFrequencyRecommended === 'quarterly' && '90d'}
            </div>
            <div className="text-xs text-muted-foreground">Recommended</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-pink-400">
            💡 {freshness.recommendation}
          </p>
        </div>

        {/* Content Strategy Tips */}
        {freshness.freshnessImportance === 'critical' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-red-400 mb-2">Critical Freshness Tips:</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Add current year to title & content</li>
              <li>• Update statistics and data regularly</li>
              <li>• Monitor trending topics daily</li>
              <li>• Publish time-sensitive content quickly</li>
            </ul>
          </div>
        )}
        
        {freshness.queryType === 'evergreen' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-emerald-400 mb-2">Evergreen Strategy:</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Focus on timeless, comprehensive content</li>
              <li>• Update only when major changes occur</li>
              <li>• Emphasize depth over recency</li>
              <li>• Build long-term authority</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
