-- Migration 0012: Create fee_bill_master_config table for central database storage of Circles & Divisions

CREATE TABLE IF NOT EXISTS public.fee_bill_master_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for public API access
ALTER TABLE public.fee_bill_master_config DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.fee_bill_master_config TO postgres, anon, authenticated, service_role;
