-- Enable RLS on public.astrology_rules (internal engine table).
-- Idempotent: safe to re-run if policies already exist.

do $$
begin
  if to_regclass('public.astrology_rules') is not null then
    execute 'alter table public.astrology_rules enable row level security';

    execute 'drop policy if exists "Service role can manage astrology rules" on public.astrology_rules';
    execute 'create policy "Service role can manage astrology rules"
      on public.astrology_rules
      for all
      to service_role
      using (true)
      with check (true)';
  end if;
end
$$;
