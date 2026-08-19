-- Migration 0017: Create ongoing_works_master_config table for Master Data Management
-- Supports dynamic Division and Scheme dropdown management

CREATE TABLE IF NOT EXISTS public.ongoing_works_master_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'division' or 'scheme'
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_ongoing_master_category ON public.ongoing_works_master_config(category);

-- Disable Row Level Security (RLS) and grant permissions
ALTER TABLE public.ongoing_works_master_config DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ongoing_works_master_config TO postgres, anon, authenticated, service_role;
