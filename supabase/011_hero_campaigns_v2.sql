-- Replace the simple is_active flag with a proper lifecycle status + priority,
-- and widen campaign_type to cover future marketing use cases.

alter table public.hero_campaigns add column status text not null default 'draft'
  check (status in ('draft', 'scheduled', 'published', 'expired', 'archived'));

update public.hero_campaigns set status = case when is_active then 'published' else 'draft' end;

alter table public.hero_campaigns drop column is_active;

alter table public.hero_campaigns add column priority int not null default 5 check (priority between 1 and 10);

alter table public.hero_campaigns drop constraint hero_campaigns_campaign_type_check;
alter table public.hero_campaigns add constraint hero_campaigns_campaign_type_check
  check (campaign_type in (
    'seasonal', 'featured_destination', 'events', 'announcement',
    'local_experiences', 'plan_my_trip', 'sponsored', 'custom'
  ));

-- existing rows created before this migration used the old 'winter'/'summer'/'nowruz'/'formula1' values;
-- fold them into 'seasonal' so the constraint above doesn't reject them
update public.hero_campaigns set campaign_type = 'seasonal'
  where campaign_type in ('winter', 'summer', 'nowruz', 'formula1');
