alter table public.user_profiles
  add column if not exists active boolean not null default true;

update public.user_profiles
set active = true
where active is null;

create index if not exists user_profiles_active_idx on public.user_profiles (active);
