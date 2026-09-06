-- Admin-managed photos for the homepage "Yerli Xidmətlər" teaser cards.
-- Keyed by the same service key used in ConciergePage's SERVICES list
-- (bbq, market, airportTransfer, guide, photographer) so each card maps to
-- a real, working service. Reuses the site_settings singleton + hero-images
-- storage bucket already in place for the hero image — no new table/bucket.

alter table public.site_settings
  add column local_service_images jsonb not null default '{}';
