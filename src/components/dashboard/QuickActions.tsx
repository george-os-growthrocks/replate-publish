import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useCredits } from "@/hooks/useSubscription";

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <p className="text-muted-foreground text-sm">
            Jump into your most-used tools
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const hasEnoughCredits = !action.credits || (credits && credits.available_credits >= action.credits);

          return (
            <Card
              key={index}
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => handleAction(action)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              <div className="relative p-5">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="mb-3">
                  <h3 className="font-semibold text-sm mb-1">{action.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>

                {/* Credits Badge */}
                {action.credits && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className={hasEnoughCredits ? "text-muted-foreground" : "text-red-500"}>
                        {action.credits} {action.credits === 1 ? "credit" : "credits"}
                      </span>
                    </div>
                    {!hasEnoughCredits && (
                      <span className="text-xs text-red-500 font-medium">
                        Upgrade
                      </span>
                    )}
                  </div>
                )}

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
