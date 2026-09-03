-- ============================================================================
-- Migration 0047: Security Hardening, Rate Limiting & RLS Policy Lockdown
-- ============================================================================

-- 1. Add TOTP Rate Limiting and Temporary Lockout Columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS failed_totp_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS totp_locked_until TIMESTAMPTZ DEFAULT NULL;

-- 2. Lockdown Wide-Open Public Anon RLS Policies
-- Revoke the overly permissive "FOR ALL USING (true)" policies created in prototype migrations

DROP POLICY IF EXISTS "Public access user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public access roles" ON public.roles;
DROP POLICY IF EXISTS "Public access role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Public access audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public access system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public access permissions" ON public.permissions;

-- Enable strict RLS across all security and governance tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Deny public anon direct PostgREST table access (Server Route Handlers use Service Role Key)
-- Allow authenticated service_role full bypass / execution
CREATE POLICY "Service role full access permissions" ON public.permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access roles" ON public.roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access role_permissions" ON public.role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access user_profiles" ON public.user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access system_settings" ON public.system_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Also add index on user_profiles phone_number for fast, secure lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_staff_members_contact ON public.staff_members(contact_no);
