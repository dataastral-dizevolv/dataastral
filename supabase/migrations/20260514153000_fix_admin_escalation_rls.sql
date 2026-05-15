-- Fix admin escalation risk on user_profiles by removing broad self-update path.
-- Keeps insert/select for own row and admin/server-side management.

do $$
begin
  if to_regclass('public.user_profiles') is not null then
    execute 'alter table public.user_profiles enable row level security';

    -- Remove broad self-update policies that allowed full-row updates.
    execute 'drop policy if exists "Users can update own profile and admins can update all" on public.user_profiles';
    execute 'drop policy if exists "Users can update own profile" on public.user_profiles';

    -- Keep admin update policy based on trusted RPC predicate.
    execute 'drop policy if exists "Admins can update user profiles" on public.user_profiles';
    if to_regprocedure('public.is_admin(uuid)') is not null then
      execute 'create policy "Admins can update user profiles"
        on public.user_profiles
        for update
        to authenticated
        using (public.is_admin(auth.uid()))
        with check (public.is_admin(auth.uid()))';
    end if;

    -- Defense in depth: authenticated users cannot run direct UPDATE on user_profiles.
    execute 'revoke update on table public.user_profiles from authenticated';
    execute 'revoke update on table public.user_profiles from anon';

    -- Explicitly revoke sensitive columns when they exist.
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user_profiles'
        and column_name = 'role'
    ) then
      execute 'revoke update(role) on public.user_profiles from authenticated';
      execute 'revoke update(role) on public.user_profiles from anon';
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user_profiles'
        and column_name = 'active'
    ) then
      execute 'revoke update(active) on public.user_profiles from authenticated';
      execute 'revoke update(active) on public.user_profiles from anon';
    end if;
  end if;
end
$$;
