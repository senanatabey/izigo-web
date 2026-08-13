-- ============================================================================
-- Review trust system — reviews are no longer freely writable for any listing
-- by any user. A review now requires: a real WhatsApp contact on record for
-- that specific listing, a category-specific cool-down, an account-age check,
-- a per-reviewer rate limit, a new-host manual-moderation window, and a
-- host-level (not listing-level) 24h publish queue. None of the limit values
-- are hardcoded in the functions below — they're all read from
-- system_settings so they can be tuned without a code change.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) system_settings — tunable limits, admin-only for now (no admin UI yet;
--    edit rows directly in the Supabase dashboard). RPCs below are SECURITY
--    DEFINER so they can read these regardless of the calling user's role.
-- ----------------------------------------------------------------------------
create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

create policy "Admins can read system settings"
  on public.system_settings for select
  using (public.is_admin());

create policy "Admins can write system settings"
  on public.system_settings for insert
  with check (public.is_admin());

create policy "Admins can update system settings"
  on public.system_settings for update
  using (public.is_admin());

create policy "Admins can delete system settings"
  on public.system_settings for delete
  using (public.is_admin());

grant select, insert, update, delete on public.system_settings to authenticated;

insert into public.system_settings (key, value) values
  ('review_delay_hours_villa', '24'),
  ('review_delay_hours_car', '6'),
  ('review_delay_hours_transfer', '3'),
  ('review_delay_hours_event_service', '6'),
  ('host_review_limit_owner_24h', '1'),
  ('host_review_limit_agent_24h', '3'),
  ('reviewer_limit_24h', '3'),
  ('new_account_review_block_hours', '24'),
  ('new_host_moderation_count', '3')
on conflict (key) do nothing;

-- Generic numeric reader — every limit above is a bare jsonb number, so one
-- helper covers all of them instead of a getter per setting.
create or replace function public.get_setting_numeric(p_key text, p_default numeric default 0)
returns numeric
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::numeric from public.system_settings where key = p_key),
    p_default
  );
$$;

-- ----------------------------------------------------------------------------
-- 2) listing_contacts — one row per (user, listing) the first time that user
--    reveals/uses the WhatsApp button for that listing. Upserted with
--    ON CONFLICT DO NOTHING so contacted_at always reflects the first
--    contact, never a later click.
-- ----------------------------------------------------------------------------
create table public.listing_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  contacted_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

alter table public.listing_contacts enable row level security;

create policy "Users can view their own contact records"
  on public.listing_contacts for select
  using (user_id = auth.uid());

create policy "Users can record their own contact"
  on public.listing_contacts for insert
  with check (user_id = auth.uid());

grant select, insert on public.listing_contacts to authenticated;

-- ----------------------------------------------------------------------------
-- 3) reviews — extend the status machine, add host_id (denormalized for
--    fast host-level queue queries) and published_at, and lock direct writes
--    down to what submit_review()/admin moderation actually need.
-- ----------------------------------------------------------------------------
alter table public.reviews drop constraint reviews_status_check;
alter table public.reviews add constraint reviews_status_check
  check (status in ('pending_moderation', 'queued', 'published', 'flagged', 'hidden', 'rejected'));

alter table public.reviews add column published_at timestamptz;
alter table public.reviews add column host_id uuid references public.profiles(id) on delete cascade;

-- Backfill existing rows (every existing review is 'published' under the old
-- system, so treat created_at as its publish time).
update public.reviews r
set host_id = l.host_id
from public.listings l
where r.listing_id = l.id and r.host_id is null;

update public.reviews
set published_at = created_at
where status = 'published' and published_at is null;

alter table public.reviews alter column host_id set not null;
alter table public.reviews add constraint reviews_reviewer_listing_unique unique (reviewer_id, listing_id);

-- Keep host_id in sync automatically — submit_review() doesn't have to set
-- it, and it can never drift from listings.host_id.
create or replace function public.set_review_host_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  select host_id into new.host_id from public.listings where id = new.listing_id;
  return new;
end;
$$;

create trigger reviews_set_host_id
  before insert on public.reviews
  for each row execute function public.set_review_host_id();

-- Direct inserts are no longer allowed — every review must go through
-- submit_review() so eligibility/queue/moderation logic can't be bypassed by
-- calling the table directly.
drop policy "Signed-in users can write reviews" on public.reviews;
revoke insert on public.reviews from authenticated;

-- Reviewer no longer gets a standing UPDATE grant on their own row (nothing
-- in the product ever edits a submitted review). Host keeps write access for
-- host_reply; admin keeps write access for moderation. A trigger below then
-- makes sure "host access" really only means host_reply.
drop policy "Reviewer, host (reply) and admin can update" on public.reviews;
create policy "Host can reply, admin can moderate"
  on public.reviews for update
  using (public.is_listing_host(listing_id) or public.is_admin());

create or replace function public.protect_review_moderation_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.rating is distinct from old.rating
       or new.text is distinct from old.text
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.host_id is distinct from old.host_id
       or new.listing_id is distinct from old.listing_id
       or new.reviewer_id is distinct from old.reviewer_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Only an admin can change moderation fields on a review';
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_protect_moderation_columns
  before update on public.reviews
  for each row execute function public.protect_review_moderation_columns();

-- Reviews are read a lot by listing (public display) and by host (queue
-- math) and by reviewer (24h rate limit) — none of that had an index before.
create index reviews_listing_id_idx on public.reviews (listing_id);
create index reviews_host_id_published_at_idx on public.reviews (host_id, published_at);
create index reviews_reviewer_id_created_at_idx on public.reviews (reviewer_id, created_at);

-- ----------------------------------------------------------------------------
-- 4) can_review_listing — read-only eligibility check, four layers deep.
--    Ignores whatever p_user_id the caller passes for anything but shape
--    compatibility with the spec'd signature; auth.uid() is the only trusted
--    identity inside a SECURITY DEFINER function.
-- ----------------------------------------------------------------------------
create or replace function public.can_review_listing(p_user_id uuid, p_listing_id uuid)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_contacted_at timestamptz;
  v_host_id uuid;
  v_category text;
  v_delay_hours numeric;
  v_account_created_at timestamptz;
  v_block_hours numeric;
  v_recent_review_count int;
  v_reviewer_limit numeric;
begin
  if p_user_id is distinct from v_uid or v_uid is null then
    return jsonb_build_object('eligible', false, 'reason', 'unauthorized');
  end if;

  select host_id, category into v_host_id, v_category
  from public.listings where id = p_listing_id;

  if v_host_id is null then
    return jsonb_build_object('eligible', false, 'reason', 'listing_not_found');
  end if;

  -- QAT 1
  if v_host_id = v_uid then
    return jsonb_build_object('eligible', false, 'reason', 'own_listing');
  end if;

  select contacted_at into v_contacted_at
  from public.listing_contacts
  where user_id = v_uid and listing_id = p_listing_id;

  if v_contacted_at is null then
    return jsonb_build_object('eligible', false, 'reason', 'no_contact');
  end if;

  if exists (select 1 from public.reviews where reviewer_id = v_uid and listing_id = p_listing_id) then
    return jsonb_build_object('eligible', false, 'reason', 'already_reviewed');
  end if;

  -- QAT 2 — category-specific cool-down
  v_delay_hours := public.get_setting_numeric(
    case v_category
      when 'villa' then 'review_delay_hours_villa'
      when 'car' then 'review_delay_hours_car'
      when 'transfer' then 'review_delay_hours_transfer'
      else 'review_delay_hours_event_service'
    end,
    24
  );
  if v_contacted_at + (v_delay_hours || ' hours')::interval > now() then
    return jsonb_build_object(
      'eligible', false, 'reason', 'too_soon',
      'available_at', v_contacted_at + (v_delay_hours || ' hours')::interval
    );
  end if;

  -- QAT 3 — new-account block
  select created_at into v_account_created_at from auth.users where id = v_uid;
  v_block_hours := public.get_setting_numeric('new_account_review_block_hours', 24);
  if v_account_created_at is null or v_account_created_at + (v_block_hours || ' hours')::interval > now() then
    return jsonb_build_object('eligible', false, 'reason', 'new_account');
  end if;

  -- QAT 4 — reviewer-level 24h rate limit (reject, never queue)
  select count(*) into v_recent_review_count
  from public.reviews
  where reviewer_id = v_uid and created_at > now() - interval '24 hours';

  v_reviewer_limit := public.get_setting_numeric('reviewer_limit_24h', 3);
  if v_recent_review_count >= v_reviewer_limit then
    return jsonb_build_object('eligible', false, 'reason', 'reviewer_limit');
  end if;

  return jsonb_build_object('eligible', true);
end;
$$;

grant execute on function public.can_review_listing(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 5) submit_review — re-validates eligibility itself (never trusts that the
--    frontend already called can_review_listing), then applies new-host
--    moderation and the host-level publish queue.
--
--    Queue spacing assumption (not explicit in the spec — flagged for
--    review): once a host is at their 24h publish limit, each additional
--    review is spaced 24h / limit apart from the host's last scheduled
--    publish (queued or already published), rather than every queued review
--    jumping a full 24h. This keeps the queue moving at the throttled rate
--    instead of growing a multi-day backlog after a single busy day.
-- ----------------------------------------------------------------------------
create or replace function public.submit_review(p_listing_id uuid, p_rating int, p_text text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_eligibility jsonb;
  v_host_id uuid;
  v_agent_status text;
  v_owner_limit numeric;
  v_agent_limit numeric;
  v_limit numeric;
  v_interval_hours numeric;
  v_published_review_count int;
  v_moderation_count numeric;
  v_last_scheduled timestamptz;
  v_next_slot timestamptz;
  v_new_review_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('eligible', false, 'reason', 'unauthorized');
  end if;

  v_eligibility := public.can_review_listing(v_uid, p_listing_id);
  if not (v_eligibility->>'eligible')::boolean then
    return v_eligibility;
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('eligible', false, 'reason', 'invalid_rating');
  end if;
  if p_text is null or length(trim(p_text)) = 0 then
    return jsonb_build_object('eligible', false, 'reason', 'invalid_text');
  end if;

  select host_id into v_host_id from public.listings where id = p_listing_id;

  -- New-host moderation: how many of this host's reviews have ever actually
  -- reached 'published' (admin-approved from pending_moderation, or
  -- auto-published once past the moderation window)?
  select count(*) into v_published_review_count
  from public.reviews
  where host_id = v_host_id and status = 'published';

  v_moderation_count := public.get_setting_numeric('new_host_moderation_count', 3);

  if v_published_review_count < v_moderation_count then
    insert into public.reviews (listing_id, reviewer_id, rating, text, status)
    values (p_listing_id, v_uid, p_rating, trim(p_text), 'pending_moderation')
    returning id into v_new_review_id;

    return jsonb_build_object('eligible', true, 'status', 'pending_moderation', 'review_id', v_new_review_id);
  end if;

  -- Host-level 24h publish queue (spans every listing this host owns).
  select agent_status into v_agent_status from public.profiles where id = v_host_id;
  v_owner_limit := public.get_setting_numeric('host_review_limit_owner_24h', 1);
  v_agent_limit := public.get_setting_numeric('host_review_limit_agent_24h', 3);
  v_limit := case when v_agent_status = 'approved' then v_agent_limit else v_owner_limit end;
  if v_limit <= 0 then
    v_limit := 1;
  end if;
  v_interval_hours := 24.0 / v_limit;

  select max(published_at) into v_last_scheduled
  from public.reviews
  where host_id = v_host_id and status in ('published', 'queued');

  if v_last_scheduled is null then
    v_next_slot := now();
  else
    v_next_slot := greatest(now(), v_last_scheduled + (v_interval_hours || ' hours')::interval);
  end if;

  if v_next_slot <= now() then
    insert into public.reviews (listing_id, reviewer_id, rating, text, status, published_at)
    values (p_listing_id, v_uid, p_rating, trim(p_text), 'published', now())
    returning id into v_new_review_id;

    return jsonb_build_object('eligible', true, 'status', 'published', 'review_id', v_new_review_id);
  end if;

  insert into public.reviews (listing_id, reviewer_id, rating, text, status, published_at)
  values (p_listing_id, v_uid, p_rating, trim(p_text), 'queued', v_next_slot)
  returning id into v_new_review_id;

  return jsonb_build_object('eligible', true, 'status', 'queued', 'review_id', v_new_review_id, 'published_at', v_next_slot);
end;
$$;

grant execute on function public.submit_review(uuid, int, text) to authenticated;
