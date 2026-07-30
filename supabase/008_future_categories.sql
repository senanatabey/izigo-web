alter table public.listings drop constraint listings_category_check;
alter table public.listings add constraint listings_category_check
  check (category in ('villa', 'car', 'transfer', 'event', 'service', 'experience', 'product'));
