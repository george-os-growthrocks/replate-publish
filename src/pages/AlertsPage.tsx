import { useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { detectAnomalies } from "@/lib/cannibalization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Bell,
} from "lucide-react";

export default function AlertsPage() {
  const { propertyUrl, dateRange, country, device } = useFilters();

  // Current period
  const { data: currentRows, isLoading: currentLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
    device,
  });

  // Previous period (same duration)
  const previousPeriod = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return undefined;
    
    const duration = dateRange.to.getTime() - dateRange.from.getTime();
    const prevEnd = new Date(dateRange.from.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    
    return {
      from: prevStart.toISOString().split("T")[0],
      to: prevEnd.toISOString().split("T")[0],
    };
  }, [dateRange]);

  const { data: previousRows, isLoading: previousLoading } = useGscData({
    propertyUrl,
    startDate: previousPeriod?.from || "",
    endDate: previousPeriod?.to || "",
    country,
    device,
    enabled: !!previousPeriod,
  });

  const alerts = useMemo(() => {
    if (!currentRows || !previousRows) return [];
    return detectAnomalies(currentRows, previousRows, 0.2); // 20% threshold
  }, [currentRows, previousRows]);

  const isLoading = currentLoading || previousLoading;

  const highSeverityAlerts = alerts.filter((a) => a.severity === "HIGH");
  const mediumSeverityAlerts = alerts.filter((a) => a.severity === "MEDIUM");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Performance Alerts</h1>
        <p className="text-muted-foreground mt-1">
          Anomaly detection for significant changes in your metrics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Alerts</div>
          <div className="text-2xl font-bold mt-1">{alerts.length}</div>
        </Card>
        <Card className="p-4 border-red-500/50">
          <div className="text-sm text-muted-foreground">High Severity</div>
          <div className="text-2xl font-bold mt-1 text-red-500">
            {highSeverityAlerts.length}
          </div>
        </Card>
        <Card className="p-4 border-amber-500/50">
          <div className="text-sm text-muted-foreground">Medium Severity</div>
          <div className="text-2xl font-bold mt-1 text-amber-500">
            {mediumSeverityAlerts.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Monitoring</div>
          <div className="text-2xl font-bold mt-1 flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-500" />
            Active
          </div>
        </Card>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Alerts Detected</h3>
          <p className="text-muted-foreground">
            Your metrics are stable compared to the previous period
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* High Severity Alerts */}
          {highSeverityAlerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                High Severity Alerts
              </h3>
              <div className="space-y-3">
                {highSeverityAlerts.map((alert, idx) => (
                  <Alert
                    key={idx}
                    variant="destructive"
                    className="border-red-500/50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>
                        {alert.type === "CLICKS_DROP" && "Significant Click Drop"}
                        {alert.type === "CTR_DROP" && "CTR Decline Detected"}
                        {alert.type === "POSITION_DROP" && "Position Loss"}
                      </span>
                      <Badge variant="destructive" className="ml-4">
                        {(alert.change * 100).toFixed(1)}% decrease
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs truncate max-w-lg">
                          {alert.item}
                        </span>
                        <TrendingDown className="h-4 w-4 ml-4 flex-shrink-0" />
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Medium Severity Alerts */}
          {mediumSeverityAlerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Medium Severity Alerts
              </h3>
              <div className="space-y-3">
                {mediumSeverityAlerts.map((alert, idx) => (
                  <Alert
                    key={idx}
                    className="border-amber-500/50 bg-amber-500/5"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>
                        {alert.type === "CLICKS_DROP" && "Click Drop"}
                        {alert.type === "CTR_DROP" && "CTR Decline"}
                        {alert.type === "POSITION_DROP" && "Position Loss"}
                      </span>
                      <Badge variant="outline" className="ml-4 border-amber-500 text-amber-600">
                        {(alert.change * 100).toFixed(1)}% decrease
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs truncate max-w-lg">
                          {alert.item}
                        </span>
                        <TrendingDown className="h-4 w-4 ml-4 flex-shrink-0 text-amber-500" />
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-500/5 border-blue-500/20">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          About Alert Detection
        </h3>
        <div className="text-sm space-y-2">
          <p>
            Alerts are generated by comparing the current period with the previous period of equal duration.
          </p>
          <p>
            <strong>High Severity:</strong> Drops of 50% or more
          </p>
          <p>
            <strong>Medium Severity:</strong> Drops of 20-50%
          </p>
          <p className="text-muted-foreground">
            Current period: {dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString()}
            <br />
            Comparison period: {previousPeriod && new Date(previousPeriod.from).toLocaleDateString()} - {previousPeriod && new Date(previousPeriod.to).toLocaleDateString()}
          </p>
        </div>
      </Card>
    </div>
  );
}

