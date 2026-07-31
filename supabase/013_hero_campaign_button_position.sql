-- Lets admins position the invisible click zone over a full-banner image's
-- own baked-in button, since that button can sit anywhere in the artwork.
alter table public.hero_campaigns add column button_pos_x numeric not null default 5;
alter table public.hero_campaigns add column button_pos_y numeric not null default 78;
alter table public.hero_campaigns add column button_pos_w numeric not null default 20;
alter table public.hero_campaigns add column button_pos_h numeric not null default 8;
