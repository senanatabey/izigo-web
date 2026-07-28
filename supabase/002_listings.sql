create table public.listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('villa', 'car', 'experience', 'event')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  city text not null,
  title jsonb not null,        -- { en, az }
  description jsonb not null,  -- { en, az }
  price numeric not null,
  discount numeric,
  images text[] not null default '{}',
  details jsonb not null default '{}', -- category-specific: guests, bedrooms, seats, transmission, hasVehicle, date, amenities...
  whatsapp_phone text,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

-- helper: is the current user an admin? (security definer so it can read profiles under RLS)
create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Approved listings are public, hosts see their own, admins see all"
  on public.listings for select
  using (status = 'approved' or host_id = auth.uid() or public.is_admin());

create policy "Hosts can create their own listings"
  on public.listings for insert
  with check (host_id = auth.uid());

create policy "Hosts can update their own listings, admins can update any"
  on public.listings for update
  using (host_id = auth.uid() or public.is_admin());

create policy "Hosts can delete their own listings, admins can delete any"
  on public.listings for delete
  using (host_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.listings to authenticated;
grant select on public.listings to anon;
