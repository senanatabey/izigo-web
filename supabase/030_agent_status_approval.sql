-- Approval-based agent status — replaces self-declared host_type as the
-- gate for the "Vasitəçi" badge. host_type stays (harmless "intent" marker,
-- untouched), agent_status is the new source of truth for approval state.

alter table public.profiles
  add column agent_status text not null default 'none'
    check (agent_status in ('none', 'pending', 'approved', 'rejected'));

alter table public.profiles
  add column agent_approved_by uuid references public.profiles(id);

alter table public.profiles
  add column agent_approved_at timestamptz;

alter table public.profiles
  add column region text;

-- ---------------------------------------------------------------------------
-- Trigger: a user can never flip their own agent_status/approval fields —
-- only an admin, or an active regional partner for that user's own region,
-- can (checked here at row level, not just hidden in the frontend).
-- ---------------------------------------------------------------------------
create or replace function public.protect_agent_status_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.agent_status is distinct from old.agent_status
     or new.agent_approved_by is distinct from old.agent_approved_by
     or new.agent_approved_at is distinct from old.agent_approved_at then
    if not (
      public.is_admin()
      or exists (
        select 1 from public.regional_partners rp
        where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = old.region
      )
    ) then
      raise exception 'Only a regional partner for this user''s region or an admin can change agent status';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_agent_status
  before update on public.profiles
  for each row
  execute function public.protect_agent_status_columns();

-- ---------------------------------------------------------------------------
-- Approve/reject RPCs — same shape as regional_partner_approve_listing.
-- ---------------------------------------------------------------------------
create or replace function public.approve_agent_request(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_region text;
begin
  select region into v_region from public.profiles where id = p_user_id;
  if v_region is null then
    raise exception 'User has no region on file';
  end if;

  if not (
    public.is_admin()
    or exists (
      select 1 from public.regional_partners rp
      where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = v_region
    )
  ) then
    raise exception 'Not authorized to approve agent requests for this region';
  end if;

  update public.profiles
  set agent_status = 'approved', agent_approved_by = auth.uid(), agent_approved_at = now()
  where id = p_user_id;
end;
$$;

create or replace function public.reject_agent_request(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_region text;
begin
  select region into v_region from public.profiles where id = p_user_id;
  if v_region is null then
    raise exception 'User has no region on file';
  end if;

  if not (
    public.is_admin()
    or exists (
      select 1 from public.regional_partners rp
      where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = v_region
    )
  ) then
    raise exception 'Not authorized to reject agent requests for this region';
  end if;

  update public.profiles
  set agent_status = 'rejected'
  where id = p_user_id;
end;
$$;

grant execute on function public.approve_agent_request(uuid) to authenticated;
grant execute on function public.reject_agent_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Additive SELECT policy — a regional partner can see profiles that applied
-- for agent status in their own region (region is only ever set when a user
-- opts into the agent flow at registration, so this never exposes ordinary
-- guest/owner profiles). Does not touch the existing owner-only policy.
-- ---------------------------------------------------------------------------
create policy "Regional partners can view agent applicants in their region"
  on public.profiles for select
  using (
    exists (
      select 1 from public.regional_partners rp
      where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = profiles.region
    )
  );

-- ---------------------------------------------------------------------------
-- handle_new_user() — FULL updated version (full_name/phone/host_type/
-- agency_name/managed_properties_count lines unchanged from 028; only the
-- new agent_status/region reads are added).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, phone, host_type, agency_name, managed_properties_count,
    agent_status, region
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'host_type', 'owner'),
    new.raw_user_meta_data ->> 'agency_name',
    nullif(new.raw_user_meta_data ->> 'managed_properties_count', '')::integer,
    case when (new.raw_user_meta_data ->> 'wants_agent')::boolean is true then 'pending' else 'none' end,
    new.raw_user_meta_data ->> 'region'
  );
  return new;
end;
$$;
