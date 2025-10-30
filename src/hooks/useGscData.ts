import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GscRow } from "@/types/gsc";
import { toast } from "sonner";

interface DimensionFilter {
  dimension: string;
  operator: string;
  expression: string;
}

interface DimensionFilterGroup {
  filters: DimensionFilter[];
}

interface GSCApiRow {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  keys: string[];
}

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
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Please sign in to view data");
        }
        
        // Get OAuth token from database
        const { data: tokenData, error: tokenError } = await supabase
          .from('user_oauth_tokens')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .maybeSingle();
        
        if (tokenError || !tokenData) {
          throw new Error("No Google connection found. Please sign in with Google.");
        }

      const dimensionFilterGroups: DimensionFilterGroup[] = [];

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
          provider_token: tokenData.access_token,
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
      const rows: GscRow[] = data.rows.map((row: GSCApiRow) => {
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
          if (dim === "device") {
            const deviceValue = keys[index];
            if (deviceValue === "DESKTOP" || deviceValue === "MOBILE" || deviceValue === "TABLET") {
              result.device = deviceValue;
            }
          }
          if (dim === "date") result.date = keys[index];
        });

        return result;
      });

      return rows;
      } catch (error: any) {
        // Handle token expiry and authentication errors
        const errorMessage = error?.message || String(error);
        
        if (
          errorMessage.includes('token') || 
          errorMessage.includes('401') || 
          errorMessage.includes('expired') ||
          errorMessage.includes('unauthorized')
        ) {
          console.error('🔐 Authentication/token error detected:', errorMessage);
          
          // Show user-friendly error
          const toast = await import('sonner').then(m => m.toast);
          toast.error('Session expired. Please sign in again.', {
            description: 'Your Google connection needs to be refreshed.',
            duration: 4000,
          });
          
          // Redirect to auth page after a short delay
          setTimeout(() => {
            window.location.href = '/auth';
          }, 2000);
        }
        
        // Re-throw the error so React Query can handle it
        throw error;
      }
    },
    enabled: enabled && !!propertyUrl && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

