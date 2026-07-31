-- A single-row settings table for the homepage's default hero image, so
-- admins can change it without a campaign or a code deploy.
create table public.site_settings (
  id int primary key default 1,
  default_hero_desktop_url text,
  default_hero_mobile_url text,
  constraint site_settings_singleton check (id = 1)
);

insert into public.site_settings (id) values (1);

alter table public.site_settings enable row level security;

create policy "Anyone can view site settings"
  on public.site_settings for select
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.site_settings to anon;
grant select, update on public.site_settings to authenticated;
