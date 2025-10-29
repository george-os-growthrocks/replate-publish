import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// Calculate bonus credits based on purchase amount
function calculateBonusCredits(credits: number): number {
  if (credits >= 5000) return 1000;
  if (credits >= 1000) return 150;
  if (credits >= 500) return 50;
  return 0;
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
      status: 400,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('Webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const purchaseType = session.metadata?.purchase_type;

        if (!userId) break;

        if (purchaseType === 'credits') {
          // Handle credit purchase
          const creditAmount = parseInt(session.metadata?.credit_amount || '0');
          const bonusCredits = calculateBonusCredits(creditAmount);
          const totalCredits = creditAmount + bonusCredits;

          // Add credits to user account
          await supabaseAdmin.rpc('add_credits', {
            p_user_id: userId,
            p_credits_amount: totalCredits,
            p_transaction_type: 'purchase',
            p_stripe_payment_intent_id: session.payment_intent as string,
            p_metadata: {
              base_credits: creditAmount,
              bonus_credits: bonusCredits,
              amount_paid: session.amount_total ? session.amount_total / 100 : 0,
            },
          });

          console.log('Credits added for user:', userId, 'Amount:', totalCredits);
        } else if (purchaseType === 'feature') {
          // Handle individual feature purchase
          const featureKey = session.metadata?.feature_key;
          if (!featureKey) break;

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          // Add feature access
          await supabaseAdmin.from('user_feature_access').upsert({
            user_id: userId,
            feature_key: featureKey,
            feature_name: featureKey.replace(/_/g, ' '),
            purchase_type: 'monthly_subscription',
            stripe_subscription_id: subscription.id,
            status: 'active',
            purchase_price: session.amount_total ? session.amount_total / 100 : 0,
            updated_at: new Date().toISOString(),
          });

          console.log('Feature unlocked for user:', userId, 'Feature:', featureKey);
        } else {
          // Handle subscription purchase
          const planId = session.metadata?.plan_id;
          if (!planId) break;

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          // Create or update subscription
          await supabaseAdmin.from('user_subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status === 'trialing' ? 'trialing' : 'active',
            billing_cycle: session.metadata?.billing_cycle || 'monthly',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          });

          console.log('Subscription created for user:', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Check if trial ended and subscription is now active
        const wasTrialing = subscription.status === 'trialing';
        const isNowActive = subscription.status === 'active';
        const trialEnded = subscription.trial_end && subscription.trial_end * 1000 < Date.now();
        
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: subscription.status as any,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // If trial ended and payment succeeded, log it
        if (trialEnded && isNowActive) {
          console.log('Trial ended, subscription now active:', subscription.id);
          // Optionally send notification email here
        }

        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const daysUntilTrialEnd = subscription.trial_end 
          ? Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
          : 0;
        
        console.log(`Trial ending soon for subscription ${subscription.id}. ${daysUntilTrialEnd} days remaining.`);
        
        // Get user to potentially send notification
        const { data: userSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (userSub && daysUntilTrialEnd <= 1) {
          // Trial ends tomorrow - could send email notification here
          console.log(`User ${userSub.user_id} trial ends tomorrow. Send reminder email.`);
        }
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription canceled:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription as string;

        // Get user from subscription
        const { data: userSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription)
          .single();

        if (userSub) {
          // Log payment
          await supabaseAdmin.from('payment_history').insert({
            user_id: userSub.user_id,
            stripe_payment_intent_id: invoice.payment_intent as string,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency,
            status: 'succeeded',
            description: invoice.description || `Payment for ${subscription}`,
          });

          console.log('Payment logged for user:', userSub.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription as string;

        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription);

        console.log('Payment failed for subscription:', subscription);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});

