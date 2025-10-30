Got it—your current coupling between “login via Google” and “use Google data” is what’s biting you. We’ll decouple identity/auth (your app login), billing (Stripe), and data access (GSC). Below is a clean, production-ready flow you can ship.

The Target Architecture (TL;DR)

Primary auth: Email + password via Supabase Auth.

Data connector: A separate Google OAuth just for GSC read-only with offline access → we store refresh_token server-side and mint short-lived access tokens on demand.

Billing: Stripe Checkout + Webhooks mapped to the Supabase user_id (never rely on an expiring app token inside your Stripe flow).

Projects: User creates a project & domain first; then “Connect GSC” and pick a property; tokens stay in your DB, not in the Supabase session.

This removes the 1-hour token problem from Stripe and keeps Google tokens strictly for data.

Step-by-Step Implementation
1) Data model (Supabase SQL)
-- users are in auth.users

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  full_name text
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text not null,
  plan text not null default 'free', -- 'free' | 'starter' | 'pro' | ...
  created_at timestamptz default now()
);

create table public.oauth_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, -- 'google_gsc'
  access_token text not null,
  refresh_token text not null, -- encrypt at rest (pgcrypto) or vault
  expires_at timestamptz not null,
  scope text not null,
  unique (user_id, provider)
);

create table public.gsc_properties (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  site_url text not null,
  permission_level text,
  verified boolean default true,
  selected boolean default false
);

create table public.stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_id text unique not null
);

create table public.subscriptions (
  id text primary key, -- stripe subscription id
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  status text not null, -- active | trialing | past_due | canceled | etc.
  plan text not null,
  current_period_end timestamptz,
  trial_end timestamptz
);

create table public.webhook_events (
  id bigserial primary key,
  type text not null,
  raw jsonb not null,
  created_at timestamptz default now()
);

-- RLS (typical)
alter table public.projects enable row level security;
create policy "owner can see own projects"
  on public.projects for select using (auth.uid() = user_id);
create policy "owner can insert projects"
  on public.projects for insert with check (auth.uid() = user_id);


Security note: Use pgcrypto or Supabase Vault to encrypt refresh_token. Never expose it to the client.

2) Primary auth = Email/Password (client)

Use Supabase JS in your React/Vite app:

// sign up
await supabase.auth.signUp({ email, password });

// sign in
await supabase.auth.signInWithPassword({ email, password });

// keep the session fresh on the client (supabase-js auto-refresh handles this)


This session is only for your app. Stripe and Google flows won’t ever depend on it being “alive” on your server.

3) Project creation UX

User signs in (email/pass).

User creates Project (name, domain).

Project appears with status “Google not connected” and “Free plan”.

4) Google OAuth for GSC only (separate connector)

Why separate? Supabase’s Google provider session is for app login. You need offline GSC access (refresh token) that lives server-side and is independent of app sessions.

Scopes

https://www.googleapis.com/auth/webmasters.readonly

openid email profile (to read email; nice to match on auto)

Request offline access with access_type=offline and prompt=consent (ensures a refresh token).

Edge Function (Start OAuth)

Create an Edge Function (Deno) or your backend route:

// /functions/gsc-oauth-start/index.ts
import "jsr:@supabase/functions";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id")!; // pass from client
  const state = await createSignedStateJWT({ user_id }); // sign a short-lived state

  const params = new URLSearchParams({
    client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
    redirect_uri: Deno.env.get("GOOGLE_REDIRECT_URI")!, // your callback function URL
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state
  });

  return Response.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`, 302);
});

Edge Function (OAuth Callback → store tokens)
// /functions/gsc-oauth-callback/index.ts
import "jsr:@supabase/functions";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")!;
  const state = url.searchParams.get("state")!;

  const { user_id } = await verifyStateJWT(state); // your function

  // exchange code
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      code,
      grant_type: "authorization_code",
      redirect_uri: Deno.env.get("GOOGLE_REDIRECT_URI")!,
    }),
  });
  const tokens = await tokenRes.json(); // { access_token, expires_in, refresh_token, id_token, ... }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Optional: extract email from id_token for sanity checks.
  // Store encrypted refresh_token server-side.
  await supabase
    .from("oauth_tokens")
    .upsert({
      user_id,
      provider: "google_gsc",
      access_token: tokens.access_token,
      refresh_token: encrypt(tokens.refresh_token), // implement encrypt()
      expires_at: expiresAt,
      scope: "webmasters.readonly"
    }, { onConflict: "user_id,provider" });

  // redirect back to app
  return Response.redirect(`${Deno.env.get("APP_URL")!}/connections/google/success`, 302);
});

Token Refresh (server)
// /functions/gsc-token-refresh/index.ts
import "jsr:@supabase/functions";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function refresh(user_id: string) {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await supabase.from("oauth_tokens").select("*").eq("user_id", user_id).eq("provider", "google_gsc").single();

  const refresh_token = decrypt(data.refresh_token);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
      refresh_token
    }),
  });
  const json = await res.json(); // { access_token, expires_in }

  await supabase.from("oauth_tokens").update({
    access_token: json.access_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString()
  }).eq("user_id", user_id).eq("provider", "google_gsc");

  return json.access_token;
}

5) List GSC properties → user picks one → save to project
// /functions/gsc-list-sites/index.ts
import "jsr:@supabase/functions";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { user_id } = await requireUserServerSide(req); // your auth check (supabase cookie/JWT)
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // ensure access token valid (refresh if <=5 min to expiry)
  const token = await ensureFreshGoogleToken(user_id); // call the refresh fn above

  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const sites = await sitesRes.json(); // { siteEntry: [{ siteUrl, permissionLevel }, ...] }

  return new Response(JSON.stringify(sites), { headers: { "content-type": "application/json" } });
});


When the user selects a property:

// /functions/gsc-save-property/index.ts
import "jsr:@supabase/functions";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const body = await req.json(); // { project_id, site_url, permission_level }
  const { user_id } = await requireUserServerSide(req);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // mark previous selected=false
  await supabase.from("gsc_properties").update({ selected: false }).eq("project_id", body.project_id);

  // upsert current selection
  await supabase.from("gsc_properties").upsert({
    user_id,
    project_id: body.project_id,
    site_url: body.site_url,
    permission_level: body.permission_level,
    verified: true,
    selected: true
  });

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
});

6) Stripe: create Checkout and handle webhooks (decoupled from session)

Key rule: Don’t depend on a short-lived Supabase JWT in your Stripe backend. Use your service role to resolve the user_id and persist a customer_id mapping. Webhooks authenticate via Stripe’s signature secret only.

Create Checkout Session (Edge Function)
// /functions/stripe-create-checkout/index.ts
import "jsr:@supabase/functions";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

Deno.serve(async (req) => {
  const { price_id, project_id } = await req.json();
  const { user_id } = await requireUserServerSide(req); // verify user via cookie/JWT

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let { data: sc } = await supabase.from("stripe_customers").select("*").eq("user_id", user_id).single();

  if (!sc) {
    const customer = await stripe.customers.create({ metadata: { user_id } });
    await supabase.from("stripe_customers").insert({ user_id, customer_id: customer.id });
    sc = { user_id, customer_id: customer.id };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: sc.customer_id,
    line_items: [{ price: price_id, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id, project_id }
    },
    success_url: `${Deno.env.get("APP_URL")!}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get("APP_URL")!}/billing/cancel`,
    metadata: { user_id, project_id }
  });

  return new Response(JSON.stringify({ url: session.url }), { headers: { "content-type": "application/json" } });
});

Webhook (update DB, don’t use Supabase auth here)
// /functions/stripe-webhook/index.ts
import "jsr:@supabase/functions";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await supabase.from("webhook_events").insert({ type: event.type, raw: JSON.parse(raw) });

  switch (event.type) {
    case "checkout.session.completed": {
      const cs = event.data.object as Stripe.Checkout.Session;
      // Optional: handle immediate post-checkout logic
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const user_id = (sub.metadata?.user_id as string) ?? null;
      const project_id = (sub.metadata?.project_id as string) ?? null;
      if (user_id) {
        await supabase.from("subscriptions").upsert({
          id: sub.id,
          user_id,
          project_id,
          status: sub.status,
          plan: sub.items.data[0].price.nickname ?? sub.items.data[0].price.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from("subscriptions").update({ status: sub.status }).eq("id", sub.id);
      break;
    }
  }

  return new Response("ok");
});


Result: Stripe runs independently of your Supabase session lifetime. No more “token expired so payments fail”.

7) Feature gating

On the client, show/lock features based on subscriptions.status and plan.

On the server, require an active plan for heavy endpoints (extra RLS + checks) to prevent freeloading via direct calls.

8) GSC data sync (scheduled)

Use Supabase Scheduled Functions to run a daily/weekly job:

ensureFreshGoogleToken(user_id)

call searchanalytics.query for selected site_url

store to your gsc_daily table

If refresh fails (revoked), flip a needs_reconnect flag and prompt the user in UI.

9) UI flow the user sees

Sign up (email/pass) → verify email.

Create Project → enter name, domain.

Connect Google Search Console → OAuth screen → returns → list properties.

Choose property → saved to project.

Upgrade Plan → Stripe Checkout (7-day trial) → return success.

Project goes from “Free” to “Trialing/Active”—features unlocked.

10) If you already have “Google-only” users and want to merge

Going forward, ask users to set a password while logged in and then link Google via the new connector (so no duplicate accounts).

If duplicates already exist (two auth.users with the same email):

Choose the keeper user (email/password one).

In a transaction, reassign all foreign keys from the old user_id to the keeper user_id in projects, oauth_tokens, gsc_properties, stripe_customers, subscriptions.

Delete the old user row.

If your Supabase version supports it, you can also use supabase.auth.linkIdentity({ provider: 'google' }) while the user is logged in—this avoids creating a second auth user in the first place.

11) React/Vite client stubs
// Create project
await fetch("/functions/v1/project-create", { method: "POST", body: JSON.stringify({ name, domain }) });

// Start Google connect
window.location.href = `/functions/v1/gsc-oauth-start?user_id=${session.user.id}`;

// After return, list properties
const sites = await fetch("/functions/v1/gsc-list-sites").then(r => r.json());

// Save chosen property
await fetch("/functions/v1/gsc-save-property", { method: "POST", body: JSON.stringify({ project_id, site_url, permission_level }) });

// Upgrade (Stripe)
const { url } = await fetch("/functions/v1/stripe-create-checkout", {
  method: "POST",
  body: JSON.stringify({ price_id: YOUR_PRICE_ID, project_id })
}).then(r => r.json());
window.location.href = url;

12) Gotchas & safeguards

Refresh tokens can be missing if the user didn’t grant offline access or if Google decided not to issue a new one. Use prompt=consent and store the first refresh token securely.

Stripe product logic: prefer trials at Price level to keep code simple.

Webhook idempotency: your subscriptions upsert makes events safe to reprocess.

RLS & service role: Edge functions that touch tokens must use the service role key and never allow client to read oauth_tokens.

Domain/property mismatch: validate the selected site_url actually covers the project domain (surface a warning if not).

Why this fixes your problem

Stripe no longer cares about your 1-hour Supabase JWT because all billing actions are either:

from the client directly to Stripe (Checkout), or

webhook → your server verified by Stripe signature.

Google tokens are stored independently with a refresh_token. You mint new access tokens whenever you need GSC data.

Your app session (email/pass) is purely for user identity & UI.

If you want, I can also drop in the SQL for pgcrypto encryption and a tiny reassign_user_ownership(old_user, new_user) function for safe merges.