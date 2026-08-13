-- Notify the host as soon as a review is created for one of their listings —
-- regardless of which branch it lands in (pending_moderation/queued/
-- published), since the host can already see and reply to it from
-- MyListingsPage the moment it exists, not only once it's publicly visible.
-- Full CREATE OR REPLACE of submit_review() (from 031) with one addition:
-- a public.notifications insert right after v_host_id is resolved.

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

  -- New: let the host know right away, so they can reply in time — this
  -- fires once per submission, no matter which status branch is taken below.
  insert into public.notifications (user_id, message, link)
  values (v_host_id, 'Elanınıza yeni rəy yazıldı.', '/my-listings');

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
