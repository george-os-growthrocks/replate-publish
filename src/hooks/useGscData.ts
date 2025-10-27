import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GscRow } from "@/types/gsc";
import { toast } from "sonner";

interface UseGscDataOptions {
  propertyUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  country?: string;
  device?: string;
  enabled?: boolean;
}

export function useGscData(options: UseGscDataOptions) {
  const {
    propertyUrl,
    startDate,
    endDate,
    dimensions = ["query", "page", "country", "device"],
    country,
    device,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ["gsc-data", propertyUrl, startDate, endDate, dimensions, country, device],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        throw new Error("No Google access token. Please sign out and sign in again.");
      }

      const dimensionFilterGroups: any[] = [];

      // Add country filter if specified
      if (country && country !== "ALL") {
        dimensionFilterGroups.push({
          filters: [{
            dimension: "country",
            operator: "equals",
            expression: country,
          }],
        });
      }

      // Add device filter if specified
      if (device && device !== "ALL") {
        dimensionFilterGroups.push({
          filters: [{
            dimension: "device",
            operator: "equals",
            expression: device,
          }],
        });
      }

      const { data, error } = await supabase.functions.invoke("gsc-query", {
        body: {
          provider_token: session.provider_token,
          siteUrl: propertyUrl,
          startDate,
          endDate,
          dimensions,
          rowLimit: 25000,
          ...(dimensionFilterGroups.length > 0 && { dimensionFilterGroups }),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data?.rows) {
        return [];
      }

      // Transform rows to typed format
      const rows: GscRow[] = data.rows.map((row: any) => {
        const result: GscRow = {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        };

        // Map dimensions by index
        const keys = row.keys || [];
        dimensions.forEach((dim, index) => {
          if (dim === "query") result.query = keys[index];
          if (dim === "page") result.page = keys[index];
          if (dim === "country") result.country = keys[index];
          if (dim === "device") result.device = keys[index];
          if (dim === "date") result.date = keys[index];
        });

        return result;
      });

      return rows;
    },
    enabled: enabled && !!propertyUrl && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error("Error fetching GSC data:", error);
      toast.error("Failed to fetch Search Console data");
    },
  });
}

