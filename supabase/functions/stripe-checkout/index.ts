import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe('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', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { planName, billingCycle } = await req.json(); // 'Starter'/'Pro'/'Agency', 'monthly'/'yearly'

    console.log('Checkout request:', { planName, billingCycle });

    // Get plan details from database
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
      throw new Error(`Plan "${planName}" not found in database. Available plans should be: Starter, Pro, Agency`);
    }

    // Get or create Stripe customer
    let customerId: string;
    
    const { data: existingSub } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
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

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
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
          user_id: user.id,
          plan_id: plan.id,
          plan_name: plan.name,
        },
      },
      success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
      },
    });

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

