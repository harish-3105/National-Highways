-- Migration 0013: Consolidate Database Schemas, Add Missing Columns, Idempotent Fixes & Indexing

-- 1. Ensure public.highways table contains all Level 1 and Level 2 fields
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS from_chainage VARCHAR(50) DEFAULT '0.000';
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS to_chainage VARCHAR(50) DEFAULT '0.000';
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS configuration VARCHAR(100) DEFAULT '2-Lane';
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS delete_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS old_nh_no VARCHAR(50);
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS new_nh_no VARCHAR(50);
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS length_less_than_2l DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS length_2l DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS length_2l_ps DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS length_4l DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.highways ADD COLUMN IF NOT EXISTS length_6l DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.highways ALTER COLUMN district DROP NOT NULL;
ALTER TABLE public.highways ALTER COLUMN division_name DROP NOT NULL;
ALTER TABLE public.highways ALTER COLUMN from_location DROP NOT NULL;
ALTER TABLE public.highways ALTER COLUMN to_location DROP NOT NULL;

-- 2. Ensure public.legal_cases table contains all expanded court & counter-affidavit fields
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS circle VARCHAR(100);
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS division VARCHAR(100);
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS case_year VARCHAR(10);
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS name_of_court VARCHAR(255);
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS name_of_respondent VARCHAR(255);
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS case_pertains_to VARCHAR(50) DEFAULT 'GOTN';
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS nature_of_case VARCHAR(100);
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_nature_of_case TEXT;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS brief_of_prayer TEXT;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS case_details_present_status TEXT;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS counter_affidavit_filed VARCHAR(10) DEFAULT 'No';
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS counter_affidavit_details TEXT;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS post_hearing_details TEXT;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS action_to_take_counter_affidavit TEXT;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS converted_case JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS delete_status VARCHAR(50) DEFAULT 'ACTIVE';

-- 3. Ensure public.dlp_contracts contains root level breakdown columns alongside JSONB
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS division_name VARCHAR(100);
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS dlp_contract_count INT DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS dlp_length_km DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS construction_project_count INT DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS construction_length_km DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS stmc_contract_count INT DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS stmc_length_km DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS stmc_expiry_date DATE;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS pbmc_project_count INT DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS pbmc_length_km DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS no_dlp_length_km DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.dlp_contracts ADD COLUMN IF NOT EXISTS uncontracted_after_2027_km DECIMAL(10,3) DEFAULT 0;

-- 4. High-Performance Partial Indices
CREATE INDEX IF NOT EXISTS idx_highways_active ON public.highways(road_code) WHERE delete_status != 'DELETED';
CREATE INDEX IF NOT EXISTS idx_legal_cases_active ON public.legal_cases(circle, division) WHERE delete_status != 'DELETED';
CREATE INDEX IF NOT EXISTS idx_dlp_active ON public.dlp_contracts(circle_name, division_name) WHERE status != 'DELETED';

-- 5. RLS Grants Configuration
ALTER TABLE public.highways DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlp_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlp_sub_contracts DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.highways TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.legal_cases TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.dlp_contracts TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.dlp_sub_contracts TO postgres, anon, authenticated, service_role;
