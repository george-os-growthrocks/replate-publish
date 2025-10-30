/**
 * Create Stripe Products and Prices
 * Run: node create-stripe-products.js
 * 
 * This script creates all subscription plans in Stripe and outputs SQL to update your database
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const plans = [
  {
    name: 'Launch',
    description: 'Perfect for Freelancers - Essential SEO tools to get started',
    priceMonthly: 2900, // $29.00 in cents
    priceYearly: 29000,  // $290.00 in cents
    features: [
      'Keyword Research & Ideas (50M+ database)',
      'Autocomplete Expansions',
      'PAA / Answer The Public',
      'Keyword Clustering (AI-powered)',
      'SERP Overview (top 10 analysis)',
      'Rank Tracking (250 keywords/day)',
      '1,200 credits per month',
      '3 projects',
      '1 team member'
    ]
  },
  {
    name: 'Growth',
    description: 'Most Popular - Everything freelancers need + team collaboration',
    priceMonthly: 7900, // $79.00
    priceYearly: 79000,  // $790.00
    features: [
      'Everything in Launch',
      'AI Content Briefs',
      'SERP Similarity Analysis',
      'Competitor Analysis',
      'Content Gap Discovery',
      'Backlink Lookups',
      '6,000 credits per month',
      '10 projects',
      '3 team members'
    ]
  },
  {
    name: 'Agency',
    description: 'For Agencies - Scale your agency with automation & white-label',
    priceMonthly: 14900, // $149.00
    priceYearly: 149000, // $1,490.00
    features: [
      'Everything in Growth',
      'White-Label Reports',
      'API Access (read)',
      'Competitor Monitoring (automated)',
      'Backlink Monitoring (continuous)',
      'AI Overview Optimization',
      '20,000 credits per month',
      '30 projects',
      '10 team members'
    ]
  },
  {
    name: 'Scale',
    description: 'Enterprise - Custom solutions for large organizations',
    priceMonthly: 39900, // $399.00 (placeholder, actually contact sales)
    priceYearly: null,   // Contact sales for yearly
    features: [
      'Everything in Agency',
      'SSO/SAML Integration',
      'Custom Limits (contracted)',
      'Private Data Retention',
      'SLAs & DPAs',
      'Unlimited credits',
      'Custom projects',
      'Unlimited team members'
    ]
  }
];

async function createProducts() {
  console.log('🚀 Creating Stripe Products and Prices...\n');
  
  const sqlStatements = [];
  
  for (const plan of plans) {
    console.log(`📦 Creating product: ${plan.name}`);
    
    try {
      // Create product
      const product = await stripe.products.create({
        name: `${plan.name} Plan`,
        description: plan.description,
        metadata: {
          plan_name: plan.name,
          features: JSON.stringify(plan.features)
        }
      });
      
      console.log(`✅ Product created: ${product.id}`);
      
      // Create monthly price
      let monthlyPriceId = null;
      if (plan.priceMonthly) {
        const monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceMonthly,
          currency: 'usd',
          recurring: {
            interval: 'month',
            trial_period_days: plan.name === 'Launch' ? 7 : 0 // Only Launch has trial
          },
          metadata: {
            plan_name: plan.name,
            billing_cycle: 'monthly'
          }
        });
        
        monthlyPriceId = monthlyPrice.id;
        console.log(`  💵 Monthly price created: ${monthlyPriceId} ($${plan.priceMonthly / 100}/month)`);
      }
      
      // Create yearly price
      let yearlyPriceId = null;
      if (plan.priceYearly) {
        const yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceYearly,
          currency: 'usd',
          recurring: {
            interval: 'year',
            trial_period_days: plan.name === 'Launch' ? 7 : 0 // Only Launch has trial
          },
          metadata: {
            plan_name: plan.name,
            billing_cycle: 'yearly'
          }
        });
        
        yearlyPriceId = yearlyPrice.id;
        console.log(`  💵 Yearly price created: ${yearlyPriceId} ($${plan.priceYearly / 100}/year)`);
      }
      
      // Generate SQL statement
      const sql = `UPDATE subscription_plans
SET stripe_product_id = '${product.id}',
    stripe_price_id_monthly = ${monthlyPriceId ? `'${monthlyPriceId}'` : 'NULL'},
    stripe_price_id_yearly = ${yearlyPriceId ? `'${yearlyPriceId}'` : 'NULL'}
WHERE name = '${plan.name}';`;
      
      sqlStatements.push(sql);
      console.log(`✅ ${plan.name} complete\n`);
      
    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
    }
  }
  
  // Output SQL
  console.log('\n' + '='.repeat(60));
  console.log('📝 SQL to update your Supabase database:');
  console.log('='.repeat(60) + '\n');
  
  console.log('-- Update subscription_plans with Stripe IDs\n');
  sqlStatements.forEach(sql => console.log(sql + '\n'));
  
  console.log('-- Verify the updates');
  console.log(`SELECT name, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly
FROM subscription_plans
WHERE name IN ('Launch', 'Growth', 'Agency', 'Scale')
ORDER BY name;`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Done! Copy the SQL above and run it in Supabase SQL Editor');
  console.log('='.repeat(60) + '\n');
}

// Check for API key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable not set');
  console.error('\nUsage:');
  console.error('  STRIPE_SECRET_KEY=sk_test_... node create-stripe-products.js');
  console.error('\nOr set it in your environment:');
  console.error('  export STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('❌ Error: STRIPE_SECRET_KEY should start with "sk_test_" or "sk_live_"');
  process.exit(1);
}

// Confirm before running
const mode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
console.log(`⚠️  Running in ${mode} mode`);
console.log('This will create 4 products and 7 prices in Stripe.');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  createProducts().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}, 3000);

