/* =========================================================================
   CMS FOUNDATION (Stage 1) — Travel Guides, Places, FAQ, Static Pages,
   Media Library.

   Architecture notes:
   - Every content type is split into a language-agnostic "parent" row
     (slug, taxonomy, images, status — things that don't change per
     language) and a `_translations` table (one row per language). This is
     what makes "unlimited languages" cheap: adding German later is just
     inserting rows with language = 'de', no schema change, no new columns.
   - Parents use a plain `slug` (not a foreign key into any destinations
     table) so this scales past the current 3 fixed Azerbaijan cities to
     100+ destinations without touching this schema.
   - Nothing here is exposed to `anon` — Stage 1 is admin-only by design;
     the public site isn't wired to any of this yet (Stage 2).
   ========================================================================= */

-- ---------------------------------------------------------------------
-- Travel Guides
-- ---------------------------------------------------------------------
create table public.cms_travel_guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  city text,
  hero_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  publish_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_travel_guide_translations (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.cms_travel_guides(id) on delete cascade,
  language text not null,
  title text not null default '',
  seo_title text,
  meta_description text,
  keywords text[] not null default '{}',
  content text not null default '',
  unique (guide_id, language)
);

-- ---------------------------------------------------------------------
-- Places
-- ---------------------------------------------------------------------
create table public.cms_places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  city text,
  region text,
  category text,
  hero_image_url text,
  gallery text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_place_translations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.cms_places(id) on delete cascade,
  language text not null,
  name text not null default '',
  seo_title text,
  meta_description text,
  keywords text[] not null default '{}',
  content text not null default '',
  faq jsonb not null default '[]', -- [{ question, answer }, ...] — place-specific FAQ, separate from the global FAQ module
  unique (place_id, language)
);

-- ---------------------------------------------------------------------
-- FAQ (global)
-- ---------------------------------------------------------------------
create table public.cms_faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  sort_order int not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cms_faq_translations (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references public.cms_faqs(id) on delete cascade,
  language text not null,
  question text not null default '',
  answer text not null default '',
  unique (faq_id, language)
);

-- ---------------------------------------------------------------------
-- Static Pages — fixed set of slugs for Stage 1
-- ---------------------------------------------------------------------
create table public.cms_static_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('about', 'privacy', 'terms', 'contact', 'become-a-host')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);

create table public.cms_static_page_translations (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_static_pages(id) on delete cascade,
  language text not null,
  title text not null default '',
  seo_title text,
  meta_description text,
  content text not null default '',
  unique (page_id, language)
);

-- Seed the 5 fixed static pages so the admin list always shows all of them.
insert into public.cms_static_pages (slug) values
  ('about'), ('privacy'), ('terms'), ('contact'), ('become-a-host')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Media Library
-- ---------------------------------------------------------------------
create table public.cms_media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  storage_path text not null,
  folder text not null default 'general',
  filename text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  caption text,
  tags text[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes — cheap now, save a full scan once this is at 1000+ places.
-- ---------------------------------------------------------------------
create index cms_travel_guides_city_idx on public.cms_travel_guides (city);
create index cms_travel_guides_status_idx on public.cms_travel_guides (status);
create index cms_places_city_idx on public.cms_places (city);
create index cms_places_category_idx on public.cms_places (category);
create index cms_places_status_idx on public.cms_places (status);
create index cms_faqs_category_idx on public.cms_faqs (category);
create index cms_media_folder_idx on public.cms_media (folder);
create index cms_media_tags_idx on public.cms_media using gin (tags);
create index cms_travel_guide_translations_guide_idx on public.cms_travel_guide_translations (guide_id);
create index cms_place_translations_place_idx on public.cms_place_translations (place_id);
create index cms_faq_translations_faq_idx on public.cms_faq_translations (faq_id);
create index cms_static_page_translations_page_idx on public.cms_static_page_translations (page_id);

-- ---------------------------------------------------------------------
-- RLS — admin-only everywhere. Stage 1 is not connected to the public
-- site, so there is deliberately no `anon`/public select policy yet;
-- Stage 2 adds a "published" read policy when the frontend is wired up.
-- ---------------------------------------------------------------------
alter table public.cms_travel_guides enable row level security;
alter table public.cms_travel_guide_translations enable row level security;
alter table public.cms_places enable row level security;
alter table public.cms_place_translations enable row level security;
alter table public.cms_faqs enable row level security;
alter table public.cms_faq_translations enable row level security;
alter table public.cms_static_pages enable row level security;
alter table public.cms_static_page_translations enable row level security;
alter table public.cms_media enable row level security;

create policy "Admins manage travel guides" on public.cms_travel_guides for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage travel guide translations" on public.cms_travel_guide_translations for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage places" on public.cms_places for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage place translations" on public.cms_place_translations for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage faqs" on public.cms_faqs for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage faq translations" on public.cms_faq_translations for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage static pages" on public.cms_static_pages for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage static page translations" on public.cms_static_page_translations for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage media" on public.cms_media for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on
  public.cms_travel_guides, public.cms_travel_guide_translations,
  public.cms_places, public.cms_place_translations,
  public.cms_faqs, public.cms_faq_translations,
  public.cms_static_pages, public.cms_static_page_translations,
  public.cms_media
to authenticated;

-- ---------------------------------------------------------------------
-- Storage — one bucket for every CMS-uploaded image (guide heroes, place
-- galleries, media library uploads). Public read (URLs aren't linked from
-- the public site until Stage 2), admin-only write.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do nothing;

create policy "Public can view cms media" on storage.objects for select using (bucket_id = 'cms-media');
create policy "Admins can upload cms media" on storage.objects for insert with check (bucket_id = 'cms-media' and public.is_admin());
create policy "Admins can update cms media" on storage.objects for update using (bucket_id = 'cms-media' and public.is_admin());
create policy "Admins can delete cms media" on storage.objects for delete using (bucket_id = 'cms-media' and public.is_admin());
