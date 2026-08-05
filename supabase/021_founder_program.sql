-- Founder Host onboarding program. Not a subscription system — a one-time
-- launch incentive to seed IZIGO's first 100 verified hosts.

-- Host-side fields. `founder_host` is the source of truth for "has this host
-- been granted founder benefits" — the campaign's live count is just
-- `count(*) where founder_host = true`, so there's nothing to keep in sync.
alter table public.profiles add column verified boolean not null default false;
alter table public.profiles add column founder_host boolean not null default false;
alter table public.profiles add column founder_granted_at timestamptz;
alter table public.profiles add column vip_expires_at timestamptz;
alter table public.profiles add column welcome_seen boolean not null default false;

-- Singleton settings row — same pattern as site_settings. Admin toggles
-- status and the max cap; the "37/100" count is always computed live from
-- profiles, never stored here, so it can't drift out of sync.
create table public.founder_campaign (
  id int primary key default 1,
  status text not null default 'active' check (status in ('active', 'inactive')),
  max_founder_hosts int not null default 100,
  constraint founder_campaign_singleton check (id = 1)
);

insert into public.founder_campaign (id) values (1);

alter table public.founder_campaign enable row level security;

create policy "Anyone can view the founder campaign"
  on public.founder_campaign for select
  using (true);

create policy "Admins can update the founder campaign"
  on public.founder_campaign for update
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.founder_campaign to anon;
grant select, update on public.founder_campaign to authenticated;
