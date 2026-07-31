create table public.hero_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- internal label, e.g. "Winter 2026"
  campaign_type text not null default 'custom' check (campaign_type in ('winter', 'summer', 'nowruz', 'formula1', 'custom')),
  image_desktop_url text,
  image_mobile_url text,
  title_en text not null,
  title_az text not null,
  subtitle_en text,
  subtitle_az text,
  button_text_en text,
  button_text_az text,
  button_link text,
  is_active boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

alter table public.hero_campaigns enable row level security;

create policy "Anyone can view active hero campaigns"
  on public.hero_campaigns for select
  using (true);

create policy "Admins can manage hero campaigns"
  on public.hero_campaigns for all
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.hero_campaigns to anon;
grant select, insert, update, delete on public.hero_campaigns to authenticated;

-- storage for hero images
insert into storage.buckets (id, name, public)
values ('hero-images', 'hero-images', true)
on conflict (id) do nothing;

create policy "Public can view hero images"
  on storage.objects for select
  using (bucket_id = 'hero-images');

create policy "Admins can upload hero images"
  on storage.objects for insert
  with check (bucket_id = 'hero-images' and public.is_admin());

create policy "Admins can delete hero images"
  on storage.objects for delete
  using (bucket_id = 'hero-images' and public.is_admin());
