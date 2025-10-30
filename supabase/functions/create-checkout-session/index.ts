import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Missing required environment variables for Stripe checkout function');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🎯 Create checkout session function called');
  console.log('🔧 Environment check - STRIPE_SECRET_KEY exists:', !!Deno.env.get('STRIPE_SECRET_KEY'));
  console.log('🔧 Environment check - SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
  console.log('🔧 Environment check - SERVICE_ROLE exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  if (req.method === 'OPTIONS') {
    console.log('📋 Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    console.log('📥 Starting checkout session creation');
    const authHeader = req.headers.get('Authorization') ?? '';
    console.log('🔐 Auth header present:', !!authHeader, 'length:', authHeader.length);

    if (!authHeader) {
      console.log('❌ No authorization header found');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Decode JWT token to get user ID
    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token received, length:', token.length);
    let userId: string;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      console.log('✅ JWT decoded successfully, userId:', userId);

      if (!userId) {
        throw new Error('Invalid token: no user ID found');
      }
    } catch (jwtError) {
      console.error('❌ JWT decoding error:', jwtError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin client (service role) to read pricing and upsert mapping
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    console.log('🔧 Created admin client');

    const { planName, billingCycle = 'monthly', successUrl, cancelUrl } = await req.json();
    console.log('📋 Parsed request body:', { planName, billingCycle });

    if (!planName) {
      return new Response(JSON.stringify({ error: 'Missing planName' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Look up price id from subscription_plans
    const { data: planRow, error: planError } = await admin
      .from('subscription_plans')
      .select('id, name, stripe_price_id_monthly, stripe_price_id_yearly')
      .eq('name', planName)
      .maybeSingle();

    if (planError || !planRow) {
      console.error('❌ Plan lookup error:', planError);
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const priceId = billingCycle === 'yearly' ? (planRow as any).stripe_price_id_yearly : (planRow as any).stripe_price_id_monthly;
    if (!priceId) {
      console.error('❌ No price ID found for plan:', planName, 'billing cycle:', billingCycle);
      console.error('Available data in plan row:', planRow);
      return new Response(JSON.stringify({
        error: 'Stripe price not configured for plan. Please run the SQL update script.',
        planName,
        billingCycle,
        planData: planRow
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('💰 Using price ID:', priceId);

    // Get user email using auth admin API
    const { data: userData, error: userFetchError } = await admin.auth.admin.getUserById(userId);

    if (userFetchError || !userData?.user) {
      console.error('❌ User lookup error:', userFetchError);
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('👤 User found:', userData.user.email);

    // Ensure stripe customer mapping
    const { data: existing } = await admin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id as string | undefined;
    console.log('💳 Existing customer ID:', customerId);

    if (!customerId) {
      console.log('🆕 Creating new Stripe customer');
      const customer = await stripe.customers.create({
        email: userData.user.email ?? undefined,
        metadata: { supabase_uid: userId },
      });
      customerId = customer.id;
      console.log('✅ Created customer:', customerId);

      await admin.from('stripe_customers').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      });
      console.log('✅ Customer mapping saved');
    }

    const origin = successUrl ? new URL(successUrl).origin : new URL(req.url).origin;
    console.log('🏗️ Creating checkout session with origin:', origin);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: successUrl ?? `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${origin}/billing/cancelled`,
      allow_promotion_codes: true,
      line_items: [{ price: priceId as string, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_uid: userId },
      },
      automatic_tax: { enabled: true },
    });

    console.log('✅ Checkout session created:', session.id);
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('💥 Unexpected error in create-checkout-session:', e);
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack trace');
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      details: 'Check Supabase function logs for more details'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


