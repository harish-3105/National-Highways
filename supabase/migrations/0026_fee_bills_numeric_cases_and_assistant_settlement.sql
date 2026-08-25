-- Migration 0026: Convert case_number and case_year to numeric types, add receipt_date and assistant settlement fields

-- 1. Alter case_number to NUMERIC and case_year to INTEGER
ALTER TABLE public.fee_bills
    ALTER COLUMN case_number TYPE NUMERIC USING (NULLIF(regexp_replace(case_number::text, '[^0-9]', '', 'g'), '')::NUMERIC),
    ALTER COLUMN case_year TYPE INTEGER USING (NULLIF(regexp_replace(case_year::text, '[^0-9]', '', 'g'), '')::INTEGER);

-- 2. Add receipt_date in concerned office
ALTER TABLE public.fee_bills
    ADD COLUMN IF NOT EXISTS receipt_date DATE,
    ADD COLUMN IF NOT EXISTS date_of_receipt_in_office DATE;

-- 3. Add Assistant Settlement and Banking Disbursement Fields
ALTER TABLE public.fee_bills
    ADD COLUMN IF NOT EXISTS assistant_settled_amount DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS assistant_it_cess DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS assistant_amount_deposited DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS assistant_utr_rbi_reference VARCHAR(100),
    ADD COLUMN IF NOT EXISTS assistant_payment_date DATE,
    ADD COLUMN IF NOT EXISTS assistant_payment_status VARCHAR(50) DEFAULT 'Not Settled';

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_fee_bills_receipt_date ON public.fee_bills(receipt_date);
CREATE INDEX IF NOT EXISTS idx_fee_bills_assistant_payment ON public.fee_bills(assistant_payment_status);
