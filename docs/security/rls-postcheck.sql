-- RLS POSTCHECK (READ-ONLY)
-- Execute after applying:
-- supabase/migrations/20260506153000_harden_sensitive_rls.sql

-- 1) Estado final de RLS por tabela alvo
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles',
    'user_profiles',
    'user_predictions',
    'user_prediction_history',
    'credit_transactions',
    'engine_audit_logs',
    'calculator_questions',
    'credit_packages',
    'guest_usage',
    'admin_emails',
    'astrology_rules'
  )
order by c.relname;

-- 2) Policies finais em tabelas alvo
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'user_profiles',
    'user_predictions',
    'user_prediction_history',
    'credit_transactions',
    'engine_audit_logs',
    'calculator_questions',
    'credit_packages',
    'guest_usage',
    'admin_emails',
    'astrology_rules'
  )
order by tablename, policyname;

-- 3) Alertas: roles anon/public em tabelas privadas (não deveria haver)
with private_tables(tablename) as (
  values
    ('profiles'),
    ('user_profiles'),
    ('user_predictions'),
    ('user_prediction_history'),
    ('credit_transactions'),
    ('engine_audit_logs'),
    ('guest_usage'),
    ('admin_emails'),
    ('astrology_rules')
)
select
  p.tablename,
  p.policyname,
  p.roles,
  p.cmd
from pg_policies p
join private_tables t on t.tablename = p.tablename
where p.schemaname = 'public'
  and (
    p.roles::text ilike '%anon%'
    or p.roles::text ilike '%public%'
  )
order by p.tablename, p.policyname;

-- 4) calculator_questions público restrito a ativo e não deletado
select
  tablename,
  policyname,
  roles,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
  and tablename = 'calculator_questions'
  and policyname ilike '%Public can read active calculator questions%';

-- 5) credit_packages público restrito a ativo
select
  tablename,
  policyname,
  roles,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
  and tablename = 'credit_packages'
  and policyname ilike '%Public can read active credit packages%';

-- 6) user_predictions policy em authenticated (não public)
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'user_predictions'
order by policyname;

-- 7) Verificar policies service_role esperadas
select
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and policyname ilike '%Service role can manage%'
  and tablename in (
    'profiles',
    'user_profiles',
    'user_predictions',
    'user_prediction_history',
    'credit_transactions',
    'engine_audit_logs',
    'calculator_questions',
    'credit_packages',
    'guest_usage',
    'admin_emails',
    'astrology_rules'
  )
order by tablename, policyname;

