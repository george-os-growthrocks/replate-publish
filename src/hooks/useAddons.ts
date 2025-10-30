/**
 * Hooks for add-ons management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AddonType = 'seats' | 'projects' | 'rank_pack' | 'crawl_pack' | 'credits' | 'local_pack';

export interface Addon {
  id: string;
  user_id: string;
  addon_type: AddonType;
  quantity: number;
  stripe_subscription_id: string | null;
  status: 'active' | 'canceled' | 'expired';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

/**
 * Get all active add-ons for the user
 */
export function useAddons() {
  return useQuery({
    queryKey: ['addons'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Addon[];
    },
  });
}

/**
 * Cancel an add-on
 */
export function useCancelAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addonId: string) => {
      const { error } = await supabase
        .from('add_ons')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', addonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}

