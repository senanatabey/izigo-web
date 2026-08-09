-- Agent (vasitəçi) host type — additive extension of the existing host
-- profile, not a new role. Owners and agents keep identical permissions;
-- this only affects profile data and how the host is displayed.

alter table public.profiles
  add column host_type text not null default 'owner' check (host_type in ('owner', 'agent'));

alter table public.profiles
  add column agency_name text;

alter table public.profiles
  add column managed_properties_count integer;

-- Extend the signup trigger to also read the new optional fields from
-- signUp metadata. COALESCE guards every existing/new registration that
-- doesn't pass host_type — it always lands on the 'owner' default rather
-- than a NULL that would fail the check constraint above.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, host_type, agency_name, managed_properties_count)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'host_type', 'owner'),
    new.raw_user_meta_data ->> 'agency_name',
    nullif(new.raw_user_meta_data ->> 'managed_properties_count', '')::integer
  );
  return new;
end;
$$;
