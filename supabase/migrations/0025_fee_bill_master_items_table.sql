-- Migration 0025: Create normalized fee_bill_master_items table for individual row-level master data storage
-- Eliminates single-blob JSON risks and supports granular item-level CRUD operations

CREATE TABLE IF NOT EXISTS public.fee_bill_master_items (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category VARCHAR(50) NOT NULL, -- 'circles', 'divisions', 'lawyerDesignations', 'assistantDesignations', 'caseTypes', 'casePertainsTo', 'paymentStatuses', 'statusOfObtainingGo', 'statusOfPaymentProposal', 'goStatusOptions', 'yesNoOptions'
    name TEXT NOT NULL,
    parent_value TEXT,            -- circle name for divisions
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_bill_master_items_category ON public.fee_bill_master_items(category, active);
CREATE INDEX IF NOT EXISTS idx_fee_bill_master_items_parent ON public.fee_bill_master_items(category, parent_value);

-- Disable Row Level Security (RLS) and grant permissions matching project conventions
ALTER TABLE public.fee_bill_master_items DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.fee_bill_master_items TO postgres, anon, authenticated, service_role;
