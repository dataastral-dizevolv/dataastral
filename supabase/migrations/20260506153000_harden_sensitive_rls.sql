-- Security hardening migration for sensitive tables RLS/policies.
-- Idempotent by table existence checks + DROP POLICY IF EXISTS.
-- This migration is intended for review first and should not be auto-applied to production.

do $$
begin
  -- public.profiles
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';

    execute 'drop policy if exists "Users can read own profile credits" on public.profiles';
    execute 'drop policy if exists "Users can read own profile" on public.profiles';
    execute 'create policy "Users can read own profile"
      on public.profiles
      for select
      to authenticated
      using (id = auth.uid())';

    execute 'drop policy if exists "Service role can manage profiles" on public.profiles';
    execute 'create policy "Service role can manage profiles"
      on public.profiles
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.user_profiles
  if to_regclass('public.user_profiles') is not null then
    execute 'alter table public.user_profiles enable row level security';

    execute 'drop policy if exists "Users can read own profile and admins can read all" on public.user_profiles';
    execute 'drop policy if exists "Users can read own profile" on public.user_profiles';
    execute 'create policy "Users can read own profile"
      on public.user_profiles
      for select
      to authenticated
      using (id = auth.uid())';

    execute 'drop policy if exists "Users can insert own profile" on public.user_profiles';
    execute 'create policy "Users can insert own profile"
      on public.user_profiles
      for insert
      to authenticated
      with check (id = auth.uid())';

    execute 'drop policy if exists "Users can update own profile and admins can update all" on public.user_profiles';
    execute 'drop policy if exists "Users can update own profile" on public.user_profiles';
    execute 'create policy "Users can update own profile"
      on public.user_profiles
      for update
      to authenticated
      using (id = auth.uid())
      with check (id = auth.uid())';

    if to_regprocedure('public.is_admin(uuid)') is not null then
      execute 'drop policy if exists "Admins can read user profiles" on public.user_profiles';
      execute 'create policy "Admins can read user profiles"
        on public.user_profiles
        for select
        to authenticated
        using (public.is_admin(auth.uid()))';

      execute 'drop policy if exists "Admins can update user profiles" on public.user_profiles';
      execute 'create policy "Admins can update user profiles"
        on public.user_profiles
        for update
        to authenticated
        using (public.is_admin(auth.uid()))
        with check (public.is_admin(auth.uid()))';
    end if;

    execute 'drop policy if exists "Service role can manage user profiles" on public.user_profiles';
    execute 'create policy "Service role can manage user profiles"
      on public.user_profiles
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.user_predictions
  if to_regclass('public.user_predictions') is not null then
    execute 'alter table public.user_predictions enable row level security';

    execute 'drop policy if exists "Users can read own predictions" on public.user_predictions';
    execute 'create policy "Users can read own predictions"
      on public.user_predictions
      for select
      to authenticated
      using (auth.uid() = user_id)';

    execute 'drop policy if exists "Users can insert own predictions" on public.user_predictions';
    execute 'create policy "Users can insert own predictions"
      on public.user_predictions
      for insert
      to authenticated
      with check (auth.uid() = user_id)';

    execute 'drop policy if exists "Service role can manage user predictions" on public.user_predictions';
    execute 'create policy "Service role can manage user predictions"
      on public.user_predictions
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.user_prediction_history
  if to_regclass('public.user_prediction_history') is not null then
    execute 'alter table public.user_prediction_history enable row level security';

    execute 'drop policy if exists "Users can read own prediction history" on public.user_prediction_history';
    execute 'create policy "Users can read own prediction history"
      on public.user_prediction_history
      for select
      to authenticated
      using (auth.uid() = user_id)';

    execute 'drop policy if exists "Users can insert own prediction history" on public.user_prediction_history';
    execute 'create policy "Users can insert own prediction history"
      on public.user_prediction_history
      for insert
      to authenticated
      with check (auth.uid() = user_id)';

    execute 'drop policy if exists "Service role can manage prediction history" on public.user_prediction_history';
    execute 'create policy "Service role can manage prediction history"
      on public.user_prediction_history
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.credit_transactions
  if to_regclass('public.credit_transactions') is not null then
    execute 'alter table public.credit_transactions enable row level security';

    execute 'drop policy if exists "Users can read own credit transactions" on public.credit_transactions';
    execute 'create policy "Users can read own credit transactions"
      on public.credit_transactions
      for select
      to authenticated
      using (auth.uid() = user_id)';

    execute 'drop policy if exists "Users can insert own credit transactions" on public.credit_transactions';

    execute 'drop policy if exists "Service role can manage credit transactions" on public.credit_transactions';
    execute 'create policy "Service role can manage credit transactions"
      on public.credit_transactions
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.engine_audit_logs
  if to_regclass('public.engine_audit_logs') is not null then
    execute 'alter table public.engine_audit_logs enable row level security';

    execute 'drop policy if exists "Users can read own engine audit logs" on public.engine_audit_logs';
    execute 'drop policy if exists "Admins can read engine audit logs" on public.engine_audit_logs';

    if to_regprocedure('public.is_admin(uuid)') is not null then
      execute 'create policy "Admins can read engine audit logs"
        on public.engine_audit_logs
        for select
        to authenticated
        using (public.is_admin(auth.uid()))';
    end if;

    execute 'drop policy if exists "Service role can manage engine audit logs" on public.engine_audit_logs';
    execute 'create policy "Service role can manage engine audit logs"
      on public.engine_audit_logs
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.calculator_questions
  if to_regclass('public.calculator_questions') is not null then
    execute 'alter table public.calculator_questions enable row level security';

    execute 'drop policy if exists "Public can read active calculator questions" on public.calculator_questions';
    execute 'create policy "Public can read active calculator questions"
      on public.calculator_questions
      for select
      to anon, authenticated
      using (is_active = true and deleted_at is null)';

    execute 'drop policy if exists "Admins can manage calculator questions" on public.calculator_questions';
    if to_regprocedure('public.is_admin(uuid)') is not null then
      execute 'create policy "Admins can manage calculator questions"
        on public.calculator_questions
        for all
        to authenticated
        using (public.is_admin(auth.uid()))
        with check (public.is_admin(auth.uid()))';
    end if;

    execute 'drop policy if exists "Service role can manage calculator questions" on public.calculator_questions';
    execute 'create policy "Service role can manage calculator questions"
      on public.calculator_questions
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.credit_packages
  if to_regclass('public.credit_packages') is not null then
    execute 'alter table public.credit_packages enable row level security';

    execute 'drop policy if exists "Public can read active credit packages" on public.credit_packages';
    execute 'create policy "Public can read active credit packages"
      on public.credit_packages
      for select
      to anon, authenticated
      using (is_active = true)';

    execute 'drop policy if exists "Admins can manage credit packages" on public.credit_packages';
    if to_regprocedure('public.is_admin(uuid)') is not null then
      execute 'create policy "Admins can manage credit packages"
        on public.credit_packages
        for all
        to authenticated
        using (public.is_admin(auth.uid()))
        with check (public.is_admin(auth.uid()))';
    end if;

    execute 'drop policy if exists "Service role can manage credit packages" on public.credit_packages';
    execute 'create policy "Service role can manage credit packages"
      on public.credit_packages
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.guest_usage
  if to_regclass('public.guest_usage') is not null then
    execute 'alter table public.guest_usage enable row level security';

    -- Keep guest_usage restricted to backend/service_role.
    -- Do not create anon policies without explicit product confirmation.
    execute 'drop policy if exists "Service role can manage guest usage" on public.guest_usage';
    execute 'create policy "Service role can manage guest usage"
      on public.guest_usage
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.admin_emails
  if to_regclass('public.admin_emails') is not null then
    execute 'alter table public.admin_emails enable row level security';

    execute 'drop policy if exists "Service role can manage admin emails" on public.admin_emails';
    execute 'create policy "Service role can manage admin emails"
      on public.admin_emails
      for all
      to service_role
      using (true)
      with check (true)';
  end if;

  -- public.astrology_rules
  if to_regclass('public.astrology_rules') is not null then
    execute 'alter table public.astrology_rules enable row level security';

    -- Internal table for engine/backend. No public client policy is intentionally created.
    -- If client-side reads are required in the future, confirm scope and add least-privilege policy explicitly.
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
