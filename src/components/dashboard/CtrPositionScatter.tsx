import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import { useGscData } from "@/hooks/useGscData";
import { groupByQuery } from "@/lib/cannibalization";
import { Skeleton } from "@/components/ui/skeleton";

interface CtrPositionScatterProps {
  propertyUrl: string;
  startDate: string;
  endDate: string;
}

export function CtrPositionScatter({
  propertyUrl,
  startDate,
  endDate,
}: CtrPositionScatterProps) {
  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate,
    endDate,
  });

  const scatterData = useMemo(() => {
    if (!rows) return [];
    
    const queries = groupByQuery(rows);
    
    // Take top 100 queries by impressions for visualization
    return queries
      .slice(0, 100)
      .map((q) => ({
        query: q.query,
        position: q.avgPosition,
        ctr: q.avgCtr * 100, // Convert to percentage
        clicks: q.totalClicks,
        impressions: q.totalImpressions,
      }));
  }, [rows]);

  // Calculate average CTR as benchmark
  const avgCtr = scatterData.length > 0
    ? scatterData.reduce((sum, d) => sum + d.ctr, 0) / scatterData.length
    : 3;

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">CTR vs Position Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Quick wins in the top-right quadrant (high CTR, good position)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="position"
            name="Position"
            reversed
            domain={[1, 20]}
          >
            <Label value="Position (better →)" offset={-10} position="insideBottom" />
          </XAxis>
          <YAxis
            type="number"
            dataKey="ctr"
            name="CTR"
            unit="%"
          >
            <Label value="CTR %" angle={-90} position="insideLeft" />
          </YAxis>
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-sm mb-2 max-w-xs truncate">
                      {data.query}
                    </p>
                    <div className="space-y-1 text-xs">
                      <p>Position: {data.position.toFixed(1)}</p>
                      <p>CTR: {data.ctr.toFixed(2)}%</p>
                      <p>Clicks: {data.clicks.toLocaleString()}</p>
                      <p>Impressions: {data.impressions.toLocaleString()}</p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          
          {/* Benchmark lines */}
          <ReferenceLine
            x={12}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{ value: "Page 2", fill: "#94a3b8", fontSize: 12 }}
          />
          <ReferenceLine
            y={avgCtr}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{ value: "Avg CTR", fill: "#94a3b8", fontSize: 12 }}
          />
          
          {/* Scatter points */}
          <Scatter
            data={scatterData}
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="font-semibold text-green-700 dark:text-green-400">
            Quick Wins (Top-Left)
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Good position, high CTR - already performing well
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="font-semibold text-blue-700 dark:text-blue-400">
            Improve CTR (Top-Right)
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Good position, low CTR - optimize meta descriptions
          </div>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="font-semibold text-amber-700 dark:text-amber-400">
            Boost Rankings (Bottom-Left)
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Poor position, high CTR - add content & backlinks
          </div>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="font-semibold text-red-700 dark:text-red-400">
            Needs Work (Bottom-Right)
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Poor position, low CTR - comprehensive optimization needed
          </div>
        </div>
      </div>
    </Card>
  );
}

