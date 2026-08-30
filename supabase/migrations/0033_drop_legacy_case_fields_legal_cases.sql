-- Migration 0033: Drop legacy case_type, case_number, case_year, base_case_type, base_case_number, and base_case_year columns from legal_cases
-- case_details, appeal_case_details, and base_case_details serve as the single sources of truth.

-- 1. Ensure all rows have case_details, base_case_details, and appeal_case_details populated before dropping
UPDATE public.legal_cases
SET case_details = TRIM(CONCAT_WS(' ', NULLIF(case_type, ''), NULLIF(case_number, ''), NULLIF(case_year, '')))
WHERE (case_details IS NULL OR case_details = '') AND (case_number IS NOT NULL OR case_type IS NOT NULL);

UPDATE public.legal_cases
SET base_case_details = TRIM(CONCAT_WS(' ', NULLIF(base_case_type, ''), NULLIF(base_case_number, ''), NULLIF(base_case_year, '')))
WHERE (base_case_details IS NULL OR base_case_details = '') AND (base_case_number IS NOT NULL OR base_case_type IS NOT NULL);

UPDATE public.legal_cases
SET appeal_case_details = TRIM(CONCAT_WS(' ', NULLIF(appeal_info->>'appealCaseType', ''), NULLIF(appeal_info->>'appealCaseNumber', ''), NULLIF(appeal_info->>'appealYear', '')))
WHERE case_classification = 'Appeal Case' AND (appeal_case_details IS NULL OR appeal_case_details = '') AND appeal_info IS NOT NULL;

-- 2. Drop constraints or indexes on legacy case_number if existing
ALTER TABLE public.legal_cases DROP CONSTRAINT IF EXISTS legal_cases_case_number_key;
DROP INDEX IF EXISTS idx_legal_cases_case_number;

-- 3. Drop legacy columns from legal_cases
ALTER TABLE public.legal_cases
    DROP COLUMN IF EXISTS case_type,
    DROP COLUMN IF EXISTS case_number,
    DROP COLUMN IF EXISTS case_year,
    DROP COLUMN IF EXISTS base_case_type,
    DROP COLUMN IF EXISTS base_case_number,
    DROP COLUMN IF EXISTS base_case_year;
