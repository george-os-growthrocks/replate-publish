import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Target, Settings, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useProjects } from "@/hooks/useProjects";
import { Progress } from "@/components/ui/progress";

export function DashboardHero({ userEmail }: { userEmail: string }) {
  const navigate = useNavigate();
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();
  const { data: projects } = useProjects();

  const firstName = userEmail?.split('@')[0] || 'User';
  const planName = subscription?.plan?.name || 'Free';
  
  // Calculate Account Health Score (0-100%)
  const calculateHealthScore = (): number => {
    let score = 0;
    
    // Credits (40 points)
    if (credits) {
      const creditsPercent = (credits.available_credits / credits.total_credits) * 100;
      score += Math.min(40, creditsPercent * 0.4);
    }
    
    // Projects (30 points)
    const projectCount = projects?.length || 0;
    score += Math.min(30, projectCount * 10);
    
    // Subscription status (30 points)
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      score += 30;
    } else if (planName !== 'Free') {
      score += 15;
    }
    
    return Math.round(score);
  };

  const healthScore = calculateHealthScore();
  const healthColor = healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-amber-500' : 'text-red-500';
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Attention';

  // Member since (from subscription or fallback)
  const memberSince = subscription?.created_at 
    ? new Date(subscription.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2025';

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardContent className="p-8">
        <div className="flex items-start justify-between flex-wrap gap-6">
          {/* Left: User Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold">
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {firstName}!
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                  {planName} Plan
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Member since {memberSince}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right: Account Health */}
          <Card className="min-w-[200px]">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Account Health</p>
              <div className={`text-4xl font-bold ${healthColor} mb-1`}>
                {healthScore}%
              </div>
              <p className="text-xs text-muted-foreground mb-3">{healthLabel}</p>
              <Progress value={healthScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {credits?.available_credits || 0} credits • {projects?.length || 0} projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mt-6 flex-wrap">
          <Button onClick={() => navigate('/repurpose')} className="gradient-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Create Content
          </Button>
          <Button onClick={() => navigate('/keyword-research')} variant="outline">
            <Target className="w-4 h-4 mr-2" />
            SEO Suite
          </Button>
          <Button onClick={() => navigate('/settings')} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Low Credits Warning */}
        {credits && credits.available_credits < credits.total_credits * 0.2 && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">Running Low on Credits</p>
              <p className="text-sm text-muted-foreground">
                You have {credits.available_credits} credits remaining this month
              </p>
            </div>
            <Button onClick={() => navigate('/pricing')} size="sm" variant="outline">
              Upgrade Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

