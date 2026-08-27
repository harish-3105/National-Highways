-- Migration 0030: DLP Master Data Configuration Schema
-- Creates public.dlp_master_config for dynamic Circle, Division (with Parent Circle), and Scheme master data

CREATE TABLE IF NOT EXISTS public.dlp_master_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,         -- 'circle', 'division', 'scheme'
    value TEXT NOT NULL,            -- e.g. 'Salem', 'NH(O)'
    parent_category TEXT,           -- 'circle' (when category is 'division')
    parent_value TEXT,              -- e.g. 'Salem' (parent circle of division)
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance and Hierarchy Indexes
CREATE INDEX IF NOT EXISTS idx_dlp_master_config_category ON public.dlp_master_config(category);
CREATE INDEX IF NOT EXISTS idx_dlp_master_config_parent ON public.dlp_master_config(parent_category, parent_value);
CREATE INDEX IF NOT EXISTS idx_dlp_master_config_status ON public.dlp_master_config(status);

-- Prevent duplicate active values within the same category and parent scope
CREATE UNIQUE INDEX IF NOT EXISTS idx_dlp_master_config_unique 
    ON public.dlp_master_config (category, lower(value), COALESCE(lower(parent_value), ''))
    WHERE status != 'DELETED';

-- Enable Row Level Security
ALTER TABLE public.dlp_master_config ENABLE ROW LEVEL SECURITY;

-- Universal Access Policies matching project conventions
DROP POLICY IF EXISTS "Allow public read access on dlp_master_config" ON public.dlp_master_config;
CREATE POLICY "Allow public read access on dlp_master_config"
    ON public.dlp_master_config FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on dlp_master_config" ON public.dlp_master_config;
CREATE POLICY "Allow public insert access on dlp_master_config"
    ON public.dlp_master_config FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on dlp_master_config" ON public.dlp_master_config;
CREATE POLICY "Allow public update access on dlp_master_config"
    ON public.dlp_master_config FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on dlp_master_config" ON public.dlp_master_config;
CREATE POLICY "Allow public delete access on dlp_master_config"
    ON public.dlp_master_config FOR DELETE
    USING (true);

GRANT ALL ON public.dlp_master_config TO postgres, anon, authenticated, service_role;
