import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OnboardingState } from "./OnboardingWizard";
import { Target, TrendingUp, Zap, Users, Globe, BarChart3 } from "lucide-react";

interface WelcomeStepProps {
  state: OnboardingState;
  onUpdate: (update: Partial<OnboardingState>) => void;
}

const goals = [
  {
    id: "increase_traffic",
    icon: TrendingUp,
    label: "Increase Traffic",
    description: "Boost organic visitors to your site",
    color: "text-green-500",
  },
  {
    id: "improve_rankings",
    icon: Target,
    label: "Improve Rankings",
    description: "Rank higher for target keywords",
    color: "text-blue-500",
  },
  {
    id: "content_optimization",
    icon: Zap,
    label: "Content Optimization",
    description: "Optimize existing content for SEO",
    color: "text-amber-500",
  },
  {
    id: "competitor_analysis",
    icon: Users,
    label: "Competitor Analysis",
    description: "Understand and outrank competitors",
    color: "text-purple-500",
  },
  {
    id: "local_seo",
    icon: Globe,
    label: "Local SEO",
    description: "Dominate local search results",
    color: "text-cyan-500",
  },
  {
    id: "analytics_reporting",
    icon: BarChart3,
    label: "Analytics & Reporting",
    description: "Track and measure SEO performance",
    color: "text-pink-500",
  },
];

export function WelcomeStep({ state, onUpdate }: WelcomeStepProps) {
  const toggleGoal = (goalId: string) => {
    const currentGoals = state.selectedGoals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(g => g !== goalId)
      : [...currentGoals, goalId];
    
    onUpdate({ selectedGoals: newGoals });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Let's Get Started!</h3>
        <p className="text-muted-foreground">
          Tell us what you want to achieve with AnotherSEOGuru
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-4">
          Select your primary goals (choose at least one):
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const isSelected = state.selectedGoals?.includes(goal.id);

            return (
              <Card
                key={goal.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${isSelected ? "bg-primary/10" : ""}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : goal.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{goal.label}</h4>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {goal.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {state.selectedGoals && state.selectedGoals.length > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium text-primary mb-2">
            Great choice! We'll personalize your experience for:
          </p>
          <div className="flex flex-wrap gap-2">
            {state.selectedGoals.map(goalId => {
              const goal = goals.find(g => g.id === goalId);
              return goal ? (
                <Badge key={goalId} variant="secondary">
                  {goal.label}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
