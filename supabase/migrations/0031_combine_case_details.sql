-- Migration 0031: Combine Case Type, Case Number, and Case Year into single Case Details columns

-- 1. fee_bills table: add case_details column
ALTER TABLE public.fee_bills
    ADD COLUMN IF NOT EXISTS case_details TEXT;

-- Populate case_details in fee_bills from existing data
UPDATE public.fee_bills
SET case_details = TRIM(CONCAT_WS(' ', NULLIF(case_type, ''), NULLIF(case_number::text, ''), NULLIF(case_year::text, '')))
WHERE (case_details IS NULL OR case_details = '') AND (case_number IS NOT NULL OR case_type IS NOT NULL);

-- Create index on case_details in fee_bills
CREATE INDEX IF NOT EXISTS idx_fee_bills_case_details ON public.fee_bills (case_details);

-- 2. legal_cases table: add case_details, appeal_case_details, and base_case_details columns
ALTER TABLE public.legal_cases
    ADD COLUMN IF NOT EXISTS case_details TEXT,
    ADD COLUMN IF NOT EXISTS appeal_case_details TEXT,
    ADD COLUMN IF NOT EXISTS base_case_details TEXT;

-- Populate case_details in legal_cases from existing data
UPDATE public.legal_cases
SET case_details = TRIM(CONCAT_WS(' ', NULLIF(case_type, ''), NULLIF(case_number, ''), NULLIF(case_year, '')))
WHERE (case_details IS NULL OR case_details = '') AND (case_number IS NOT NULL OR case_type IS NOT NULL);

-- Populate base_case_details in legal_cases from existing data
UPDATE public.legal_cases
SET base_case_details = TRIM(CONCAT_WS(' ', NULLIF(base_case_type, ''), NULLIF(base_case_number, ''), NULLIF(base_case_year, '')))
WHERE (base_case_details IS NULL OR base_case_details = '') AND (base_case_number IS NOT NULL OR base_case_type IS NOT NULL);

-- Populate appeal_case_details in legal_cases from appeal_info JSONB
UPDATE public.legal_cases
SET appeal_case_details = TRIM(CONCAT_WS(' ', NULLIF(appeal_info->>'appealCaseType', ''), NULLIF(appeal_info->>'appealCaseNumber', ''), NULLIF(appeal_info->>'appealYear', '')))
WHERE case_classification = 'Appeal Case' AND (appeal_case_details IS NULL OR appeal_case_details = '') AND appeal_info IS NOT NULL;

-- Create indexes on legal_cases
CREATE INDEX IF NOT EXISTS idx_legal_cases_case_details ON public.legal_cases (case_details);
CREATE INDEX IF NOT EXISTS idx_legal_cases_appeal_case_details ON public.legal_cases (appeal_case_details);
CREATE INDEX IF NOT EXISTS idx_legal_cases_base_case_details ON public.legal_cases (base_case_details);
