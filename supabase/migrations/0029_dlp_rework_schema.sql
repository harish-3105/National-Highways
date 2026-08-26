-- Migration 0029: DLP Module Complete Schema Rework
-- Creates dedicated relational tables for DLP Corridors and 2D Granular Work Stretches

-- 1. Create dlp_corridors table (Parent Entity)
CREATE TABLE IF NOT EXISTS public.dlp_corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_name TEXT NOT NULL,
    highway_code TEXT NOT NULL,
    from_km NUMERIC(8,3) NOT NULL,
    to_km NUMERIC(8,3) NOT NULL,
    total_length_km NUMERIC(8,3) NOT NULL,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create dlp_work_stretches table (Granular 2D Work Entity)
CREATE TABLE IF NOT EXISTS public.dlp_work_stretches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES public.dlp_corridors(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('DLP', 'CONSTRUCTION', 'STMC', 'PBMC', 'NO_DLP')),
    chainage_from_km NUMERIC(8,3) NOT NULL,
    chainage_to_km NUMERIC(8,3) NOT NULL,
    length_km NUMERIC(8,3) NOT NULL,
    road_width_from_m NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    road_width_to_m NUMERIC(5,2) NOT NULL DEFAULT 3.50,
    contractor_name TEXT,
    work_name TEXT,
    commencement_date DATE,
    dlp_till_date DATE,
    physical_progress_pct NUMERIC(5,2),
    actual_completion_date DATE,
    dlp_period_years INTEGER,
    scheme TEXT,
    dlp_ended_on_date DATE,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dlp_corridors_division ON public.dlp_corridors(division_name);
CREATE INDEX IF NOT EXISTS idx_dlp_corridors_highway ON public.dlp_corridors(highway_code);
CREATE INDEX IF NOT EXISTS idx_dlp_corridors_status ON public.dlp_corridors(status);

CREATE INDEX IF NOT EXISTS idx_dlp_work_stretches_corridor ON public.dlp_work_stretches(corridor_id);
CREATE INDEX IF NOT EXISTS idx_dlp_work_stretches_category ON public.dlp_work_stretches(category);
CREATE INDEX IF NOT EXISTS idx_dlp_work_stretches_dlp_till ON public.dlp_work_stretches(dlp_till_date);
CREATE INDEX IF NOT EXISTS idx_dlp_work_stretches_status ON public.dlp_work_stretches(status);

-- 4. Enable Row Level Security
ALTER TABLE public.dlp_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlp_work_stretches ENABLE ROW LEVEL SECURITY;

-- 5. Universal Access Policies (Matching Project Standard)
DROP POLICY IF EXISTS "Allow public read access on dlp_corridors" ON public.dlp_corridors;
CREATE POLICY "Allow public read access on dlp_corridors"
    ON public.dlp_corridors FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on dlp_corridors" ON public.dlp_corridors;
CREATE POLICY "Allow public insert access on dlp_corridors"
    ON public.dlp_corridors FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on dlp_corridors" ON public.dlp_corridors;
CREATE POLICY "Allow public update access on dlp_corridors"
    ON public.dlp_corridors FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on dlp_corridors" ON public.dlp_corridors;
CREATE POLICY "Allow public delete access on dlp_corridors"
    ON public.dlp_corridors FOR DELETE
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on dlp_work_stretches" ON public.dlp_work_stretches;
CREATE POLICY "Allow public read access on dlp_work_stretches"
    ON public.dlp_work_stretches FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on dlp_work_stretches" ON public.dlp_work_stretches;
CREATE POLICY "Allow public insert access on dlp_work_stretches"
    ON public.dlp_work_stretches FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on dlp_work_stretches" ON public.dlp_work_stretches;
CREATE POLICY "Allow public update access on dlp_work_stretches"
    ON public.dlp_work_stretches FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on dlp_work_stretches" ON public.dlp_work_stretches;
CREATE POLICY "Allow public delete access on dlp_work_stretches"
    ON public.dlp_work_stretches FOR DELETE
    USING (true);
