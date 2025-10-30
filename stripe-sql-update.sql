-- Update subscription_plans with Stripe IDs

UPDATE subscription_plans
SET stripe_product_id = 'prod_TKg8kntCNawOGw',
    stripe_price_id_monthly = 'price_1SO0mVBXxQFoEIvuDviUYuG6',
    stripe_price_id_yearly = 'price_1SO0meBXxQFoEIvurheSvraY'
WHERE name = 'Launch';

UPDATE subscription_plans
SET stripe_product_id = 'prod_TKg9o65IDgMYV6',
    stripe_price_id_monthly = 'price_1SO0nCBXxQFoEIvumtsRJbKT',
    stripe_price_id_yearly = 'price_1SO0nMBXxQFoEIvu15zIfWFV'
WHERE name = 'Growth';

UPDATE subscription_plans
SET stripe_product_id = 'prod_TKg9iIJ0TcbWdI',
    stripe_price_id_monthly = 'price_1SO0neBXxQFoEIvuBubzq23x',
    stripe_price_id_yearly = 'price_1SO0nrBXxQFoEIvuHoiDIwcK'
WHERE name = 'Agency';

UPDATE subscription_plans
SET stripe_product_id = 'prod_TKgAmDgOR4hpvo',
    stripe_price_id_monthly = NULL,
    stripe_price_id_yearly = NULL
WHERE name = 'Scale';

-- Verify the updates
SELECT name, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly
FROM subscription_plans
WHERE name IN ('Launch', 'Growth', 'Agency', 'Scale')
ORDER BY name;
