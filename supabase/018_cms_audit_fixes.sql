/* =========================================================================
   Stage 1 final audit — the one genuinely missing DB field found: an
   optional Canonical URL for Travel Guides and Places. Everything else in
   the audit (validation, dedupe, sorting, unsaved-changes warnings, error
   messages) is application-layer, not schema.
   ========================================================================= */

alter table public.cms_travel_guides add column if not exists canonical_url text;
alter table public.cms_places add column if not exists canonical_url text;
