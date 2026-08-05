/* =========================================================================
   Stage 3 — AI Content Assistant.

   Purely additive: a couple of small columns the "Generate with AI" panel
   needs somewhere to put its output (hero image alt text, and FAQ for
   Travel Guides — Places already had `faq`). Nothing here changes existing
   behavior; generated content is never auto-published, it just lands in
   these fields for the admin to review and edit like any other field.
   ========================================================================= */

alter table public.cms_travel_guides add column if not exists hero_image_alt text;
alter table public.cms_places add column if not exists hero_image_alt text;

alter table public.cms_travel_guide_translations add column if not exists faq jsonb not null default '[]';
