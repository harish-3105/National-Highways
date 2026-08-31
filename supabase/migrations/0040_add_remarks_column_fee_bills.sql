-- Migration 0040: Add remarks column to fee_bills table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_bills' AND column_name = 'remarks'
  ) THEN
    ALTER TABLE public.fee_bills ADD COLUMN remarks TEXT NULL;
  END IF;
END $$;
