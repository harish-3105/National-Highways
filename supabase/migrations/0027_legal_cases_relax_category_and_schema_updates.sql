-- Migration 0027: Update legal_cases table to relax category NOT NULL constraint
-- and ensure all native legal fields exist as dedicated columns

DO $$
BEGIN
  -- 1. Drop NOT NULL from category column if it is currently NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'legal_cases' 
      AND column_name = 'category' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.legal_cases ALTER COLUMN category DROP NOT NULL;
  END IF;

  -- 2. Set default to NULL for category
  ALTER TABLE public.legal_cases ALTER COLUMN category SET DEFAULT NULL;

  -- 3. Ensure native structured fields exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'specify_nature_of_case') THEN
    ALTER TABLE public.legal_cases ADD COLUMN specify_nature_of_case TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'financial_implication') THEN
    ALTER TABLE public.legal_cases ADD COLUMN financial_implication VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'compliance_period') THEN
    ALTER TABLE public.legal_cases ADD COLUMN compliance_period VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'final_result_order') THEN
    ALTER TABLE public.legal_cases ADD COLUMN final_result_order TEXT NULL;
  END IF;
END $$;
