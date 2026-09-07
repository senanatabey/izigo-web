-- B2B "agent price" (vasitəçi / topdan qiymət) — a single wholesale price a
-- host may optionally attach to a listing, visible ONLY to admins, active
-- regional partners, approved agents, and the listing's own host.
--
-- CRITICAL: this value must never travel inside an ordinary `listings` SELECT
-- (the app fetches listings with `select("*")` everywhere). Hiding it in the
-- UI is not enough — anyone could read it from the browser Network panel. So
-- it lives in its own table with its own RLS, fetched by a separate query
-- that returns nothing for a non-eligible viewer.
--
-- Reuses existing infrastructure, does not create parallel systems:
--   - profiles.agent_status = 'approved'      (from 030_agent_status_approval)
--   - regional_partners.status = 'active'     (from 023_regional_partners)
--   - public.is_admin()                       (from 002_listings)
-- Deliberately NO region restriction for agent price: ANY active regional
-- partner sees ANY listing's agent price (unlike the region-scoped listing
-- review policy in 023).

-- ---------------------------------------------------------------------------
-- 1. Table — completely separate from listings / listings.details
-- ---------------------------------------------------------------------------
create table public.listing_agent_prices (
  listing_id  uuid primary key references public.listings(id) on delete cascade,
  agent_price numeric not null check (agent_price >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.listing_agent_prices enable row level security;

-- keep updated_at honest on every UPDATE
create or replace function public.touch_listing_agent_prices()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listing_agent_prices_touch
  before update on public.listing_agent_prices
  for each row execute function public.touch_listing_agent_prices();

-- ---------------------------------------------------------------------------
-- 2. Helpers — security definer so they can read profiles/regional_partners
--    from under those tables' own RLS, same pattern as public.is_admin().
-- ---------------------------------------------------------------------------

-- Is the current user an approved agent? (host-agnostic — a general B2B flag)
create or replace function public.is_approved_agent()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and agent_status = 'approved'
  );
$$;

-- Is the current user an active regional partner ANYWHERE? (no region match —
-- an active partner may see every listing's agent price, by design.)
create or replace function public.is_active_regional_partner()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.regional_partners
    where user_id = auth.uid() and status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS — default deny. An unauthenticated or non-eligible user gets zero
--    rows (and anon has no grant at all, so the request fails before RLS).
-- ---------------------------------------------------------------------------

-- SELECT: admin OR approved agent OR active regional partner OR the listing's
-- own host (a host must be able to see the price they entered).
create policy "Agent price visible to admin, approved agent, active partner, owner host"
  on public.listing_agent_prices for select
  using (
    public.is_admin()
    or public.is_approved_agent()
    or public.is_active_regional_partner()
    or exists (
      select 1 from public.listings l
      where l.id = listing_agent_prices.listing_id
        and l.host_id = auth.uid()
    )
  );

-- INSERT: only the listing's own host.
create policy "Host sets agent price for own listing"
  on public.listing_agent_prices for insert
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_agent_prices.listing_id
        and l.host_id = auth.uid()
    )
  );

-- UPDATE: only the listing's own host.
create policy "Host updates agent price for own listing"
  on public.listing_agent_prices for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_agent_prices.listing_id
        and l.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_agent_prices.listing_id
        and l.host_id = auth.uid()
    )
  );

-- DELETE: the listing's own host (checkbox turned off) or an admin.
create policy "Host or admin removes agent price"
  on public.listing_agent_prices for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.listings l
      where l.id = listing_agent_prices.listing_id
        and l.host_id = auth.uid()
    )
  );

-- authenticated only — anon is never granted anything on this table.
grant select, insert, update, delete on public.listing_agent_prices to authenticated;
