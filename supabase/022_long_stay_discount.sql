-- Optional long-stay (2+ nights) discount for villa/house listings — MVP,
-- a single discount tier only. Additive columns with safe defaults so every
-- existing listing keeps working exactly as before (discount off, 2-night
-- default threshold that only matters once enabled).

alter table public.listings
  add column long_stay_discount_enabled boolean not null default false,
  add column long_stay_min_nights integer not null default 2,
  add column long_stay_discount_type text
    check (long_stay_discount_type in ('percentage', 'fixed_price')),
  add column long_stay_discount_value numeric;

alter table public.listings
  add constraint long_stay_min_nights_check check (long_stay_min_nights >= 2);
