-- Refinements to the Phase 1 Travel Concierge module — no new tables, no new
-- workflow, just three fields the admin was missing on the existing
-- trip_requests table.

-- 1. Public request number: a gapless-enough, human-friendly "IZ-000001"
-- shown everywhere instead of the raw uuid. `seq` is DB-owned and guaranteed
-- unique; `request_number` is derived from it so there's nothing to keep in
-- sync by hand.
alter table public.trip_requests add column seq bigint generated always as identity;
alter table public.trip_requests add column request_number text
  generated always as ('IZ-' || lpad(seq::text, 6, '0')) stored;

-- 2. Where the request came from. Independent of status/result.
alter table public.trip_requests add column source text not null default 'plan_my_trip'
  check (source in ('plan_my_trip', 'website', 'whatsapp', 'instagram', 'facebook', 'manual'));

-- 3. Final outcome — separate from `status` (the workflow stage). A request
-- can be mid-workflow with no result yet, or reach a result independently of
-- exactly which stage it was in.
alter table public.trip_requests add column result text
  check (result in ('completed', 'cancelled', 'no_reply', 'budget_too_low', 'guest_changed_mind'));
