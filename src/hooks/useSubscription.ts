import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  credits_per_month: number;
  max_projects: number;
  max_team_members: number;
  features: string[];
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  plan: SubscriptionPlan;
}

export interface UserCredits {
  total_credits: number;
  used_credits: number;
  available_credits: number;
  last_reset_at: string;
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) {
        console.error('Subscription query error:', subError);
        throw subError;
      }

      if (!subData) return null;

      // Get plan separately
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', subData.plan_id)
        .single();

      if (planError) {
        console.error('Plan query error:', planError);
        // Return subscription without plan data
        return { ...subData, plan: null } as any;
      }

      // Combine
      const subscription: UserSubscription = {
        ...subData,
        plan: planData
      };
      
      return subscription;
    },
  });
}

export function useCredits() {
  return useQuery({
    queryKey: ['credits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create default credits for user
          const { data: newCredits } = await supabase
            .from('user_credits')
            .insert({ user_id: user.id, total_credits: 20, used_credits: 0 })
            .select()
            .single();
          return newCredits as UserCredits;
        }
        throw error;
      }

      return data as UserCredits;
    },
  });
}

export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planName, billingCycle }: { planName: string; billingCycle: 'monthly' | 'yearly' }) => {
      console.log('Creating checkout for:', planName, billingCycle);
      
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { planName, billingCycle },
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }
      
      if (!data?.url) {
        console.error('No URL in response:', data);
        throw new Error('No checkout URL received from server');
      }

      return data.url;
    },
    onSuccess: (url) => {
      console.log('Redirecting to checkout:', url);
      // Redirect to Stripe Checkout
      window.location.href = url;
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      toast.error(errorMessage);
    },
  });
}

export function useDeductCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      feature, 
      credits = 1, 
      projectId,
      metadata 
    }: { 
      feature: string; 
      credits?: number;
      projectId?: string;
      metadata?: any;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_feature: feature,
        p_credits: credits,
        p_project_id: projectId || null,
        p_metadata: metadata || {},
      });

      if (error) throw error;
      if (!data) throw new Error('Insufficient credits');

      return data;
    },
    onSuccess: () => {
      // Refresh credits
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
    onError: (error) => {
      console.error('Credit deduction error:', error);
      toast.error('Insufficient credits. Please upgrade your plan.');
    },
  });
}

export function hasFeatureAccess(subscription: UserSubscription | null | undefined, feature: string): boolean {
  if (!subscription) return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return false;
  
  // Check if trial is still valid
  if (subscription.status === 'trialing' && subscription.trial_end) {
    if (new Date(subscription.trial_end) < new Date()) return false;
  }
  
  // Check if current period is valid
  if (subscription.current_period_end) {
    if (new Date(subscription.current_period_end) < new Date()) return false;
  }
  
  return true;
}

