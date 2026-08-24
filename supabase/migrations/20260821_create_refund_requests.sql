-- Pedidos de reembolso (CDC art. 49). FK em profiles, nunca em auth.users.
-- A criação não debita créditos; aprovação é administrativa.

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text,
  status text not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'refund_requests_amount_positive'
      and conrelid = 'public.refund_requests'::regclass
  ) then
    alter table public.refund_requests
      add constraint refund_requests_amount_positive check (amount > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'refund_requests_status_check'
      and conrelid = 'public.refund_requests'::regclass
  ) then
    alter table public.refund_requests
      add constraint refund_requests_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'refund_requests_reason_len'
      and conrelid = 'public.refund_requests'::regclass
  ) then
    alter table public.refund_requests
      add constraint refund_requests_reason_len
      check (reason is null or char_length(reason) <= 1000);
  end if;
end
$$;

create index if not exists refund_requests_user_id_created_at_idx
  on public.refund_requests (user_id, created_at desc);

create index if not exists refund_requests_pending_created_at_idx
  on public.refund_requests (created_at desc)
  where status = 'pending';

comment on table public.refund_requests is
  'Pedidos de reembolso de créditos não utilizados (CDC art. 49). A criação não debita créditos; aprovação é administrativa.';

create or replace function public.refund_requests_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists refund_requests_set_updated_at on public.refund_requests;
create trigger refund_requests_set_updated_at
before update on public.refund_requests
for each row
execute function public.refund_requests_set_updated_at();

alter table public.refund_requests enable row level security;

drop policy if exists "Users insert own refund requests" on public.refund_requests;
create policy "Users insert own refund requests"
  on public.refund_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users view own refund requests" on public.refund_requests;
create policy "Users view own refund requests"
  on public.refund_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins view all refund requests" on public.refund_requests;
create policy "Admins view all refund requests"
  on public.refund_requests
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update refund requests" on public.refund_requests;
create policy "Admins update refund requests"
  on public.refund_requests
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Service role can manage refund requests" on public.refund_requests;
create policy "Service role can manage refund requests"
  on public.refund_requests
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.refund_requests from anon;
grant select, insert, update on table public.refund_requests to authenticated;
grant all on table public.refund_requests to service_role;
