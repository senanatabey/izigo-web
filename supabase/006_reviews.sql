create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  text text not null,
  host_reply text,
  status text not null default 'published' check (status in ('published', 'flagged', 'hidden')),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- helper: is the current user the host of this listing?
create function public.is_listing_host(target_listing_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.listings where id = target_listing_id and host_id = auth.uid()
  );
$$;

create policy "Published reviews are public, reviewer/host/admin see all"
  on public.reviews for select
  using (
    status = 'published'
    or reviewer_id = auth.uid()
    or public.is_listing_host(listing_id)
    or public.is_admin()
  );

create policy "Signed-in users can write reviews"
  on public.reviews for insert
  with check (reviewer_id = auth.uid());

create policy "Reviewer, host (reply) and admin can update"
  on public.reviews for update
  using (reviewer_id = auth.uid() or public.is_listing_host(listing_id) or public.is_admin());

create policy "Reviewer and admin can delete"
  on public.reviews for delete
  using (reviewer_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.reviews to authenticated;
grant select on public.reviews to anon;
