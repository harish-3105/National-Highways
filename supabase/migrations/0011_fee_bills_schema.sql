-- Migration 0011: Create fee_bills table for Legal & Lawyer Fee Bill Portal

CREATE TABLE IF NOT EXISTS public.fee_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_bill_number VARCHAR(100) NOT NULL UNIQUE,
    fee_bill_date DATE NOT NULL,
    circle VARCHAR(100) NOT NULL,
    division VARCHAR(100) NOT NULL,
    lawyer_name VARCHAR(255) NOT NULL,
    lawyer_designation VARCHAR(100) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    case_year VARCHAR(10) NOT NULL,
    case_pertains_to VARCHAR(50) DEFAULT 'GOTN',
    appearance_amount DECIMAL(12, 2) DEFAULT 0,
    appearance_date DATE,
    conference_amount DECIMAL(12, 2) DEFAULT 0,
    conference_date DATE,
    verifying_amount DECIMAL(12, 2) DEFAULT 0,
    verifying_date DATE,
    assistance_amount DECIMAL(12, 2) DEFAULT 0,
    assistance_date DATE,
    total_fee_amount DECIMAL(12, 2) DEFAULT 0,
    assistant_name VARCHAR(255),
    assistant_designation VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'Not Settled',
    settled_amount DECIMAL(12, 2) DEFAULT 0,
    it_cess DECIMAL(12, 2) DEFAULT 0,
    utr_rbi_reference VARCHAR(100),
    payment_date DATE,
    go_status VARCHAR(50) DEFAULT 'Yes',
    go_number VARCHAR(100),
    go_date DATE,
    payment_sanction VARCHAR(10) DEFAULT 'No',
    proposal_submitted VARCHAR(10) DEFAULT 'No',
    proposal_movement JSONB DEFAULT '{"deToCe":false,"seToCe":false,"seToRorMorth":false}'::jsonb,
    direct_movement JSONB DEFAULT '{"deToCe":false,"seToCe":false}'::jsonb,
    letter_number VARCHAR(100),
    letter_date DATE,
    current_pendency VARCHAR(100) DEFAULT 'Pending with DE',
    delete_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_by VARCHAR(100) DEFAULT 'System Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by circle, division, lawyer, and payment status
CREATE INDEX IF NOT EXISTS idx_fee_bills_circle_division ON public.fee_bills(circle, division, payment_status);

-- Disable Row Level Security (RLS) to allow API route ingestion and CRUD operations
ALTER TABLE public.fee_bills DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.fee_bills TO postgres, anon, authenticated, service_role;
