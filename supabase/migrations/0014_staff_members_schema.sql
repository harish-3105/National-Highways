-- Migration 0014: Staff Management Schema & Dynamic Master Config
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office TEXT,
    circle TEXT,
    division TEXT,
    sub_division TEXT,
    section TEXT,
    sub_section TEXT,
    designation TEXT,
    name TEXT NOT NULL,
    contact_no TEXT,
    emailid TEXT,
    delete_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_staff_members_delete_status ON public.staff_members(delete_status);
CREATE INDEX IF NOT EXISTS idx_staff_members_circle ON public.staff_members(circle);
CREATE INDEX IF NOT EXISTS idx_staff_members_division ON public.staff_members(division);

-- Dynamic Master Data Config table for Staff dropdowns
CREATE TABLE IF NOT EXISTS public.staff_master_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'office', 'circle', 'division', 'sub_division', 'section', 'sub_section', 'designation'
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT staff_master_config_category_value_key UNIQUE (category, value)
);

-- Enable RLS and add public permissive policies
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_master_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to staff_members" ON public.staff_members;
CREATE POLICY "Public full access to staff_members" ON public.staff_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to staff_master_config" ON public.staff_master_config;
CREATE POLICY "Public full access to staff_master_config" ON public.staff_master_config FOR ALL USING (true) WITH CHECK (true);
