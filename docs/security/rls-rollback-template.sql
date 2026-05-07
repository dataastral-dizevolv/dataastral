-- RLS ROLLBACK TEMPLATE
-- WARNING:
-- 1) DO NOT execute this template as-is.
-- 2) Fill with REAL baseline exported from pg_policies BEFORE apply.
-- 3) This file must be customized per environment/time of apply.
-- 4) No invented policy definitions should be used.

-- Required input before use:
-- - Output of docs/security/rls-precheck.sql (pg_policies + RLS state)
-- - Confirmed policy DDL for each affected table

begin;

-- =========================================================
-- TABLE: public.profiles
-- Paste baseline rollback DDL below:
-- Example structure only (replace with real policy definitions):
-- drop policy if exists "POLICY_NAME" on public.profiles;
-- create policy "POLICY_NAME"
--   on public.profiles
--   for select
--   to authenticated
--   using (...real baseline predicate...);
-- =========================================================

-- =========================================================
-- TABLE: public.user_profiles
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.user_predictions
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.user_prediction_history
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.credit_transactions
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.engine_audit_logs
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.calculator_questions
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.credit_packages
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.guest_usage
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.admin_emails
-- Paste baseline rollback DDL below.
-- =========================================================

-- =========================================================
-- TABLE: public.astrology_rules
-- Paste baseline rollback DDL below.
-- =========================================================

-- Optional verification queries after rollback can be executed separately
-- using docs/security/rls-postcheck.sql adapted for rollback expectations.

commit;

