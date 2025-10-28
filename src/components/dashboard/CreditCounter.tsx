import { useCredits } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Zap, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function CreditCounter() {
  const { data: credits, isLoading } = useCredits();

  if (isLoading || !credits) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full animate-pulse">
        <Zap className="w-4 h-4" />
        <span className="text-sm font-medium">---</span>
      </div>
    );
  }

  const usagePercent = (credits.used_credits / credits.total_credits) * 100;
  const isLow = credits.available_credits < credits.total_credits * 0.2;
  const isCritical = credits.available_credits < credits.total_credits * 0.1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 h-auto rounded-full transition-all",
            isCritical && "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400",
            isLow && !isCritical && "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400",
            !isLow && "bg-primary/10 hover:bg-primary/20"
          )}
        >
          {isCritical && <AlertCircle className="w-4 h-4 animate-pulse" />}
          {!isCritical && <Zap className="w-4 h-4" />}
          <span className="text-sm font-semibold hidden sm:inline">
            {credits.available_credits.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground hidden md:inline">
            / {credits.total_credits.toLocaleString()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Monthly Credits</h4>
              <Badge variant={isCritical ? "destructive" : isLow ? "secondary" : "default"}>
                {usagePercent.toFixed(0)}% used
              </Badge>
            </div>
            <Progress 
              value={usagePercent} 
              className={cn(
                "h-2",
                isCritical && "[&>div]:bg-red-500",
                isLow && !isCritical && "[&>div]:bg-amber-500"
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-primary">
                {credits.available_credits.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-amber-500">
                {credits.used_credits.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Used</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">
                {credits.total_credits.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {credits.last_reset_at && (
            <p className="text-xs text-muted-foreground text-center">
              Resets on {new Date(credits.last_reset_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          )}

          {isLow && (
            <div className={cn(
              "p-3 rounded-lg border",
              isCritical 
                ? "bg-red-500/10 border-red-500/20" 
                : "bg-amber-500/10 border-amber-500/20"
            )}>
              <p className={cn(
                "text-sm font-semibold mb-1",
                isCritical 
                  ? "text-red-700 dark:text-red-400" 
                  : "text-amber-700 dark:text-amber-400"
              )}>
                {isCritical ? "⚠️ Critical: Almost Out!" : "⚡ Running Low"}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                You have {credits.available_credits} credits remaining
              </p>
              <Button asChild size="sm" className="w-full gradient-primary">
                <Link to="/pricing">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          )}

          <Button asChild variant="outline" className="w-full" size="sm">
            <Link to="/settings">
              View Usage Details
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
