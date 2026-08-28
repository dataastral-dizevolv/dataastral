-- Separate signup free questions from paid credits (Lovable parity).
-- Existing rows keep balance in credits; free_questions_remaining backfilled to 0.
-- New signups get free_questions_remaining = 3 - guest_usage (credits start at 0).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_questions_remaining integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_free_questions_remaining_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_free_questions_remaining_check
  CHECK (free_questions_remaining >= 0);

-- Future inserts: free bonus lives on free_questions_remaining, not credits.
ALTER TABLE public.profiles
  ALTER COLUMN free_questions_remaining SET DEFAULT 3;

ALTER TABLE public.profiles
  ALTER COLUMN credits SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.handle_new_auth_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  raw_guest_id text;
  usage_guest_id uuid;
  usage_count integer;
  new_referral_code text;
  incoming_ref text;
  initial_free integer;
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

  initial_free := greatest(0, 3 - coalesce(usage_count, 0));
  new_referral_code := public.generate_referral_code();

  insert into public.profiles (id, guest_id, credits, free_questions_remaining, referral_code)
  values (
    new.id,
    usage_guest_id,
    0,
    initial_free,
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

-- Consume free questions first, then paid credits. Free usage does not write credit_transactions.
CREATE OR REPLACE FUNCTION public.consume_profile_credit(
  p_user_id uuid,
  p_description text DEFAULT 'Uso de credito'::text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_free integer;
  v_remaining integer;
  v_description text;
begin
  select free_questions_remaining
    into v_free
    from public.profiles
   where id = p_user_id
   for update;

  if v_free is null then
    return null;
  end if;

  if v_free > 0 then
    update public.profiles
       set free_questions_remaining = free_questions_remaining - 1
     where id = p_user_id
       and free_questions_remaining > 0
    returning credits into v_remaining;

    return v_remaining;
  end if;

  update public.profiles
     set credits = credits - 1
   where id = p_user_id
     and credits > 0
  returning credits into v_remaining;

  if v_remaining is null then
    return null;
  end if;

  v_description := nullif(trim(coalesce(p_description, '')), '');

  insert into public.credit_transactions (user_id, amount, type, description)
  values (p_user_id, -1, 'usage', coalesce(v_description, 'Uso de 1 credito'));

  return v_remaining;
end;
$function$;
