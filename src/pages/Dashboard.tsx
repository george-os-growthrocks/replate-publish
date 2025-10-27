import { useFilters } from "@/contexts/FilterContext";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import TimeSeriesChart from "@/components/dashboard/TimeSeriesChart";
import QueryTable from "@/components/dashboard/QueryTable";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import { CtrPositionScatter } from "@/components/dashboard/CtrPositionScatter";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, MousePointerClick, BarChart } from "lucide-react";

const Dashboard = () => {
  const { propertyUrl, dateRange } = useFilters();

  const startDate = dateRange?.from?.toISOString().split("T")[0] || "";
  const endDate = dateRange?.to?.toISOString().split("T")[0] || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Your Search Console performance at a glance
        </p>
      </div>

      {propertyUrl && startDate && endDate ? (
        <>
          {/* Metrics Overview */}
          <MetricsOverview 
            propertyUrl={propertyUrl}
            startDate={startDate}
            endDate={endDate}
          />

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TimeSeriesChart 
                propertyUrl={propertyUrl}
                startDate={startDate}
                endDate={endDate}
              />
              <CtrPositionScatter
                propertyUrl={propertyUrl}
                startDate={startDate}
                endDate={endDate}
              />
              <QueryTable 
                propertyUrl={propertyUrl}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
            <div>
              <InsightsPanel 
                propertyUrl={propertyUrl}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Select a Property</h3>
            <p className="text-muted-foreground">
              Choose a Search Console property from the selector above to start analyzing your data.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
