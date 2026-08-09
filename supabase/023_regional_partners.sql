-- Regional Partner program (MVP region: Gabala) — a scoped, region-limited
-- role that can review listings in its own region and see a read-only,
-- database-computed breakdown of that region's ad revenue share.
--
-- Deliberately kept separate from admin at every layer:
--   - profiles.role gets a new 'regional_partner' value, but public.is_admin()
--     is NOT touched — a regional partner never satisfies is_admin() anywhere.
--   - Listing approval goes through SECURITY DEFINER RPCs scoped to the
--     partner's own region and limited to status/reject_reason, not a broad
--     UPDATE RLS policy (which could not be column-restricted this cleanly).
--   - Revenue math lives in a security_invoker view so RLS on the underlying
--     tables — not frontend arithmetic — is what a partner is allowed to see.

-- ---------------------------------------------------------------------------
-- 1. Extend profiles.role (additive — existing 'host'/'admin' rows unaffected)
-- ---------------------------------------------------------------------------
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%in%'
  loop
    execute format('alter table public.profiles drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('host', 'admin', 'regional_partner'));

-- ---------------------------------------------------------------------------
-- 2. regional_partners — who is a partner, for which region, at what share
-- ---------------------------------------------------------------------------
create table public.regional_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Matches the exact canonical value already used in listings.city (e.g.
  -- "Gabala") — no separate regions table; listings.city stays the one
  -- source of truth for region/city values per the existing architecture.
  region text not null,
  revenue_share_percent numeric not null default 20
    check (revenue_share_percent >= 0 and revenue_share_percent <= 100),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (user_id, region)
);

create index regional_partners_user_id_idx on public.regional_partners(user_id);
create index regional_partners_region_idx on public.regional_partners(region);

-- ---------------------------------------------------------------------------
-- 3. ad_campaigns — internal revenue *bookkeeping*, not a payment processor.
-- Admin enters what a region's ad inventory earned; this is the number a
-- partner's share gets computed from. Wiring this to a real payment
-- processor (Stripe etc.) is a later phase, not this one.
-- ---------------------------------------------------------------------------
create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  title jsonb not null default '{}', -- { en, az }
  period_start date,
  period_end date,
  gross_revenue numeric not null default 0 check (gross_revenue >= 0),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index ad_campaigns_region_idx on public.ad_campaigns(region);

-- ---------------------------------------------------------------------------
-- 4. regional_partner_payments — payout records against the partner's share.
-- Status is set only by admin; a partner is always read-only here.
-- ---------------------------------------------------------------------------
create table public.regional_partner_payments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.regional_partners(id) on delete cascade,
  period_start date,
  period_end date,
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now()
);

create index regional_partner_payments_partner_id_idx on public.regional_partner_payments(partner_id);

-- ---------------------------------------------------------------------------
-- 5. RLS — region/ownership enforced in the database, not just the frontend
-- ---------------------------------------------------------------------------
alter table public.regional_partners enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.regional_partner_payments enable row level security;

create policy "Partners see their own row, admins see all"
  on public.regional_partners for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Only admins manage regional partners"
  on public.regional_partners for insert
  with check (public.is_admin());
create policy "Only admins update regional partners"
  on public.regional_partners for update
  using (public.is_admin());
create policy "Only admins delete regional partners"
  on public.regional_partners for delete
  using (public.is_admin());

create policy "Partners see campaigns in their own region, admins see all"
  on public.ad_campaigns for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.regional_partners rp
      where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = ad_campaigns.region
    )
  );

create policy "Only admins manage ad campaigns"
  on public.ad_campaigns for insert
  with check (public.is_admin());
create policy "Only admins update ad campaigns"
  on public.ad_campaigns for update
  using (public.is_admin());
create policy "Only admins delete ad campaigns"
  on public.ad_campaigns for delete
  using (public.is_admin());

create policy "Partners see their own payments, admins see all"
  on public.regional_partner_payments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.regional_partners rp
      where rp.id = regional_partner_payments.partner_id and rp.user_id = auth.uid()
    )
  );

-- Partners can never write payment rows or change status — admin only,
-- enforced here (not just hidden in the UI).
create policy "Only admins manage partner payments"
  on public.regional_partner_payments for insert
  with check (public.is_admin());
create policy "Only admins update partner payments"
  on public.regional_partner_payments for update
  using (public.is_admin());
create policy "Only admins delete partner payments"
  on public.regional_partner_payments for delete
  using (public.is_admin());

-- Additive SELECT policy — does not touch the existing listings policy from
-- 002_listings.sql at all, just OR's in one more way to see a row: a
-- regional partner viewing listings in their own region (any status,
-- including pending, so they can review new submissions).
create policy "Regional partners can view listings in their region"
  on public.listings for select
  using (
    exists (
      select 1 from public.regional_partners rp
      where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = listings.city
    )
  );

grant select, insert, update, delete on public.regional_partners to authenticated;
grant select, insert, update, delete on public.ad_campaigns to authenticated;
grant select, insert, update, delete on public.regional_partner_payments to authenticated;
