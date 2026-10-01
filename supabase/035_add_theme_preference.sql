-- Per-user theme preference for dark mode ('light' | 'dark' | 'system').
alter table public.profiles
  add column if not exists theme_preference text not null default 'system'
  check (theme_preference in ('light', 'dark', 'system'));
