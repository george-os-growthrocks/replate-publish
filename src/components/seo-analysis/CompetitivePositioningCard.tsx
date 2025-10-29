/**
 * Competitive Positioning Card Component
 * Shows ranking probability and required improvements
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Shield, AlertCircle, Award, Clock } from "lucide-react";
import { analyzeCompetitivePositioning } from "@/lib/seo-calculations";
import type { SerpResult } from "@/types/seo-metrics";

interface CompetitivePositioningCardProps {
  yourDomain: string;
  yourDA: number;
  yourBacklinks: number;
  serpResults: SerpResult[];
  difficulty: number;
  className?: string;
}

export function CompetitivePositioningCard({
  yourDomain,
  yourDA,
  yourBacklinks,
  serpResults,
  difficulty,
  className = ""
}: CompetitivePositioningCardProps) {
  const positioning = analyzeCompetitivePositioning(
    yourDomain,
    yourDA,
    yourBacklinks,
    serpResults,
    difficulty
  );

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'text-emerald-400';
      case 'medium':
        return 'text-blue-400';
      case 'high':
        return 'text-amber-400';
      case 'very_high':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-violet-400" />
          Competitive Positioning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ranking Probability */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Can You Outrank?</span>
            <Badge className={getConfidenceColor(positioning.canOutrank.confidence)}>
              {positioning.canOutrank.confidence.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Probability</span>
              <span className="text-2xl font-bold text-violet-400">
                {positioning.canOutrank.probability}%
              </span>
            </div>
            <Progress value={positioning.canOutrank.probability} className="h-2" />
          </div>

          <p className="text-xs text-muted-foreground">
            {positioning.canOutrank.explanation}
          </p>
        </div>

        {/* Realistic Ceiling */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Position
            </div>
            <div className="font-bold text-xl text-violet-400">
              #{positioning.realisticCeiling.position}
            </div>
          </div>
          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Timeframe
            </div>
            <div className="font-bold text-xl">
              {positioning.realisticCeiling.timeframe}mo
            </div>
          </div>
          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Effort
            </div>
            <div className={`font-bold text-xl ${getEffortColor(positioning.realisticCeiling.effort)}`}>
              {positioning.realisticCeiling.effort === 'very_high' ? 'V.High' : 
               positioning.realisticCeiling.effort.charAt(0).toUpperCase() + 
               positioning.realisticCeiling.effort.slice(1)}
            </div>
          </div>
        </div>

        {/* Required Improvements */}
        {positioning.requiredImprovements.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400">Required Improvements</span>
            </div>
            
            <div className="space-y-2">
              {positioning.requiredImprovements.map((improvement, index) => (
                <div
                  key={index}
                  className="bg-violet-500/5 border border-violet-500/10 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(improvement.priority)} variant="outline">
                        {improvement.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-medium capitalize">{improvement.area}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current:</span>
                    <span className="font-medium">{improvement.current}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-bold text-violet-400">{improvement.target}</span>
                  </div>
                  <Progress 
                    value={(improvement.current / improvement.target) * 100} 
                    className="h-1.5" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {improvement.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitive Strengths */}
        {positioning.competitiveStrengths.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Your Strengths</span>
            </div>
            <ul className="space-y-1">
              {positioning.competitiveStrengths.map((strength, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-emerald-400">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Competitive Weaknesses */}
        {positioning.competitiveWeaknesses.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs font-semibold text-red-400">Areas to Improve</span>
            </div>
            <ul className="space-y-1">
              {positioning.competitiveWeaknesses.map((weakness, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-red-400">✗</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategy Recommendation */}
        {positioning.canOutrank.probability >= 70 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-emerald-400 mb-2">High Probability Strategy:</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Target this keyword with confidence</li>
              <li>• Create comprehensive, optimized content</li>
              <li>• Build targeted backlinks steadily</li>
              <li>• Expect position #{positioning.realisticCeiling.position} in {positioning.realisticCeiling.timeframe} months</li>
            </ul>
          </div>
        ) : positioning.canOutrank.probability >= 40 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-400 mb-2">Moderate Probability Strategy:</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Consider targeting with sustained effort</li>
              <li>• Focus on quality content + backlinks</li>
              <li>• Be patient - this is a longer-term play</li>
              <li>• Target realistic position ~#{positioning.realisticCeiling.position}</li>
            </ul>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-red-400 mb-2">Low Probability - Alternative Strategy:</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Consider this a long-term target (18+ months)</li>
              <li>• Target easier keywords first to build authority</li>
              <li>• Focus on major improvements (DA, backlinks)</li>
              <li>• Or skip and focus on higher-probability keywords</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
