-- Update subscription_plans table with Stripe product and price IDs

-- Launch Plan
UPDATE subscription_plans
SET stripe_product_id = 'prod_TKQ4vptfPSYdKW',
    stripe_price_id_monthly = 'price_1SNlEyBXxQFoEIvuuEMxGuvm',
    stripe_price_id_yearly = 'price_1SNlF4BXxQFoEIvuQFef3TP2'
WHERE name = 'Launch';

-- Growth Plan
UPDATE subscription_plans
SET stripe_product_id = 'prod_TKQ5Ivs6J0FDkt',
    stripe_price_id_monthly = 'price_1SNlFGBXxQFoEIvudAMC2Quk',
    stripe_price_id_yearly = 'price_1SNlFNBXxQFoEIvuSTKAHMOy'
WHERE name = 'Growth';

-- Agency Plan
UPDATE subscription_plans
SET stripe_product_id = 'prod_TKQ5S4uub090OB',
    stripe_price_id_monthly = 'price_1SNlFbBXxQFoEIvuNYX2BHuJ',
    stripe_price_id_yearly = 'price_1SNlFiBXxQFoEIvukjnCPYrm'
WHERE name = 'Agency';

-- Scale Plan
UPDATE subscription_plans
SET stripe_product_id = 'prod_TKQ6eqXOXsMOJY',
    stripe_price_id_monthly = 'price_1SNlFvBXxQFoEIvuEWtZp7s6'
WHERE name = 'Scale';

-- Verify the updates
SELECT name, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly
FROM subscription_plans
WHERE name IN ('Launch', 'Growth', 'Agency', 'Scale')
ORDER BY name;
