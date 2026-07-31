alter table public.hero_campaigns add column content_type text not null default 'image_only'
  check (content_type in ('full_banner', 'image_only'));

alter table public.hero_campaigns add column button_mode text not null default 'single'
  check (button_mode in ('none', 'single', 'double'));

alter table public.hero_campaigns add column secondary_button_text_en text;
alter table public.hero_campaigns add column secondary_button_text_az text;
alter table public.hero_campaigns add column secondary_button_link text;
