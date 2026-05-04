create table if not exists public.credit_packages (
  id text primary key,
  label text not null,
  credits integer not null check (credits > 0),
  price_cents integer not null check (price_cents > 0),
  stripe_price_id text,
  badge text,
  is_active boolean not null default true,
  "order" integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.credit_packages (id, label, credits, price_cents, stripe_price_id, badge, is_active, "order")
values
  ('starter', 'Starter', 1, 1290, null, null, true, 10),
  ('popular', 'Popular', 3, 3390, null, 'Mais Popular', true, 20),
  ('value', 'Value', 5, 4990, null, 'Melhor Valor', true, 30)
on conflict (id) do update set
  label = excluded.label,
  credits = excluded.credits,
  price_cents = excluded.price_cents,
  badge = excluded.badge,
  is_active = excluded.is_active,
  "order" = excluded."order",
  updated_at = now();

create index if not exists credit_packages_active_order_idx
  on public.credit_packages (is_active, "order" asc, id asc);

create unique index if not exists credit_packages_stripe_price_id_uidx
  on public.credit_packages (stripe_price_id)
  where stripe_price_id is not null and length(trim(stripe_price_id)) > 0;

alter table public.credit_packages enable row level security;

drop policy if exists "Public can read active credit packages" on public.credit_packages;
create policy "Public can read active credit packages"
  on public.credit_packages
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins can manage credit packages" on public.credit_packages;
create policy "Admins can manage credit packages"
  on public.credit_packages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'admin'
        and up.active = true
    )
  )
  with check (
    exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'admin'
        and up.active = true
    )
  );

drop policy if exists "Service role can manage credit packages" on public.credit_packages;
create policy "Service role can manage credit packages"
  on public.credit_packages
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
