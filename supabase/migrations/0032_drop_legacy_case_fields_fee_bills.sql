-- Migration 0032: Drop legacy case_type, case_number, and case_year columns from fee_bills
-- case_details now serves as the single source of truth for case particulars.

-- 1. Ensure any remaining rows have case_details populated before dropping
UPDATE public.fee_bills
SET case_details = TRIM(CONCAT_WS(' ', NULLIF(case_type, ''), NULLIF(case_number::text, ''), NULLIF(case_year::text, '')))
WHERE (case_details IS NULL OR case_details = '') AND (case_number IS NOT NULL OR case_type IS NOT NULL);

-- 2. Drop any legacy indexes on case_number if existing
DROP INDEX IF EXISTS idx_fee_bills_case_number;

-- 3. Drop legacy columns
ALTER TABLE public.fee_bills
    DROP COLUMN IF EXISTS case_type,
    DROP COLUMN IF EXISTS case_number,
    DROP COLUMN IF EXISTS case_year;
