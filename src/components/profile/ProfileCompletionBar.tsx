import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CompletionStep {
  id: string;
  label: string;
  completed: boolean;
  path: string;
}

export function ProfileCompletionBar() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<CompletionStep[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    loadCompletionStatus();
  }, []);

  const loadCompletionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: tokens } = await supabase
        .from('user_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const completionSteps: CompletionStep[] = [
        {
          id: 'basic_info',
          label: 'Complete basic information',
          completed: !!(profile?.first_name && profile?.last_name),
          path: '/settings',
        },
        {
          id: 'avatar',
          label: 'Upload profile picture',
          completed: !!profile?.avatar_url,
          path: '/settings',
        },
        {
          id: 'gsc_connected',
          label: 'Connect Google Search Console',
          completed: !!tokens?.access_token,
          path: '/settings',
        },
        {
          id: 'company_info',
          label: 'Add company information',
          completed: !!profile?.company_name,
          path: '/settings',
        },
        {
          id: 'goals',
          label: 'Set your SEO goals',
          completed: !!profile?.primary_goals,
          path: '/settings',
        },
      ];

      setSteps(completionSteps);

      const completed = completionSteps.filter(s => s.completed).length;
      const percentage = (completed / completionSteps.length) * 100;
      setCompletionPercentage(percentage);
    } catch (error) {
      console.error('Failed to load completion status:', error);
    }
  };

  const incompleteSteps = steps.filter(s => !s.completed);

  if (completionPercentage === 100) {
    return null; // Hide when 100% complete
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Complete Your Profile</h4>
            <span className="text-sm font-medium text-primary">
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {incompleteSteps.slice(0, 3).map((step) => (
            <button
              key={step.id}
              onClick={() => navigate(step.path)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-background/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm">{step.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        {incompleteSteps.length > 3 && (
          <p className="text-xs text-center text-muted-foreground">
            +{incompleteSteps.length - 3} more steps
          </p>
        )}
      </div>
    </Card>
  );
}
