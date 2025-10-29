// Utility to check and debug trial status
import { supabase } from "@/integrations/supabase/client";

export async function checkTrialStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user found');
      return null;
    }

    console.log('🔍 Checking trial status for user:', user.id);

    // Check subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id (
          id,
          name,
          price_monthly,
          credits_per_month
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('❌ Subscription query error:', subError);
      return null;
    }

    if (!subscription) {
      console.log('⚠️ No subscription found for user');
      return null;
    }

    console.log('✅ Subscription found:', {
      id: subscription.id,
      status: subscription.status,
      trial_end: subscription.trial_end,
      plan: subscription.subscription_plans?.name,
      is_first_trial: subscription.is_first_trial,
    });

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('has_used_trial, onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profileError && profile) {
      console.log('✅ Profile found:', {
        has_used_trial: profile.has_used_trial,
        onboarding_completed: profile.onboarding_completed,
      });
    }

    // Check credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!creditsError && credits) {
      console.log('✅ Credits found:', {
        total: credits.total_credits,
        used: credits.used_credits,
        available: credits.available_credits,
      });
    }

    return {
      subscription,
      profile,
      credits,
    };
  } catch (error) {
    console.error('❌ Error checking trial status:', error);
    return null;
  }
}

// Function to manually assign trial to existing user
export async function assignTrialManually() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user found');
      return null;
    }

    console.log('🔄 Attempting to assign trial to user:', user.id);

    // Call the function
    const { data, error } = await supabase.rpc('assign_trial_to_existing_user', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('❌ Failed to assign trial:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Trial assignment result:', data);
    return data;
  } catch (error) {
    console.error('❌ Error assigning trial:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

