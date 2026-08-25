-- Migration 0028: Add native columns for Base / Original Case details in public.legal_cases

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_circle') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_circle VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_division') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_division VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_court_name') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_court_name VARCHAR(255) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_case_type') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_case_type VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_case_number') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_case_number VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_case_year') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_case_year VARCHAR(10) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_petitioner_names') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_petitioner_names TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_respondent_names') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_respondent_names TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_case_pertains_to') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_case_pertains_to VARCHAR(50) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_nature_of_case') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_nature_of_case VARCHAR(100) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_brief_of_prayer') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_brief_of_prayer TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'linked_base_case_id') THEN
    ALTER TABLE public.legal_cases ADD COLUMN linked_base_case_id UUID NULL;
  END IF;
END $$;
