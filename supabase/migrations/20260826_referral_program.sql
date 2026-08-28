-- Programa de indicação: código por usuário, pontos e atribuição quem indicou quem.
-- FKs apontam para public.profiles (não auth.users). RLS habilitado.
-- Regra: +1 referral_point ao indicador quando o indicado completa o cadastro (uma vez).

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  attempts integer := 0;
begin
  loop
    attempts := attempts + 1;
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    exit when not exists (
      select 1 from public.profiles p where p.referral_code = candidate
    );

    if attempts >= 20 then
      raise exception 'Não foi possível gerar referral_code único';
    end if;
  end loop;

  return candidate;
end;
$$;

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referral_points integer not null default 0,
  add column if not exists referred_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_referral_points_nonneg'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_referral_points_nonneg check (referral_points >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_referred_by_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_referred_by_fkey
      foreign key (referred_by) references public.profiles (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_referred_by_not_self'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_referred_by_not_self check (referred_by is null or referred_by <> id);
  end if;
end
$$;

update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;

alter table public.profiles
  alter column referral_code set not null;

create unique index if not exists profiles_referral_code_unique
  on public.profiles (referral_code);

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by)
  where referred_by is not null;

create table if not exists public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null references public.profiles (id) on delete cascade,
  points_awarded integer not null default 1,
  created_at timestamptz not null default now(),
  constraint referral_attributions_referred_unique unique (referred_id),
  constraint referral_attributions_no_self check (referrer_id <> referred_id),
  constraint referral_attributions_points_positive check (points_awarded > 0)
);

create index if not exists referral_attributions_referrer_id_idx
  on public.referral_attributions (referrer_id, created_at desc);

alter table public.referral_attributions enable row level security;

drop policy if exists "Users can read own referral attributions" on public.referral_attributions;
create policy "Users can read own referral attributions"
  on public.referral_attributions
  for select
  to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());

drop policy if exists "Service role can manage referral attributions" on public.referral_attributions;
create policy "Service role can manage referral attributions"
  on public.referral_attributions
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.attribute_referral(p_referred_id uuid, p_referral_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  referrer_uuid uuid;
  already_referred uuid;
  points_to_award integer := 1;
  inserted_id uuid;
begin
  if p_referred_id is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_referred');
  end if;

  normalized_code := upper(trim(coalesce(p_referral_code, '')));
  if normalized_code = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_code');
  end if;

  select referred_by into already_referred
  from public.profiles
  where id = p_referred_id;

  if already_referred is not null then
    return jsonb_build_object('ok', true, 'reason', 'already_attributed', 'points_awarded', 0);
  end if;

  if exists (
    select 1 from public.referral_attributions ra where ra.referred_id = p_referred_id
  ) then
    return jsonb_build_object('ok', true, 'reason', 'already_attributed', 'points_awarded', 0);
  end if;

  select id into referrer_uuid
  from public.profiles
  where referral_code = normalized_code
  limit 1;

  if referrer_uuid is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  if referrer_uuid = p_referred_id then
    return jsonb_build_object('ok', false, 'reason', 'self_referral');
  end if;

  update public.profiles
  set referred_by = referrer_uuid,
      updated_at = now()
  where id = p_referred_id
    and referred_by is null;

  if not found then
    return jsonb_build_object('ok', true, 'reason', 'already_attributed', 'points_awarded', 0);
  end if;

  insert into public.referral_attributions (referrer_id, referred_id, points_awarded)
  values (referrer_uuid, p_referred_id, points_to_award)
  on conflict (referred_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    update public.profiles
    set referred_by = null,
        updated_at = now()
    where id = p_referred_id
      and referred_by = referrer_uuid;

    return jsonb_build_object('ok', true, 'reason', 'already_attributed', 'points_awarded', 0);
  end if;

  update public.profiles
  set referral_points = referral_points + points_to_award,
      updated_at = now()
  where id = referrer_uuid;

  return jsonb_build_object(
    'ok', true,
    'reason', 'attributed',
    'points_awarded', points_to_award,
    'referrer_id', referrer_uuid
  );
end;
$$;

revoke all on function public.attribute_referral(uuid, text) from public;
revoke all on function public.attribute_referral(uuid, text) from anon;
revoke all on function public.attribute_referral(uuid, text) from authenticated;
grant execute on function public.attribute_referral(uuid, text) to service_role;
grant execute on function public.attribute_referral(uuid, text) to postgres;

create or replace function public.handle_new_auth_profile()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  raw_guest_id text;
  usage_guest_id uuid;
  usage_count integer;
  new_referral_code text;
  incoming_ref text;
begin
  raw_guest_id := nullif(new.raw_user_meta_data ->> 'guest_id', '');

  if raw_guest_id is not null
     and raw_guest_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    usage_guest_id := raw_guest_id::uuid;
  else
    usage_guest_id := null;
  end if;

  if usage_guest_id is not null then
    insert into public.guest_usage (guest_id, questions_asked)
    values (usage_guest_id, 0)
    on conflict (guest_id) do nothing;

    select gu.questions_asked
      into usage_count
      from public.guest_usage gu
      where gu.guest_id = usage_guest_id;
  else
    usage_count := 0;
  end if;

  new_referral_code := public.generate_referral_code();

  insert into public.profiles (id, guest_id, credits, referral_code)
  values (
    new.id,
    usage_guest_id,
    greatest(0, 3 - coalesce(usage_count, 0)),
    new_referral_code
  )
  on conflict (id) do nothing;

  incoming_ref := nullif(trim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')), '');
  if incoming_ref is not null then
    perform public.attribute_referral(new.id, incoming_ref);
  end if;

  return new;
end;
$function$;
