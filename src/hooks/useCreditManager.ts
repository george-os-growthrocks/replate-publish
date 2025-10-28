import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCreditCost, type FeatureKey } from '@/lib/credit-costs';
import { useToast } from '@/hooks/use-toast';
import { trackFeatureUsage } from '@/lib/utils';

interface CreditState {
  total: number;
  used: number;
  available: number;
}

interface ConsumeCreditsParams {
  feature: FeatureKey;
  amount?: number;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

interface ConsumeCreditsResponse {
  success: boolean;
  error?: string;
  required?: number;
  available?: number;
  credits_consumed?: number;
  credits_before?: number;
  credits_after?: number;
}

/**
 * Hook for managing user credits
 * Provides functions to check, consume, and track credit usage
 */
export function useCreditManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  // Fetch current credit state
  const { data: credits, isLoading: isLoadingCredits, refetch: refetchCredits } = useQuery({
    queryKey: ['user-credits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_credits')
        .select('total_credits, used_credits, available_credits')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return {
        total: data?.total_credits || 0,
        used: data?.used_credits || 0,
        available: data?.available_credits || 0,
      } as CreditState;
    },
  });

  // Consume credits mutation
  const consumeMutation = useMutation({
    mutationFn: async (params: ConsumeCreditsParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const creditsToConsume = params.amount || getCreditCost(params.feature);

      const { data, error } = await supabase.rpc('consume_credits_with_transaction', {
        p_user_id: user.id,
        p_feature_name: params.feature,
        p_credits_amount: creditsToConsume,
        p_project_id: params.projectId || null,
        p_metadata: params.metadata || {},
      });

      if (error) throw error;

      return data as ConsumeCreditsResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate credits query to refresh
        queryClient.invalidateQueries({ queryKey: ['user-credits'] });
        queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      }
    },
  });

  /**
   * Check if user has enough credits for a feature
   */
  const checkCredits = useCallback(
    async (feature: FeatureKey, amount?: number): Promise<boolean> => {
      setIsChecking(true);
      try {
        const requiredCredits = amount || getCreditCost(feature);
        const currentCredits = credits?.available || 0;

        if (currentCredits < requiredCredits) {
          toast({
            title: 'Insufficient Credits',
            description: `You need ${requiredCredits} credits for this action. You have ${currentCredits} credits remaining.`,
            variant: 'destructive',
          });
          return false;
        }

        return true;
      } finally {
        setIsChecking(false);
      }
    },
    [credits, toast]
  );

  /**
   * Consume credits for a feature
   */
  const consumeCredits = useCallback(
    async (params: ConsumeCreditsParams): Promise<ConsumeCreditsResponse> => {
      try {
        const result = await consumeMutation.mutateAsync(params);

        if (!result.success) {
          toast({
            title: 'Credit Error',
            description: result.error || 'Failed to consume credits',
            variant: 'destructive',
          });
        } else {
          // Track successful feature usage in Google Analytics
          const creditsUsed = params.amount || getCreditCost(params.feature);
          trackFeatureUsage(params.feature, creditsUsed);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          title: 'Error',
          description: `Failed to consume credits: ${errorMessage}`,
          variant: 'destructive',
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [consumeMutation, toast]
  );

  /**
   * Check feature access (including individual purchases)
   */
  const hasFeatureAccess = useCallback(
    async (featureKey: string): Promise<boolean> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_feature_access', {
        p_user_id: user.id,
        p_feature_key: featureKey,
      });

      if (error) {
        console.error('Feature access check error:', error);
        return false;
      }

      return data as boolean;
    },
    []
  );

  /**
   * Get credit transactions history
   */
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['credit-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data;
    },
  });

  /**
   * Check if user has unlimited credits (Agency plan)
   */
  const hasUnlimitedCredits = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan:subscription_plans(has_unlimited_credits)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) return false;

    return (data.plan as { has_unlimited_credits: boolean })?.has_unlimited_credits || false;
  }, []);

  return {
    // Credit state
    credits,
    isLoadingCredits,
    refetchCredits,
    
    // Actions
    checkCredits,
    consumeCredits,
    hasFeatureAccess,
    hasUnlimitedCredits,
    
    // Transactions
    transactions,
    isLoadingTransactions,
    
    // Status
    isChecking,
    isConsuming: consumeMutation.isPending,
  };
}

/**
 * Simplified hook for just checking/consuming credits
 */
export function useCredits() {
  const { credits, checkCredits, consumeCredits, isLoadingCredits } = useCreditManager();
  
  return {
    available: credits?.available || 0,
    total: credits?.total || 0,
    used: credits?.used || 0,
    checkCredits,
    consumeCredits,
    isLoading: isLoadingCredits,
  };
}

