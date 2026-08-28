-- Migration 0027: Add G.O. proposal reference letter number and date to fee_bills table and set payment_status default to Pending

ALTER TABLE public.fee_bills
    ADD COLUMN IF NOT EXISTS go_reference_letter_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS go_reference_letter_date DATE;

-- Update default value for payment_status to 'Pending' and migrate legacy 'Not Settled' values
ALTER TABLE public.fee_bills
    ALTER COLUMN payment_status SET DEFAULT 'Pending';

UPDATE public.fee_bills
    SET payment_status = 'Pending'
    WHERE payment_status = 'Not Settled' OR payment_status IS NULL;

-- Index for searching G.O. reference letter number
CREATE INDEX IF NOT EXISTS idx_fee_bills_go_ref_letter ON public.fee_bills(go_reference_letter_no);
