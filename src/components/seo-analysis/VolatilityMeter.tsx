/**
 * Volatility Meter Component
 * Shows SERP volatility and ranking opportunity
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Lock, Unlock, TrendingUp } from "lucide-react";
import { calculateSerpVolatility } from "@/lib/seo-calculations";

interface VolatilityMeterProps {
  historicalChanges: number;
  periodDays?: number;
  className?: string;
}

export function VolatilityMeter({
  historicalChanges,
  periodDays = 90,
  className = ""
}: VolatilityMeterProps) {
  const volatility = calculateSerpVolatility(historicalChanges, periodDays);

  const getVolatilityArc = (score: number) => {
    // Create arc segments for visual meter
    const segments = [];
    const segmentCount = 20;
    
    for (let i = 0; i < segmentCount; i++) {
      const isActive = (i / segmentCount) * 100 < score;
      let color = "bg-gray-700";
      
      if (isActive) {
        if (score <= 30) color = "bg-emerald-500";
        else if (score <= 60) color = "bg-amber-500";
        else color = "bg-red-500";
      }
      
      segments.push(
        <div
          key={i}
          className={`h-2 rounded-full ${color} transition-colors`}
          style={{ width: `${100 / segmentCount}%` }}
        />
      );
    }
    
    return segments;
  };

  const getOpportunityIcon = (window: string) => {
    switch (window) {
      case 'open':
        return <Unlock className="h-5 w-5 text-emerald-400" />;
      case 'competitive':
        return <Activity className="h-5 w-5 text-amber-400" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-red-400" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getInterpretationColor = (label: string) => {
    switch (label) {
      case 'Stable':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Moderate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'High':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getOpportunityBadge = (window: string) => {
    switch (window) {
      case 'open':
        return { label: 'OPEN - Quick Win Opportunity', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'competitive':
        return { label: 'Competitive - Possible', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'locked':
        return { label: 'Locked - Long-term Effort', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    }
  };

  const opportunityBadge = getOpportunityBadge(volatility.opportunityWindow);

  return (
    <Card className={`bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-400" />
          SERP Volatility Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Volatility Score with Visual Meter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Volatility Score</span>
            <Badge className={getInterpretationColor(volatility.interpretation.label)}>
              {volatility.interpretation.label}
            </Badge>
          </div>
          
          {/* Visual Meter */}
          <div className="relative">
            <div className="flex gap-1 mb-2">
              {getVolatilityArc(volatility.volatilityScore)}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-bold text-lg" style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: '-24px'
              }}>
                {volatility.volatilityScore}
              </span>
              <span>100</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {volatility.interpretation.description}
          </p>
        </div>

        {/* Opportunity Window */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            {getOpportunityIcon(volatility.opportunityWindow)}
            <span className="text-xs font-semibold text-indigo-400">Opportunity Window</span>
          </div>
          
          <Badge className={`${opportunityBadge.color} w-full justify-center py-2`}>
            {opportunityBadge.label}
          </Badge>
        </div>

        {/* Ranking Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Churn Rate</div>
            <div className="font-bold text-lg">{volatility.rankingChurnRate}%</div>
            <div className="text-xs text-muted-foreground">Position changes</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Changes (90d)</div>
            <div className="font-bold text-lg">{volatility.historicalChanges}</div>
            <div className="text-xs text-muted-foreground">Ranking shifts</div>
          </div>
        </div>

        {/* Explanation */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-indigo-400">
            💡 {volatility.explanation}
          </p>
        </div>

        {/* Strategy Recommendations */}
        {volatility.opportunityWindow === 'open' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Quick Win Strategy</span>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Create comprehensive content quickly</li>
              <li>• Target this keyword with priority</li>
              <li>• Expect faster ranking improvements</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
