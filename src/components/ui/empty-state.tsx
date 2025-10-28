import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        {description}
      </p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} className="gradient-primary">
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="outline">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

// Pre-configured empty states for common scenarios
export function NoDataEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").FileSearch}
      title="No Data Available"
      description="We couldn't find any data for the selected filters. Try adjusting your date range or property selection."
      actionLabel={onRefresh ? "Refresh" : undefined}
      onAction={onRefresh}
    />
  );
}

export function NoProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").FolderOpen}
      title="No Projects Yet"
      description="Create your first project to start tracking SEO performance and managing your campaigns."
      actionLabel="Create Project"
      onAction={onCreate}
    />
  );
}

export function NoPropertiesEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Globe}
      title="No Properties Connected"
      description="Connect your Google Search Console property to access performance data and insights."
      actionLabel="Connect Property"
      onAction={onConnect}
    />
  );
}

export function NoKeywordsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Key}
      title="No Keywords Tracked"
      description="Start tracking keywords to monitor your rankings and discover new opportunities."
      actionLabel="Add Keywords"
      onAction={onAdd}
    />
  );
}

export function InsufficientCreditsEmptyState({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Zap}
      title="Insufficient Credits"
      description="You don't have enough credits to perform this action. Upgrade your plan to continue."
      actionLabel="Upgrade Plan"
      onAction={onUpgrade}
    />
  );
}

export function ComingSoonEmptyState() {
  return (
    <EmptyState
      icon={require("lucide-react").Sparkles}
      title="Coming Soon"
      description="This feature is currently under development. We'll notify you when it's ready!"
    />
  );
}
