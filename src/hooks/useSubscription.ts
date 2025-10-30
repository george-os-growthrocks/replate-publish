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
  features: string[] | unknown; // Allow both string[] and Json types
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
  last_reset_at?: string;
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
        return null;
      }

      // Combine
      const subscription = {
        ...subData,
        plan: planData
      } as UserSubscription;
      
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

      // Try to get existing credits
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

      if (error && error.code !== 'PGRST116') {
        console.error('Credits query error:', error);
        throw error;
      }

      // If no credits exist, check if user has subscription and create credits accordingly
      if (!data) {
        // Check for subscription
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*, subscription_plans:plan_id(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        const defaultCredits = subscription?.subscription_plans?.credits_per_month || 100;

        // Create credits based on subscription or default
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({ 
            user_id: user.id, 
            total_credits: defaultCredits, 
            used_credits: 0 
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create credits:', insertError);
          // Return a default object if insert fails
          return {
            total_credits: defaultCredits,
            used_credits: 0,
            available_credits: defaultCredits,
          } as UserCredits;
        }

        return newCredits as UserCredits;
      }

      return data as UserCredits;
    },
  });
}

export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planName, billingCycle }: { planName: string; billingCycle: 'monthly' | 'yearly' }) => {
      console.log('🚀 Creating checkout for:', planName, billingCycle);
      
      // Verify user is authenticated first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No active session:', sessionError);
        throw new Error('Please sign in to continue. Redirecting to sign in page...');
      }
      
      console.log('✅ User session verified:', session.user.id);
      
      // Use Supabase client's invoke method which handles auth automatically
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planName, 
          billingCycle
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }
      
      // Check for application errors in the response data
      if (data?.error) {
        console.error('❌ Function returned error:', data.error);
        throw new Error(data.error);
      }
      
      // Check for missing URL
      if (!data?.url) {
        console.error('❌ No URL in response. Full data:', JSON.stringify(data));
        throw new Error(`No checkout URL received. Response: ${JSON.stringify(data)}`);
      }

      console.log('✅ Checkout URL received:', data.url);
      return data.url;
    },
    onSuccess: (url) => {
      console.log('✅ Redirecting to checkout:', url);
      // Redirect to Stripe Checkout
      window.location.href = url;
    },
    onError: (error) => {
      console.error('❌ Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      
      // If not authenticated, redirect to auth page
      if (errorMessage.includes('authenticated') || errorMessage.includes('sign in')) {
        toast.error('Please sign in to upgrade your plan');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
      } else {
        toast.error(errorMessage);
      }
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
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-expect-error - RPC function may not be in generated types yet
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

/**
 * Hook to check Stripe subscription status in real-time
 * This queries the subscriptions table which is the source of truth from Stripe webhooks
 * Useful for checking if a payment has been processed and synced
 */
export function useStripeSubscriptionStatus() {
  return useQuery({
    queryKey: ['stripe-subscription-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Check Stripe subscriptions table (source of truth from webhooks)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching Stripe subscription status:', error);
        return null;
      }
      
      return data;
    },
    refetchInterval: 10000, // Check every 10 seconds for updates
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}

