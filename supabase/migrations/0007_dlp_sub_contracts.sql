-- Migration 0007: Create dlp_sub_contracts Table for 2-Tier Relational Sub-Contracts
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/painfnxuqzwtmowddogt/sql

CREATE TABLE IF NOT EXISTS public.dlp_sub_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_contract_id UUID REFERENCES public.dlp_contracts(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL DEFAULT 'DLP',
    sub_stretch_title TEXT,
    from_km DECIMAL(10, 3) DEFAULT 0,
    to_km DECIMAL(10, 3) DEFAULT 0,
    length_km DECIMAL(10, 3) DEFAULT 0,
    contractor_name VARCHAR(255),
    expiry_date DATE,
    days_remaining INTEGER,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast parent stretch joins
CREATE INDEX IF NOT EXISTS idx_dlp_sub_contracts_parent ON public.dlp_sub_contracts(parent_contract_id);
