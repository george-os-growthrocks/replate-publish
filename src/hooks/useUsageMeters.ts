/**
 * Hooks for usage meter tracking
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageMeter {
  id: string;
  user_id: string;
  meter_date: string;
  tracked_keywords: number;
  crawled_urls: number;
  briefs_generated: number;
  reports_rendered: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get current usage meter for today
 */
export function useUsageMeters() {
  return useQuery({
    queryKey: ['usage-meters'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('usage_meters')
        .select('*')
        .eq('user_id', user.id)
        .eq('meter_date', today)
        .maybeSingle();

      if (error) throw error;
      return data as UsageMeter | null;
    },
  });
}

/**
 * Get monthly usage summary (sum of current month)
 */
export function useMonthlyUsage() {
  return useQuery({
    queryKey: ['monthly-usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('usage_meters')
        .select('tracked_keywords, crawled_urls, briefs_generated, reports_rendered')
        .eq('user_id', user.id)
        .gte('meter_date', startOfMonth.toISOString().split('T')[0]);

      if (error) throw error;
      
      // Sum up all values
      const summary = data.reduce(
        (acc, meter) => ({
          tracked_keywords: acc.tracked_keywords + meter.tracked_keywords,
          crawled_urls: acc.crawled_urls + meter.crawled_urls,
          briefs_generated: acc.briefs_generated + meter.briefs_generated,
          reports_rendered: acc.reports_rendered + meter.reports_rendered,
        }),
        {
          tracked_keywords: 0,
          crawled_urls: 0,
          briefs_generated: 0,
          reports_rendered: 0,
        }
      );
      
      return summary;
    },
  });
}

/**
 * Increment usage meter for a specific type
 */
export function useIncrementUsageMeter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      amount = 1,
    }: {
      type: 'tracked_keywords' | 'crawled_urls' | 'briefs_generated' | 'reports_rendered';
      amount?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Use upsert to create or update
      const { data, error } = await supabase
        .from('usage_meters')
        .upsert(
          {
            user_id: user.id,
            meter_date: today,
            [type]: amount,
          },
          {
            onConflict: 'user_id,meter_date',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        // If record exists, increment it
        const { data: existing } = await supabase
          .from('usage_meters')
          .select('*')
          .eq('user_id', user.id)
          .eq('meter_date', today)
          .single();

        if (existing) {
          const { data: updated, error: updateError } = await supabase
            .from('usage_meters')
            .update({
              [type]: (existing[type] || 0) + amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;
          return updated;
        }

        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-meters'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-usage'] });
    },
  });
}

