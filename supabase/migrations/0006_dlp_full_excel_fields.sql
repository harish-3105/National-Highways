-- Migration 0006: Add Complete Excel Breakdown Columns to dlp_contracts Table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/painfnxuqzwtmowddogt/sql

ALTER TABLE public.dlp_contracts
ADD COLUMN IF NOT EXISTS division_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS dlp_contract_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dlp_length_km DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS construction_project_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS construction_length_km DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stmc_contract_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stmc_length_km DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stmc_expiry_date DATE,
ADD COLUMN IF NOT EXISTS pbmc_project_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pbmc_length_km DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_dlp_length_km DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS uncontracted_after_2027_km DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS contract_details JSONB DEFAULT '{}'::jsonb;
