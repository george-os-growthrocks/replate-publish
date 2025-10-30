import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Credit pricing calculator
function calculateCreditPrice(credits: number): number {
  if (credits <= 100) return 10;
  if (credits <= 500) return 40;
  if (credits <= 1000) return 70;
  if (credits <= 5000) return 300;
  // Custom amount: $0.10 per credit
  return Math.ceil(credits * 0.1);
}

// Calculate bonus credits based on purchase amount
function calculateBonusCredits(credits: number): number {
  if (credits >= 5000) return 1000;
  if (credits >= 1000) return 150;
  if (credits >= 500) return 50;
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎯 Stripe checkout function called - VERSION 3.0 - FIXED AUTH');
    const authHeader = req.headers.get('Authorization') ?? '';
    console.log('🔐 Auth header present:', !!authHeader);

    if (!authHeader) {
      console.log('❌ No authorization header found');
      throw new Error('Missing authorization header');
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
      throw new Error('Invalid authentication token');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user email from auth.users table
    const { data: userData, error: userFetchError } = await supabaseClient
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userFetchError || !userData) {
      throw new Error('User not found');
    }

    const body = await req.json();
    const { planName, billingCycle, purchaseType, credits, featureKey } = body;
    // purchaseType: 'subscription' | 'credits' | 'feature'

    console.log('Checkout request:', { planName, billingCycle, purchaseType, credits, featureKey });

    // Get or create Stripe customer
    let customerId: string;
    
    const { data: existingSub } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
    }

    let session;

    // Handle different purchase types
    if (purchaseType === 'credits') {
      // One-time credit purchase
      const creditAmount = credits || 100;
      const price = calculateCreditPrice(creditAmount);

      // Create product for credits
      const product = await stripe.products.create({
        name: `${creditAmount} Credits`,
        description: `One-time purchase of ${creditAmount} credits for AnotherSEOGuru`,
      });

      // Create price
      const creditPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100),
        currency: 'usd',
      });

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: creditPrice.id,
            quantity: 1,
          },
        ],
        success_url: `${req.headers.get('origin')}/dashboard?credits_purchased={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/settings?tab=subscription`,
        metadata: {
          user_id: userId,
          purchase_type: 'credits',
          credit_amount: creditAmount.toString(),
        },
      });
    } else if (purchaseType === 'feature') {
      // Individual feature purchase (monthly subscription)
      if (!featureKey) {
        throw new Error('Feature key is required for feature purchase');
      }

      // For now, create price on-the-fly (in production, these would be pre-created)
      const product = await stripe.products.create({
        name: `${featureKey} Feature`,
        description: `Monthly subscription for ${featureKey}`,
      });

      const featurePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 1900, // Default $19/mo, adjust based on feature
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: featurePrice.id,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            user_id: userId,
            purchase_type: 'feature',
            feature_key: featureKey,
          },
        },
        success_url: `${req.headers.get('origin')}/dashboard?feature_unlocked={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/settings?tab=subscription`,
        metadata: {
          user_id: userId,
          purchase_type: 'feature',
          feature_key: featureKey,
        },
      });
    } else {
      // Subscription purchase (default)
      const { data: plan, error: planError } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .eq('name', planName)
        .single();

      console.log('Plan lookup result:', { plan, planError });

      if (planError) {
        console.error('Plan lookup error:', planError);
        throw new Error(`Plan lookup failed: ${planError.message}`);
      }

      if (!plan) {
        throw new Error(`Plan "${planName}" not found in database. Available plans should be: Launch, Growth, Agency, Scale`);
      }

      // Handle Scale plan - should redirect to contact form
      if (planName === 'Scale') {
        throw new Error('Scale plan requires custom pricing. Please contact sales.');
      }

      // Determine price ID based on billing cycle
      const priceId = billingCycle === 'yearly' 
        ? plan.stripe_price_id_yearly 
        : plan.stripe_price_id_monthly;

      console.log('Selected price ID:', priceId, 'for billing cycle:', billingCycle);

      // For testing: Create price on-the-fly if not configured
      let actualPriceId = priceId;
      
      if (!priceId || priceId.startsWith('price_')) {
        console.log('Creating Stripe price on-the-fly for testing...');
        
        // Create product first
        const product = await stripe.products.create({
          name: `${plan.name} Plan`,
          description: `${plan.name} subscription for AnotherSEOGuru`,
        });

        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round((billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly) * 100),
          currency: 'usd',
          recurring: {
            interval: billingCycle === 'yearly' ? 'year' : 'month',
          },
        });

        actualPriceId = price.id;
        console.log('Created price:', actualPriceId);
      }

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: actualPriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 7, // 7-day free trial
          metadata: {
            user_id: userId,
            plan_id: plan.id,
            plan_name: plan.name,
          },
        },
        success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${plan.name}`,
        cancel_url: `${req.headers.get('origin')}/pricing`,
        metadata: {
          user_id: userId,
          plan_id: plan.id,
          plan_name: plan.name,
          billing_cycle: billingCycle,
        },
      });
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

