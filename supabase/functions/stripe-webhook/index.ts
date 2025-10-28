import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe('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', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

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
        const planId = session.metadata?.plan_id;

        if (!userId || !planId) break;

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
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription updated:', subscription.id);
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

