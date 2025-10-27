import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  description?: string;
  loading?: boolean;
}

export function EnhancedMetricCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  description,
  loading = false,
}: EnhancedMetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-4 w-4" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 bg-green-50";
    if (trend === "down") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            {change !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  getTrendColor()
                )}
              >
                {getTrendIcon()}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
}

