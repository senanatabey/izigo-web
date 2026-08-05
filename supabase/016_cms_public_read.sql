/* =========================================================================
   Stage 2 — Frontend Integration.

   Stage 1 locked every CMS table to admin-only (no `anon`/public select at
   all). The public site now needs to read *published* Travel Guides and
   Places, so this adds narrow public read policies scoped to
   status = 'published' — drafts stay admin-only. FAQ and Static Pages are
   left untouched (not part of Stage 2's frontend scope).

   Also adds `featured` to cms_places, used to pick the homepage's
   "Discover Azerbaijan" places without hardcoding which ones.
   ========================================================================= */

alter table public.cms_places add column if not exists featured boolean not null default false;
create index if not exists cms_places_featured_idx on public.cms_places (featured) where featured = true;

create policy "Published travel guides are public"
  on public.cms_travel_guides for select
  using (status = 'published');

create policy "Translations of published travel guides are public"
  on public.cms_travel_guide_translations for select
  using (exists (
    select 1 from public.cms_travel_guides g
    where g.id = guide_id and g.status = 'published'
  ));

create policy "Published places are public"
  on public.cms_places for select
  using (status = 'published');

create policy "Translations of published places are public"
  on public.cms_place_translations for select
  using (exists (
    select 1 from public.cms_places p
    where p.id = place_id and p.status = 'published'
  ));

grant select on
  public.cms_travel_guides, public.cms_travel_guide_translations,
  public.cms_places, public.cms_place_translations
to anon;
