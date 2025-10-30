-- Stripe core schema for customers, subscriptions, and gating view

-- 1) Customers mapping
create table if not exists public.stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Subscriptions snapshot (source of truth from Stripe webhooks)
create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  status text not null,
  price_id text,
  product_id text,
  quantity int default 1,
  current_period_end timestamptz,
  cancel_at timestamptz,
  cancel_at_period_end boolean default false,
  trial_end timestamptz,
  raw jsonb,
  updated_at timestamptz default now()
);

-- 3) View for quick gating checks
create or replace view public.user_active_plan as
select
  u.id as user_id,
  s.status,
  s.price_id,
  s.product_id,
  s.current_period_end,
  s.trial_end
from auth.users u
left join lateral (
  select * from subscriptions
  where user_id = u.id
  order by updated_at desc
  limit 1
) s on true;

-- 4) RLS
alter table public.stripe_customers enable row level security;
alter table public.subscriptions enable row level security;

do $$ begin
  create policy "own customer row" on public.stripe_customers
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own subs" on public.subscriptions
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;


