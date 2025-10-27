import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Search, TrendingUp, BarChart3, Link2, Target } from "lucide-react";

export default function NotFound() {
  const popularPages = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Queries", path: "/queries", icon: Search },
    { name: "Keyword Research", path: "/keyword-research", icon: Target },
    { name: "Backlinks", path: "/backlinks", icon: Link2 },
    { name: "SERP Analysis", path: "/serp-analysis", icon: TrendingUp },
    { name: "Site Audit", path: "/site-audit", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <Card className="max-w-2xl w-full p-8 bg-slate-950/80 border-white/10">
        <div className="text-center mb-8">
          <div className="text-8xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            404
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
            Popular Pages
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {popularPages.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-primary/50 hover:bg-slate-900 transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{page.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link to="/">
              <Search className="mr-2 h-4 w-4" />
              Homepage
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
