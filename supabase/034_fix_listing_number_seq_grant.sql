-- Fix: "permission denied for sequence listing_number_seq" when a host
-- creates a listing.
--
-- The BEFORE INSERT trigger set_listing_number() (from 027_listing_number)
-- runs as the calling user and calls nextval('public.listing_number_seq').
-- The `authenticated` role has no privilege on that sequence, so the insert
-- fails. Two independent fixes, applied together so it stays fixed even if
-- object grants are reset again (e.g. on a project restore):
--
--   1. Mark the trigger function security definer — nextval then runs with
--      the function owner's rights, not the caller's.
--   2. Grant the sequence to authenticated directly, as a belt-and-braces
--      measure for any other path that might touch it.

create or replace function public.set_listing_number()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.listing_number is null then
    new.listing_number := nextval('public.listing_number_seq');
  end if;
  return new;
end;
$$;

grant usage, select on sequence public.listing_number_seq to authenticated;
