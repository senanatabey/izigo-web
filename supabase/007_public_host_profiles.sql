create policy "Public can view profiles of hosts with approved listings"
  on public.profiles for select
  using (
    exists (
      select 1 from public.listings
      where listings.host_id = profiles.id and listings.status = 'approved'
    )
  );

grant select on public.profiles to anon;
