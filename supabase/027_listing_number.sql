-- Human-facing sequential listing number, separate from the internal UUID.
-- Displayed as "IZ-100001" etc. UUID stays the primary key / URL / FK target.

create sequence public.listing_number_seq start 100001;

alter table public.listings
  add column listing_number integer unique;

create function public.set_listing_number()
returns trigger
language plpgsql
as $$
begin
  if new.listing_number is null then
    new.listing_number := nextval('public.listing_number_seq');
  end if;
  return new;
end;
$$;

create trigger trg_set_listing_number
  before insert on public.listings
  for each row
  execute function public.set_listing_number();

-- Backfill existing rows in creation order, then advance the sequence past them.
with numbered as (
  select id, row_number() over (order by created_at asc) as rn
  from public.listings
  where listing_number is null
)
update public.listings l
set listing_number = 100000 + numbered.rn
from numbered
where l.id = numbered.id;

select setval(
  'public.listing_number_seq',
  greatest(100001, coalesce((select max(listing_number) from public.listings), 100000) + 1),
  false
);
