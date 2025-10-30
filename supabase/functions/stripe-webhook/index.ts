import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE || !WEBHOOK_SECRET) {
  throw new Error('Missing required env vars for stripe-webhook');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature' } });

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('No signature', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed. ${err}`, { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  async function upsertSub(sub: Stripe.Subscription, userId: string) {
    const item = sub.items.data[0];
    await admin.from('subscriptions').upsert({
      id: sub.id,
      user_id: userId,
      status: sub.status,
      price_id: item?.price?.id ?? null,
      product_id: (item?.price?.product as string) ?? null,
      quantity: item?.quantity ?? 1,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      raw: sub as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer && session.metadata?.supabase_uid) {
        await admin.from('stripe_customers').upsert({
          user_id: session.metadata.supabase_uid,
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      let uid = (sub.metadata?.supabase_uid as string) ?? null;
      if (!uid && typeof sub.customer === 'string') {
        const { data } = await admin
          .from('stripe_customers')
          .select('user_id')
          .eq('stripe_customer_id', sub.customer)
          .maybeSingle();
        uid = data?.user_id ?? null;
      }
      if (uid) await upsertSub(sub, uid);
      break;
    }
    case 'customer.subscription.trial_will_end': {
      // Optional: notify user via email/push
      break;
    }
    case 'invoice.payment_succeeded': {
      // Marker for trial->active transition
      break;
    }
    default:
      break;
  }

  return new Response('ok', { status: 200 });
});

