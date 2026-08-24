-- WhatsApp OTP for sending predictions. Writes go through service role APIs.
-- user_id matches auth.uid() / user_profiles.id without a direct auth.users FK.

create table if not exists public.whatsapp_verifications (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  verified_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint whatsapp_verifications_phone_chk check (char_length(phone) between 12 and 20),
  constraint whatsapp_verifications_attempts_chk check (attempts >= 0)
);

create index if not exists whatsapp_verifications_user_phone_idx
  on public.whatsapp_verifications (user_id, phone, created_at desc);

create index if not exists whatsapp_verifications_pending_idx
  on public.whatsapp_verifications (user_id, phone, expires_at)
  where verified_at is null;

alter table public.whatsapp_verifications enable row level security;

revoke all on table public.whatsapp_verifications from anon, authenticated;
grant all on table public.whatsapp_verifications to service_role;

drop policy if exists "Service role can manage whatsapp verifications" on public.whatsapp_verifications;
create policy "Service role can manage whatsapp verifications"
  on public.whatsapp_verifications
  for all
  to service_role
  using (true)
  with check (true);
