-- Production safety fix: an admin user's role must never become
-- 'regional_partner' — enforced at the database level, not just by
-- filtering the admin-assignment dropdown in the frontend.

-- 1) Trigger — belt: blocks ANY update path (this RPC, a future admin
-- screen, a stray direct table write, a manual SQL edit through some other
-- tool) from flipping an admin to regional_partner.
create or replace function public.prevent_admin_to_partner_demotion()
returns trigger
language plpgsql
as $$
begin
  if old.role = 'admin' and new.role = 'regional_partner' then
    raise exception 'Cannot change an admin user to regional_partner';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_admin_demotion
before update on public.profiles
for each row
when (old.role is distinct from new.role)
execute function public.prevent_admin_to_partner_demotion();

-- 2) Suspenders — a single SECURITY DEFINER RPC that does the admin check,
-- the "not already an admin" check, the regional_partners upsert, and the
-- profiles.role flip atomically, replacing the two separate direct writes
-- RegionalPartnersPage previously made from the client.
create or replace function public.assign_regional_partner(
  p_user_id uuid,
  p_region text,
  p_revenue_share_percent numeric default 20
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
  v_partner_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can assign regional partners';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if v_role is null then
    raise exception 'User not found';
  end if;
  if v_role = 'admin' then
    raise exception 'Cannot assign an admin user as a regional partner';
  end if;

  insert into public.regional_partners (user_id, region, revenue_share_percent, status)
  values (p_user_id, p_region, coalesce(p_revenue_share_percent, 20), 'active')
  on conflict (user_id, region) do update
    set revenue_share_percent = excluded.revenue_share_percent, status = 'active'
  returning id into v_partner_id;

  update public.profiles set role = 'regional_partner' where id = p_user_id;

  return v_partner_id;
end;
$$;

grant execute on function public.assign_regional_partner(uuid, text, numeric) to authenticated;
