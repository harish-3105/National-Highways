-- Migration 0020: Add Contract Execution Milestones, Contract Expenditure & Clearance Issue Bottlenecks to major_projects_50cr
-- Supports full 35-Column Present Status MIS Review & Section 4 Clearance Bottlenecks

-- 1. Contract Execution & Site Milestones (Cols 10, 11, 12, 13)
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS loa_date TEXT,
    ADD COLUMN IF NOT EXISTS agreement_date TEXT,
    ADD COLUMN IF NOT EXISTS contract_value_cr NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS site_handover_date TEXT;

-- 2. Contract Cumulative Financial Expenditure (Col 24)
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS contract_cum_expenditure_cr NUMERIC(12, 2) DEFAULT 0;

-- 3. Dedicated Progress Remarks (Section 2)
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS progress_remarks TEXT;

-- 4. Five Critical Clearance Bottlenecks & Issues (Section 4)
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS issue_land TEXT,
    ADD COLUMN IF NOT EXISTS issue_forest TEXT,
    ADD COLUMN IF NOT EXISTS issue_utility TEXT,
    ADD COLUMN IF NOT EXISTS issue_railways TEXT,
    ADD COLUMN IF NOT EXISTS issue_others TEXT;
