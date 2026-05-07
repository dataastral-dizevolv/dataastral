-- RLS PRECHECK (READ-ONLY)
-- Execute before applying:
-- supabase/migrations/20260506153000_harden_sensitive_rls.sql

-- 1) Contexto de execução / schema
select current_database() as database_name, current_user as executing_user, now() as executed_at;
select current_schema() as current_schema_name;

-- 2) Função crítica is_admin(uuid)
select
  n.nspname as schema_name,
  p.proname as function_name,
  oidvectortypes(p.proargtypes) as arg_types,
  pg_get_function_result(p.oid) as return_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_admin'
order by 1, 2, 3;

-- 3) Existência das tabelas alvo
with target_tables(table_name) as (
  values
    ('profiles'),
    ('user_profiles'),
    ('user_predictions'),
    ('user_prediction_history'),
    ('credit_transactions'),
    ('engine_audit_logs'),
    ('calculator_questions'),
    ('credit_packages'),
    ('guest_usage'),
    ('admin_emails'),
    ('astrology_rules')
)
select
  t.table_name,
  to_regclass('public.' || t.table_name) is not null as exists_in_public
from target_tables t
order by t.table_name;

-- 4) Estado atual de RLS das tabelas alvo
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

-- 5) Policies atuais (baseline para rollback)
select
  schemaname,
  tablename,
  policyname,
  permissive,
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

-- 6) Grants por tabela (visão de privilégios)
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
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
order by table_name, grantee, privilege_type;

