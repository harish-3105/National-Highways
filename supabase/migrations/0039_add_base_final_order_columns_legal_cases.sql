-- Migration 0039: Add base_final_order and base_final_order_date to public.legal_cases

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_final_order') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_final_order TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_cases' AND column_name = 'base_final_order_date') THEN
    ALTER TABLE public.legal_cases ADD COLUMN base_final_order_date DATE NULL;
  END IF;
END $$;
