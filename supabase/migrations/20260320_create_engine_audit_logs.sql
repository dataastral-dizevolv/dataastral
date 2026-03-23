create table if not exists public.engine_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text,
  question text,
  success boolean not null,
  engine_code text,
  execution_time_ms integer,
  technical_details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists engine_audit_logs_user_created_idx
  on public.engine_audit_logs (user_id, created_at desc);

create index if not exists engine_audit_logs_code_created_idx
  on public.engine_audit_logs (engine_code, created_at desc);

alter table public.engine_audit_logs enable row level security;

drop policy if exists "Users can read own engine audit logs" on public.engine_audit_logs;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'engine_audit_logs'
      and policyname = 'Admins can read engine audit logs'
  ) then
    create policy "Admins can read engine audit logs"
      on public.engine_audit_logs
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_profiles up
          where up.id = auth.uid()
            and up.role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'engine_audit_logs'
      and policyname = 'Service role can manage engine audit logs'
  ) then
    create policy "Service role can manage engine audit logs"
      on public.engine_audit_logs
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;
