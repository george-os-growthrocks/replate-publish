import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Target, Settings, Calendar, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useProjects } from "@/hooks/useProjects";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Counter } from "@/components/ui/counter";

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
  const memberSince = subscription?.current_period_start 
    ? new Date(subscription.current_period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2025';

  return (
    <Card className="relative overflow-hidden border-primary/20 shadow-xl">
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/50 to-secondary/10 backdrop-blur-sm" />
      
      {/* Animated glow effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-lg blur-2xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <CardContent className="relative p-8 z-10">
        <div className="flex items-start justify-between flex-wrap gap-6">
          {/* Left: User Info */}
          <motion.div 
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Avatar className="h-16 w-16 ring-4 ring-primary/30 shadow-glow">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold">
                  {firstName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Welcome back, {firstName}!
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="gradient-primary text-white shadow-soft">
                  {planName} Plan
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Member since {memberSince}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
                  <Flame className="w-3 h-3 text-orange-500" />
                  7-day streak
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Right: Account Health with Radial Progress */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="min-w-[200px] bg-gradient-card backdrop-blur-sm border-primary/10 shadow-medium">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">Account Health</p>
                
                {/* Radial Progress Ring */}
                <div className="relative inline-flex items-center justify-center mb-3">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(var(--border))"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={healthScore >= 80 ? "hsl(var(--success))" : healthScore >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 352 }}
                      animate={{ strokeDashoffset: 352 - (352 * healthScore) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeDasharray="352"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div 
                      className={`text-4xl font-bold ${healthColor}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5, type: "spring" }}
                    >
                      <Counter value={healthScore} />%
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">{healthLabel}</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Credits:</span>
                    <span className="font-semibold text-foreground">
                      <Counter value={credits?.available_credits || 0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Projects:</span>
                    <span className="font-semibold text-foreground">{projects?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions with animations */}
        <motion.div 
          className="flex items-center gap-3 mt-6 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => navigate('/repurpose')} className="gradient-primary shadow-glow">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => navigate('/keyword-research')} variant="outline" className="hover:border-primary/50">
              <Target className="w-4 h-4 mr-2" />
              SEO Suite
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => navigate('/settings')} variant="outline" className="hover:border-primary/50">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </motion.div>
        </motion.div>

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

