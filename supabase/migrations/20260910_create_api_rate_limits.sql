-- Shared API rate limit counter. Writes go through service role only.

create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  count integer not null default 0,
  constraint api_rate_limits_key_chk check (char_length(key) between 1 and 180),
  constraint api_rate_limits_count_chk check (count >= 0)
);

create index if not exists api_rate_limits_window_idx
  on public.api_rate_limits (window_started_at);

alter table public.api_rate_limits enable row level security;

revoke all on table public.api_rate_limits from anon, authenticated;
grant all on table public.api_rate_limits to service_role;

drop policy if exists "Service role can manage api rate limits" on public.api_rate_limits;
create policy "Service role can manage api rate limits"
  on public.api_rate_limits
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.consume_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if p_key is null or char_length(trim(p_key)) = 0 or char_length(p_key) > 180 then
    return false;
  end if;

  if p_max is null or p_max < 1 or p_max > 10000 then
    return false;
  end if;

  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.api_rate_limits as limits (key, window_started_at, count)
  values (trim(p_key), v_now, 1)
  on conflict (key) do update
    set
      count = case
        when limits.window_started_at > v_now - make_interval(secs => p_window_seconds)
        then limits.count + 1
        else 1
      end,
      window_started_at = case
        when limits.window_started_at > v_now - make_interval(secs => p_window_seconds)
        then limits.window_started_at
        else v_now
      end
  returning limits.count into v_count;

  return v_count <= p_max;
end;
$function$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, integer, integer) from anon;
revoke all on function public.consume_rate_limit(text, integer, integer) from authenticated;

grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.consume_rate_limit(text, integer, integer) to postgres;
