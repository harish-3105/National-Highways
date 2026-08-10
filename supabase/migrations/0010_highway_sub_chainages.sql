-- Migration 0010: Create highway_sub_chainages table for Level 2 PCU & DPR tracking
-- Supports ground-truth parity with Level 2 Excel: Lane wise PCU Details.xlsx (Sheet: NH)

CREATE TABLE IF NOT EXISTS public.highway_sub_chainages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highway_code VARCHAR(100) NOT NULL,
    division_name VARCHAR(100),
    stretch_name TEXT,
    from_km DECIMAL(10, 3) NOT NULL CHECK (from_km >= 0),
    to_km DECIMAL(10, 3) NOT NULL CHECK (to_km >= from_km),
    length_km DECIMAL(10, 3) NOT NULL CHECK (length_km >= 0),
    lane_configuration VARCHAR(100) DEFAULT '2-Lane',
    pcu_count INTEGER DEFAULT 0,
    dpr_status TEXT,
    delete_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure delete_status column exists with DEFAULT 'ACTIVE'
ALTER TABLE public.highway_sub_chainages ADD COLUMN IF NOT EXISTS delete_status VARCHAR(50) DEFAULT 'ACTIVE';
UPDATE public.highway_sub_chainages SET delete_status = 'ACTIVE' WHERE delete_status IS NULL OR delete_status = 'KEEP';

-- Index for fast lookup by highway code and chainage order
CREATE INDEX IF NOT EXISTS idx_sub_chainages_code ON public.highway_sub_chainages(highway_code, from_km);

-- Disable Row Level Security (RLS) to allow API route ingestion and CRUD operations
ALTER TABLE public.highway_sub_chainages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.highway_sub_chainages TO postgres, anon, authenticated, service_role;
