-- ============================================================================
-- Migration 0048: Complete Domain & Master Tables RLS Lockdown
-- Architecture: Deny-All for Public/Anon; Service-Role Only Database Access
-- All PBAC / RBAC and jurisdiction scoping is enforced in Next.js Route Handlers
-- ============================================================================

-- 1. Deprecate and drop unused legacy boilerplate table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Drop all overly permissive legacy prototype policies across existing domain tables

-- Fee Bills Portal
DROP POLICY IF EXISTS "Public full access to fee_bills" ON public.fee_bills;
DROP POLICY IF EXISTS "Public full access to fee_bill_master_items" ON public.fee_bill_master_items;

-- Highways & SLD
DROP POLICY IF EXISTS "Enable select for all users" ON public.highways;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.highways;
DROP POLICY IF EXISTS "Enable update for all users" ON public.highways;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.highways;
DROP POLICY IF EXISTS "Allow public read access on highway_master_config" ON public.highway_master_config;
DROP POLICY IF EXISTS "Allow public insert access on highway_master_config" ON public.highway_master_config;
DROP POLICY IF EXISTS "Allow public update access on highway_master_config" ON public.highway_master_config;
DROP POLICY IF EXISTS "Allow public delete access on highway_master_config" ON public.highway_master_config;
DROP POLICY IF EXISTS "Public full access to highway_sub_chainages" ON public.highway_sub_chainages;

-- Ongoing Capital Works (Major Projects > 50 Cr)
DROP POLICY IF EXISTS "Public full access to major_projects_50cr" ON public.major_projects_50cr;
DROP POLICY IF EXISTS "Public full access to ongoing_works_master_config" ON public.ongoing_works_master_config;
DROP POLICY IF EXISTS "Allow read major_projects_snapshots" ON public.major_projects_snapshots;
DROP POLICY IF EXISTS "Allow insert major_projects_snapshots" ON public.major_projects_snapshots;
DROP POLICY IF EXISTS "Allow update major_projects_snapshots" ON public.major_projects_snapshots;
DROP POLICY IF EXISTS "Allow delete major_projects_snapshots" ON public.major_projects_snapshots;

-- DLP Maintenance
DROP POLICY IF EXISTS "Allow public read access on dlp_corridors" ON public.dlp_corridors;
DROP POLICY IF EXISTS "Allow public insert access on dlp_corridors" ON public.dlp_corridors;
DROP POLICY IF EXISTS "Allow public update access on dlp_corridors" ON public.dlp_corridors;
DROP POLICY IF EXISTS "Allow public delete access on dlp_corridors" ON public.dlp_corridors;
DROP POLICY IF EXISTS "Allow public read access on dlp_work_stretches" ON public.dlp_work_stretches;
DROP POLICY IF EXISTS "Allow public insert access on dlp_work_stretches" ON public.dlp_work_stretches;
DROP POLICY IF EXISTS "Allow public update access on dlp_work_stretches" ON public.dlp_work_stretches;
DROP POLICY IF EXISTS "Allow public delete access on dlp_work_stretches" ON public.dlp_work_stretches;
DROP POLICY IF EXISTS "Allow public read access on dlp_master_config" ON public.dlp_master_config;
DROP POLICY IF EXISTS "Allow public insert access on dlp_master_config" ON public.dlp_master_config;
DROP POLICY IF EXISTS "Allow public update access on dlp_master_config" ON public.dlp_master_config;
DROP POLICY IF EXISTS "Allow public delete access on dlp_master_config" ON public.dlp_master_config;

-- Legal Litigation
DROP POLICY IF EXISTS "Allow public read legal_cases" ON public.legal_cases;
DROP POLICY IF EXISTS "Allow public write legal_cases" ON public.legal_cases;
DROP POLICY IF EXISTS "Allow public read lawyers" ON public.lawyers;
DROP POLICY IF EXISTS "Allow public write lawyers" ON public.lawyers;
DROP POLICY IF EXISTS "Allow public read legal_master_config" ON public.legal_master_config;
DROP POLICY IF EXISTS "Allow public write legal_master_config" ON public.legal_master_config;

-- Staff Directory
DROP POLICY IF EXISTS "Public full access to staff_members" ON public.staff_members;
DROP POLICY IF EXISTS "Public full access to staff_master_config" ON public.staff_master_config;

-- Excel Ingestion & Datasets
DROP POLICY IF EXISTS "Enable select for all users" ON public.dataset_uploads;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.dataset_uploads;
DROP POLICY IF EXISTS "Enable update for all users" ON public.dataset_uploads;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.dataset_uploads;

-- Clean up any existing service-role policies to allow idempotent execution
DROP POLICY IF EXISTS "Service role full access fee_bills" ON public.fee_bills;
DROP POLICY IF EXISTS "Service role full access fee_bill_master_items" ON public.fee_bill_master_items;
DROP POLICY IF EXISTS "Service role full access highways" ON public.highways;
DROP POLICY IF EXISTS "Service role full access highway_sub_chainages" ON public.highway_sub_chainages;
DROP POLICY IF EXISTS "Service role full access highway_master_config" ON public.highway_master_config;
DROP POLICY IF EXISTS "Service role full access major_projects_50cr" ON public.major_projects_50cr;
DROP POLICY IF EXISTS "Service role full access ongoing_works_master_config" ON public.ongoing_works_master_config;
DROP POLICY IF EXISTS "Service role full access major_projects_snapshots" ON public.major_projects_snapshots;
DROP POLICY IF EXISTS "Service role full access dlp_corridors" ON public.dlp_corridors;
DROP POLICY IF EXISTS "Service role full access dlp_work_stretches" ON public.dlp_work_stretches;
DROP POLICY IF EXISTS "Service role full access dlp_master_config" ON public.dlp_master_config;
DROP POLICY IF EXISTS "Service role full access legal_cases" ON public.legal_cases;
DROP POLICY IF EXISTS "Service role full access lawyers" ON public.lawyers;
DROP POLICY IF EXISTS "Service role full access legal_master_config" ON public.legal_master_config;
DROP POLICY IF EXISTS "Service role full access staff_members" ON public.staff_members;
DROP POLICY IF EXISTS "Service role full access staff_master_config" ON public.staff_master_config;
DROP POLICY IF EXISTS "Service role full access dataset_uploads" ON public.dataset_uploads;

-- 3. Enable Row Level Security (RLS) across all 17 live domain & master config tables
ALTER TABLE public.fee_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_bill_master_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.highways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highway_sub_chainages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highway_master_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.major_projects_50cr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ongoing_works_master_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_projects_snapshots ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dlp_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlp_work_stretches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlp_master_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_master_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_master_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dataset_uploads ENABLE ROW LEVEL SECURITY;

-- 4. Revoke all direct permissions from public and anon roles
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, public;

-- 5. Establish exclusive Service Role execution policies
-- PostgREST anon requests are rejected; Next.js route handlers with Service Role key execute fully

CREATE POLICY "Service role full access fee_bills" ON public.fee_bills FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access fee_bill_master_items" ON public.fee_bill_master_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access highways" ON public.highways FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access highway_sub_chainages" ON public.highway_sub_chainages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access highway_master_config" ON public.highway_master_config FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access major_projects_50cr" ON public.major_projects_50cr FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ongoing_works_master_config" ON public.ongoing_works_master_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access major_projects_snapshots" ON public.major_projects_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access dlp_corridors" ON public.dlp_corridors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access dlp_work_stretches" ON public.dlp_work_stretches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access dlp_master_config" ON public.dlp_master_config FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access legal_cases" ON public.legal_cases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access lawyers" ON public.lawyers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access legal_master_config" ON public.legal_master_config FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access staff_members" ON public.staff_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access staff_master_config" ON public.staff_master_config FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access dataset_uploads" ON public.dataset_uploads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Grant operational privileges to service_role and postgres roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role, postgres;
