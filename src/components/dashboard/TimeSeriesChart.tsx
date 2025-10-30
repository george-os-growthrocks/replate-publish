import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimeSeriesChartProps {
  propertyUrl: string;
  startDate: string;
  endDate: string;
}

const TimeSeriesChart = ({ propertyUrl, startDate, endDate }: TimeSeriesChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimeSeriesData();
  }, [propertyUrl, startDate, endDate]);

  const fetchTimeSeriesData = async () => {
    try {
      setIsLoading(true);
      
      // Verify user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to view data");
        return;
      }

      // gsc-query will get provider_token from database using Authorization header
      const { data, error } = await supabase.functions.invoke("gsc-query", {
        body: {
          siteUrl: propertyUrl,
          startDate,
          endDate,
          dimensions: ["date"],
        },
      });

      if (error) {
        console.error("GSC query error details:", error);
        console.error("Error data:", data);
        throw error;
      }
      
      // Check for application errors
      if (data?.error) {
        console.error("GSC API error:", data.error);
        throw new Error(data.error);
      }

      if (data?.rows) {
        const formatted = data.rows.map((row: any) => ({
          date: new Date(row.keys[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: (row.ctr * 100).toFixed(2),
          position: row.position.toFixed(1),
        }));
        setChartData(formatted);
      }
    } catch (error) {
      console.error("Error fetching time series:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-80 bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border shadow-soft">
      <h3 className="text-lg font-semibold mb-6">Performance Over Time</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="clicks" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="impressions" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TimeSeriesChart;
