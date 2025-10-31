import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Search,
  Target,
  BarChart3,
  FileText,
  Brain,
  Gauge,
  Link2,
  TrendingUp,
  Eye,
  Globe,
  Zap,
  Crown,
  Star,
} from "lucide-react";
import { useCredits } from "@/hooks/useSubscription";
import { motion } from "framer-motion";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  path: string;
  gradient: string;
  credits?: number;
}

const quickActions: QuickAction[] = [
  {
    icon: Sparkles,
    label: "AI Content Repurpose",
    description: "Transform content instantly",
    path: "/repurpose",
    gradient: "from-violet-500 to-purple-500",
    credits: 5,
  },
  {
    icon: Search,
    label: "Keyword Research",
    description: "Discover ranking opportunities",
    path: "/keyword-research",
    gradient: "from-blue-500 to-cyan-500",
    credits: 2,
  },
  {
    icon: Target,
    label: "Rank Tracking",
    description: "Monitor keyword positions",
    path: "/ranking-tracker",
    gradient: "from-emerald-500 to-teal-500",
    credits: 1,
  },
  {
    icon: Gauge,
    label: "Site Audit",
    description: "Check technical SEO health",
    path: "/site-audit",
    gradient: "from-amber-500 to-orange-500",
    credits: 20,
  },
  {
    icon: Brain,
    label: "AI SEO Chat",
    description: "Get instant SEO advice",
    path: "/dashboard",
    gradient: "from-pink-500 to-rose-500",
    credits: 1,
  },
  {
    icon: Link2,
    label: "Backlink Analysis",
    description: "Analyze link profiles",
    path: "/backlinks",
    gradient: "from-indigo-500 to-blue-500",
    credits: 10,
  },
  {
    icon: TrendingUp,
    label: "Competitor Analysis",
    description: "Spy on competitors",
    path: "/competitor-analysis",
    gradient: "from-red-500 to-pink-500",
    credits: 5,
  },
  {
    icon: Eye,
    label: "SERP Analysis",
    description: "Study search results",
    path: "/serp-analysis",
    gradient: "from-cyan-500 to-blue-500",
    credits: 3,
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { data: credits } = useCredits();

  const handleAction = (action: QuickAction) => {
    // Check if user has enough credits
    if (action.credits && credits) {
      if (credits.available_credits < action.credits) {
        navigate("/pricing");
        return;
      }
    }
    navigate(action.path);
  };

  return (
    <div className="space-y-4">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Quick Actions
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
          </h2>
          <p className="text-muted-foreground text-sm">
            Jump into your most-used tools
          </p>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const hasEnoughCredits = !action.credits || (credits && credits.available_credits >= action.credits);
          const isMostUsed = index === 0; // Simulate "most used"
          const isRecommended = index === 1; // Simulate "recommended"

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                onClick={() => handleAction(action)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />

                {/* Top badges */}
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  {isMostUsed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" />
                        Most Used
                      </Badge>
                    </motion.div>
                  )}
                  {isRecommended && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" />
                        For You
                      </Badge>
                    </motion.div>
                  )}
                </div>

                <div className="relative p-5">
                  {/* Icon with animation */}
                  <motion.div 
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} mb-3 shadow-lg`}
                    whileHover={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: 1.1 
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>

                  {/* Content */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>

                  {/* Credits Badge and Usage */}
                  <div className="flex items-center justify-between">
                    {action.credits && (
                      <div className="flex items-center gap-1 text-xs">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                        </motion.div>
                        <span className={hasEnoughCredits ? "text-muted-foreground font-medium" : "text-red-500 font-medium"}>
                          {action.credits} {action.credits === 1 ? "credit" : "credits"}
                        </span>
                      </div>
                    )}
                    {!hasEnoughCredits && (
                      <span className="text-xs text-red-500 font-medium">
                        Upgrade
                      </span>
                    )}
                    {isMostUsed && hasEnoughCredits && (
                      <span className="text-xs text-muted-foreground">
                        47 uses
                      </span>
                    )}
                  </div>

                  {/* Hover Arrow with glow */}
                  <motion.div 
                    className="absolute bottom-4 right-4"
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
