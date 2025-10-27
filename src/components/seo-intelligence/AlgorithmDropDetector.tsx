import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Calendar, Target, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

interface AlgorithmDrop {
  date: string;
  severity: 'low' | 'moderate' | 'high' | 'severe';
  avgDrop: number;
  keywords: string[];
  trafficLoss: number;
  algorithm: string;
  diagnosis: string;
  actions: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }[];
}

interface AlgorithmDropDetectorProps {
  drops?: AlgorithmDrop[];
  onApplyAction?: (dropId: string, actionIndex: number) => void;
  className?: string;
}

export function AlgorithmDropDetector({ drops = [], onApplyAction, className = '' }: AlgorithmDropDetectorProps) {
  const [expandedDrop, setExpandedDrop] = useState<string | null>(null);

  if (!drops || drops.length === 0) {
    return (
      <Card className={`p-6 bg-slate-950/80 border-white/10 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <h3 className="text-lg font-semibold mb-2">No Major Drops Detected</h3>
          <p className="text-sm text-muted-foreground">
            Your rankings appear stable with no significant algorithm-related drops in the last 90 days.
          </p>
        </div>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-300';
      case 'moderate':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
      default:
        return 'bg-slate-500/10 border-slate-500/20 text-slate-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return '🔴';
      case 'high':
        return '🟠';
      case 'moderate':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-300';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              {drops.length} Algorithm Impact{drops.length > 1 ? 's' : ''} Detected
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Significant ranking changes detected that may be related to Google algorithm updates. Review and address
              these issues to recover lost traffic.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="font-medium">
                  {drops.reduce((sum, d) => sum + d.keywords.length, 0)} Keywords Affected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                <span className="font-medium">
                  ~{drops.reduce((sum, d) => sum + d.trafficLoss, 0).toLocaleString()} Potential Traffic Loss
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="font-medium">
                  {drops.filter(d => d.severity === 'severe' || d.severity === 'high').length} High Priority
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Individual Drops */}
      <Accordion type="single" collapsible className="space-y-3">
        {drops.map((drop, index) => (
          <AccordionItem
            key={index}
            value={`drop-${index}`}
            className="border rounded-lg overflow-hidden bg-slate-950/80 border-white/10"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-900/50">
              <div className="flex items-start justify-between w-full pr-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${getSeverityColor(drop.severity)}`}>
                    {getSeverityIcon(drop.severity)} {drop.severity.toUpperCase()}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-base font-semibold mb-1">{drop.algorithm}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(drop.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        -{drop.avgDrop.toFixed(1)} avg positions
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {drop.keywords.length} keywords
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4 pt-4">
                {/* Diagnosis */}
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Diagnosis
                  </h5>
                  <p className="text-sm text-muted-foreground">{drop.diagnosis}</p>
                </div>

                {/* Affected Keywords */}
                <div>
                  <h5 className="text-sm font-semibold mb-2">Affected Keywords</h5>
                  <div className="flex flex-wrap gap-2">
                    {drop.keywords.slice(0, 10).map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                    {drop.keywords.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{drop.keywords.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Recovery Actions */}
                <div>
                  <h5 className="text-sm font-semibold mb-3">Recovery Actions</h5>
                  <div className="space-y-3">
                    {drop.actions.map((action, actionIdx) => (
                      <div
                        key={actionIdx}
                        className="p-4 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h6 className="text-sm font-semibold">{action.title}</h6>
                            <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {action.effort} effort
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{action.description}</p>
                        {onApplyAction && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onApplyAction(`drop-${index}`, actionIdx)}
                            className="text-xs"
                          >
                            Apply Action
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Visualization */}
                <div className="p-4 rounded-lg bg-slate-900/50">
                  <h5 className="text-sm font-semibold mb-3">Estimated Traffic Impact</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Traffic Loss</span>
                      <span>{drop.trafficLoss.toLocaleString()} monthly visits</span>
                    </div>
                    <Progress value={(drop.trafficLoss / 10000) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

