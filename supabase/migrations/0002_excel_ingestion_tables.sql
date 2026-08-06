-- Migration 0002: Excel Ingestion Tables (Highways, DLP Contracts, Milestones)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/painfnxuqzwtmowddogt/sql

-- 1. Dataset Upload Log Table
CREATE TABLE IF NOT EXISTS public.dataset_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_rows INTEGER DEFAULT 0,
    inserted_rows INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Highway Master Table
CREATE TABLE IF NOT EXISTS public.highways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    road_code VARCHAR(100) UNIQUE NOT NULL,
    road_name VARCHAR(255) NOT NULL,
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    from_chainage VARCHAR(50),
    to_chainage VARCHAR(50),
    length_km DECIMAL(10, 3) NOT NULL CHECK (length_km >= 0),
    configuration VARCHAR(100) DEFAULT '2-Lane',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    start_latitude DECIMAL(10, 7),
    start_longitude DECIMAL(10, 7),
    end_latitude DECIMAL(10, 7),
    end_longitude DECIMAL(10, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DLP Contracts Table
CREATE TABLE IF NOT EXISTS public.dlp_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highway_code VARCHAR(100) NOT NULL,
    stretch_name TEXT NOT NULL,
    from_km DECIMAL(10, 3) DEFAULT 0,
    to_km DECIMAL(10, 3) DEFAULT 0,
    length_km DECIMAL(10, 3) DEFAULT 0,
    contractor_name VARCHAR(255) NOT NULL,
    contract_mode VARCHAR(50) DEFAULT 'EPC',
    work_description TEXT,
    doc_date DATE,
    dlp_expiry_date DATE,
    days_remaining INTEGER,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Highway Chainages & Milestones Table
CREATE TABLE IF NOT EXISTS public.highway_chainages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    highway_code VARCHAR(100) NOT NULL,
    chainage_km DECIMAL(10, 3) NOT NULL,
    town_name VARCHAR(255),
    traffic_pcu INTEGER,
    row_width VARCHAR(100),
    carriageway_spec VARCHAR(200),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Security Policies
ALTER TABLE public.dataset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlp_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highway_chainages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable select for all users" ON public.dataset_uploads FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.highways FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.dlp_contracts FOR SELECT USING (true);
CREATE POLICY "Enable select for all users" ON public.highway_chainages FOR SELECT USING (true);

-- Allow Insert/Update for all (temporary development mode)
CREATE POLICY "Enable insert for all users" ON public.highways FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.dlp_contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.highway_chainages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.dataset_uploads FOR INSERT WITH CHECK (true);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_highways_code ON public.highways(road_code);
CREATE INDEX IF NOT EXISTS idx_dlp_code ON public.dlp_contracts(highway_code);
CREATE INDEX IF NOT EXISTS idx_chainages_code ON public.highway_chainages(highway_code, chainage_km);
