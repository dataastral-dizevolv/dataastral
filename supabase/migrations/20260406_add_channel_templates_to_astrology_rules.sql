alter table public.astrology_rules
  add column if not exists template_audio text,
  add column if not exists template_whatsapp text;
