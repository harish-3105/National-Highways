-- Migration 0018: Add Level 2 (27-Column Deep Technical & Financial Data) to major_projects_50cr table
-- Supports full MoRTH / TN National Highways 27-Column Present Status MIS Review

-- 1. Project Identification & Technical Specifications
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS pmis_id TEXT,
    ADD COLUMN IF NOT EXISTS old_new_nh TEXT,
    ADD COLUMN IF NOT EXISTS length_km NUMERIC(10, 3),
    ADD COLUMN IF NOT EXISTS job_no TEXT,
    ADD COLUMN IF NOT EXISTS sanction_date TEXT,
    ADD COLUMN IF NOT EXISTS appointed_date TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_completion_date TEXT;

-- 2. Physical Progress Breakdown (Kilometers & Percentage)
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS completed_length_prior_km NUMERIC(10, 3) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completed_length_current_fy_km NUMERIC(10, 3) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_completed_length_km NUMERIC(10, 3) DEFAULT 0;

-- 3. Financial Progress, Cost Escalation & RCE (Rs. in Crores)
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS revised_cost_cr NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS cost_increase_rce_cr NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS expenditure_prior_cr NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS expenditure_current_fy_cr NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cumm_financial_expenditure_cr NUMERIC(12, 2) DEFAULT 0;

-- 4. Timelines, Delays, EOT & Change of Scope (COS)
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS likely_completion_date TEXT,
    ADD COLUMN IF NOT EXISTS time_overrun_years NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS eot_granted_till TEXT,
    ADD COLUMN IF NOT EXISTS eot_proposal_agency TEXT,
    ADD COLUMN IF NOT EXISTS cos_details TEXT;

-- 5. Field Personnel & Contracting Agency
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS de_name_phone TEXT,
    ADD COLUMN IF NOT EXISTS contractor_name TEXT,
    ADD COLUMN IF NOT EXISTS updated_division_date TEXT;

-- 6. Granular Structural Stage & Land Acquisition Status
ALTER TABLE public.major_projects_50cr
    ADD COLUMN IF NOT EXISTS detailed_stage_status TEXT;

-- Indexes for fast querying & search
CREATE INDEX IF NOT EXISTS idx_major_projects_pmis ON public.major_projects_50cr(pmis_id);
CREATE INDEX IF NOT EXISTS idx_major_projects_job_no ON public.major_projects_50cr(job_no);
CREATE INDEX IF NOT EXISTS idx_major_projects_time_overrun ON public.major_projects_50cr(time_overrun_years);
