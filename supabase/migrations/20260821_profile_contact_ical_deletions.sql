-- Profile contact fields, iCal feeds, account-deletion cooling-off, and history delete RLS.
-- FKs point to public.profiles (never auth.users). RLS enabled on new tables.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists phone_country text default '+55',
  add column if not exists whatsapp text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_length check (phone is null or char_length(phone) <= 20);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_country_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_country_length check (phone_country is null or char_length(phone_country) <= 8);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_whatsapp_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_whatsapp_length check (whatsapp is null or char_length(whatsapp) <= 20);
  end if;
end
$$;

create unique index if not exists profiles_phone_unique
  on public.profiles (phone)
  where phone is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_ical_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  url text not null,
  color text not null default 'hsl(211 45% 53%)',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_ical_feeds_label_length check (char_length(trim(label)) between 1 and 80),
  constraint user_ical_feeds_url_length check (char_length(url) between 12 and 2000)
);

create index if not exists user_ical_feeds_user_id_idx
  on public.user_ical_feeds (user_id, created_at);

drop trigger if exists trg_user_ical_feeds_updated on public.user_ical_feeds;
create trigger trg_user_ical_feeds_updated
  before update on public.user_ical_feeds
  for each row
  execute function public.set_updated_at();

alter table public.user_ical_feeds enable row level security;
alter table public.user_ical_feeds force row level security;

drop policy if exists "Users can read own ical feeds" on public.user_ical_feeds;
create policy "Users can read own ical feeds"
  on public.user_ical_feeds
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own ical feeds" on public.user_ical_feeds;
create policy "Users can insert own ical feeds"
  on public.user_ical_feeds
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own ical feeds" on public.user_ical_feeds;
create policy "Users can update own ical feeds"
  on public.user_ical_feeds
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own ical feeds" on public.user_ical_feeds;
create policy "Users can delete own ical feeds"
  on public.user_ical_feeds
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Service role can manage ical feeds" on public.user_ical_feeds;
create policy "Service role can manage ical feeds"
  on public.user_ical_feeds
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on public.user_ical_feeds to authenticated;
grant all on public.user_ical_feeds to service_role;

create table if not exists public.pending_deletions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null,
  cancellation_token text not null,
  created_at timestamptz not null default now()
);

create index if not exists pending_deletions_scheduled_idx
  on public.pending_deletions (scheduled_for);

alter table public.pending_deletions enable row level security;
alter table public.pending_deletions force row level security;

drop policy if exists "Users can view their own pending deletions" on public.pending_deletions;
create policy "Users can view their own pending deletions"
  on public.pending_deletions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert their own pending deletions" on public.pending_deletions;
create policy "Users can insert their own pending deletions"
  on public.pending_deletions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own pending deletions" on public.pending_deletions;
create policy "Users can delete their own pending deletions"
  on public.pending_deletions
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Service role can manage pending deletions" on public.pending_deletions;
create policy "Service role can manage pending deletions"
  on public.pending_deletions
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, delete on public.pending_deletions to authenticated;
grant all on public.pending_deletions to service_role;

revoke select (cancellation_token) on public.pending_deletions from anon, authenticated;

do $$
begin
  if to_regclass('public.user_prediction_history') is not null then
    execute 'drop policy if exists "Users can delete own prediction history" on public.user_prediction_history';
    execute 'create policy "Users can delete own prediction history"
      on public.user_prediction_history
      for delete
      to authenticated
      using (auth.uid() = user_id)';
  end if;
end
$$;
