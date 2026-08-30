-- Migration 0036: Normalize appeal_info JSONB into dedicated 1:1 relational columns in public.legal_cases

-- 1. Add dedicated native columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'appellate_court') THEN
    ALTER TABLE public.legal_cases ADD COLUMN appellate_court VARCHAR(255) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'appeal_filing_date') THEN
    ALTER TABLE public.legal_cases ADD COLUMN appeal_filing_date DATE NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'limitation_due_date') THEN
    ALTER TABLE public.legal_cases ADD COLUMN limitation_due_date DATE NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'delay_in_filing_appeal') THEN
    ALTER TABLE public.legal_cases ADD COLUMN delay_in_filing_appeal VARCHAR(10) NULL DEFAULT 'No';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'delay_period_days') THEN
    ALTER TABLE public.legal_cases ADD COLUMN delay_period_days INTEGER NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'condonation_of_delay') THEN
    ALTER TABLE public.legal_cases ADD COLUMN condonation_of_delay VARCHAR(100) NULL;
  END IF;
END $$;

-- 2. Backfill existing data from appeal_info JSONB
UPDATE public.legal_cases
SET
  appellate_court = COALESCE(appellate_court, NULLIF(appeal_info->>'appellateCourt', '')),
  appeal_case_details = COALESCE(appeal_case_details, NULLIF(appeal_info->>'appealCaseDetails', '')),
  appeal_filing_date = COALESCE(appeal_filing_date, CASE WHEN (appeal_info->>'appealFilingDate') ~ '^\d{4}-\d{2}-\d{2}$' THEN (appeal_info->>'appealFilingDate')::DATE ELSE NULL END),
  limitation_due_date = COALESCE(limitation_due_date, CASE WHEN (appeal_info->>'limitationDueDate') ~ '^\d{4}-\d{2}-\d{2}$' THEN (appeal_info->>'limitationDueDate')::DATE ELSE NULL END),
  delay_in_filing_appeal = COALESCE(delay_in_filing_appeal, NULLIF(appeal_info->>'delayInFilingAppeal', ''), 'No'),
  delay_period_days = COALESCE(delay_period_days, CASE WHEN (appeal_info->>'delayPeriodDays') ~ '^\d+$' THEN (appeal_info->>'delayPeriodDays')::INTEGER ELSE 0 END, 0),
  condonation_of_delay = COALESCE(condonation_of_delay, NULLIF(appeal_info->>'condonationOfDelay', ''))
WHERE appeal_info IS NOT NULL;

-- 3. Drop legacy appeal_info column
ALTER TABLE public.legal_cases DROP COLUMN IF EXISTS appeal_info;
