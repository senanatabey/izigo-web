-- Phase 1 of the IZIGO Travel Concierge system.
-- Every "Plan My Trip" submission lands here as a manually-organized request —
-- no bidding, no auto-matching, no AI. The admin builds each trip by hand and
-- attaches services (villa/transfer/tour/extra) to a single request.
--
-- Kept intentionally generic so later phases (driver dashboards, host
-- dashboards, auto-matching, notifications) can be added as new tables/columns
-- that reference trip_requests / trip_services, without altering this shape.

create table public.trip_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'offer_sent', 'confirmed', 'completed', 'cancelled')),

  -- Guest information
  guest_name text,
  whatsapp text,
  country text,
  city text,

  -- Trip information (check_in/check_out are filled in by the admin while
  -- organizing the trip — the public form only collects a rough trip length)
  check_in date,
  check_out date,
  guests_count integer,
  trip_length_days integer,
  traveler_type text,
  occasion text,

  -- Budget + free-text content
  budget numeric,
  special_requests text,
  internal_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One flexible table for every attached service instead of four rigid ones —
-- columns not relevant to a given service_type are simply left null.
create table public.trip_services (
  id uuid primary key default gen_random_uuid(),
  trip_request_id uuid not null references public.trip_requests(id) on delete cascade,
  service_type text not null check (service_type in ('villa', 'transfer', 'tour', 'extra')),

  -- villa: an existing listing can be linked; title/price are stored
  -- alongside so the record still reads correctly if the listing changes later
  listing_id uuid references public.listings(id) on delete set null,
  title text,
  price numeric,
  notes text,

  -- transfer-only fields
  driver_name text,
  driver_phone text,
  pickup_location text,
  pickup_time text,

  created_at timestamptz not null default now()
);

alter table public.trip_requests enable row level security;
alter table public.trip_services enable row level security;

-- Guests submit anonymously from the public "Plan My Trip" form — anyone can
-- create a request, but only admins can read or manage the pipeline.
create policy "Anyone can submit a trip request"
  on public.trip_requests for insert
  with check (true);

create policy "Only admins can view trip requests"
  on public.trip_requests for select
  using (public.is_admin());

create policy "Only admins can update trip requests"
  on public.trip_requests for update
  using (public.is_admin());

create policy "Only admins can delete trip requests"
  on public.trip_requests for delete
  using (public.is_admin());

create policy "Only admins can manage trip services"
  on public.trip_services for all
  using (public.is_admin())
  with check (public.is_admin());

grant insert on public.trip_requests to anon;
grant select, insert, update, delete on public.trip_requests to authenticated;
grant select, insert, update, delete on public.trip_services to authenticated;

create function public.set_trip_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trip_requests_set_updated_at
before update on public.trip_requests
for each row execute function public.set_trip_request_updated_at();
