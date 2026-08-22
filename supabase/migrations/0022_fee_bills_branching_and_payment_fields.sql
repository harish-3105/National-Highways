-- Migration 0022: Add Assistant Law Officer, G.O. Branching, Payment Proposal, and Settlement Fields to fee_bills table

ALTER TABLE public.fee_bills
    ADD COLUMN IF NOT EXISTS assistant_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assistant_designation VARCHAR(100),
    ADD COLUMN IF NOT EXISTS status_of_obtaining_go VARCHAR(100),
    ADD COLUMN IF NOT EXISTS status_of_payment_proposal VARCHAR(100),
    ADD COLUMN IF NOT EXISTS proceeding_letter_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS proceeding_letter_date DATE,
    ADD COLUMN IF NOT EXISTS sanctioned_amount DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_sanctioned VARCHAR(10) DEFAULT 'No',
    ADD COLUMN IF NOT EXISTS amount_deposited DECIMAL(12, 2) DEFAULT 0;

-- Index for searching cases and payment proposal statuses
CREATE INDEX IF NOT EXISTS idx_fee_bills_case_number ON public.fee_bills(case_number);
CREATE INDEX IF NOT EXISTS idx_fee_bills_payment_proposal ON public.fee_bills(status_of_payment_proposal);
CREATE INDEX IF NOT EXISTS idx_fee_bills_assistant_name ON public.fee_bills(assistant_name);
