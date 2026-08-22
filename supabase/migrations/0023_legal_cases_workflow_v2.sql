-- Migration 0023: Legal Cases Workflow V2 Expansion
-- Adds structured columns for Appeal tracking, Limitation Delay, CA schedule, Compliance, Final Orders, and GP Opinions

-- 1. Add new columns to public.legal_cases
ALTER TABLE public.legal_cases
  ADD COLUMN IF NOT EXISTS case_classification VARCHAR(50) DEFAULT 'Normal Case',
  ADD COLUMN IF NOT EXISTS appeal_info JSONB,
  ADD COLUMN IF NOT EXISTS case_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS petitioner_names TEXT,
  ADD COLUMN IF NOT EXISTS respondent_names TEXT,
  ADD COLUMN IF NOT EXISTS financial_implication VARCHAR(100),
  ADD COLUMN IF NOT EXISTS present_stage VARCHAR(150),
  ADD COLUMN IF NOT EXISTS current_status VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS ca_required VARCHAR(10) DEFAULT 'Yes',
  ADD COLUMN IF NOT EXISTS ca_filed VARCHAR(10) DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS ca_due_date DATE,
  ADD COLUMN IF NOT EXISTS ca_filed_date DATE,
  ADD COLUMN IF NOT EXISTS last_hearing_date DATE,
  ADD COLUMN IF NOT EXISTS next_hearing_date DATE,
  ADD COLUMN IF NOT EXISTS next_listing_purpose TEXT,
  ADD COLUMN IF NOT EXISTS interim_order_direction TEXT,
  ADD COLUMN IF NOT EXISTS interim_order_date DATE,
  ADD COLUMN IF NOT EXISTS latest_order_final_order TEXT,
  ADD COLUMN IF NOT EXISTS latest_order_date DATE,
  ADD COLUMN IF NOT EXISTS compliance_required VARCHAR(10) DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS compliance_action TEXT,
  ADD COLUMN IF NOT EXISTS compliance_period VARCHAR(100),
  ADD COLUMN IF NOT EXISTS compliance_end_date DATE,
  ADD COLUMN IF NOT EXISTS action_taken_details_for_compliance TEXT,
  ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS remarks TEXT,
  ADD COLUMN IF NOT EXISTS final_result VARCHAR(10) DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS final_result_order TEXT,
  ADD COLUMN IF NOT EXISTS final_order_date DATE,
  ADD COLUMN IF NOT EXISTS adverse_to_department VARCHAR(10) DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS gp_opinion VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS appeal_filed VARCHAR(10) DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS appeal_filed_date DATE,
  ADD COLUMN IF NOT EXISTS linked_appeal_case_id UUID REFERENCES public.legal_cases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS final_order_compliance_action_given TEXT,
  ADD COLUMN IF NOT EXISTS final_order_compliance_action VARCHAR(10) DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS final_order_compliance_period VARCHAR(100),
  ADD COLUMN IF NOT EXISTS final_order_compliance_end_date DATE,
  ADD COLUMN IF NOT EXISTS final_order_compliance_action_taken TEXT,
  ADD COLUMN IF NOT EXISTS final_order_compliance_status VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS final_order_remarks TEXT;

-- 2. Backfill petitioner_names and respondent_names from existing columns if available
UPDATE public.legal_cases
SET 
  respondent_names = COALESCE(respondent_names, name_of_respondent),
  current_status = COALESCE(current_status, status, 'Pending'),
  present_stage = COALESCE(present_stage, case_details_present_status, 'Notice / Admission'),
  ca_filed = COALESCE(ca_filed, counter_affidavit_filed, 'No')
WHERE respondent_names IS NULL;

-- 3. Create Performance Indexes for Legal Litigation Filters
CREATE INDEX IF NOT EXISTS idx_legal_cases_classification ON public.legal_cases USING btree (case_classification);
CREATE INDEX IF NOT EXISTS idx_legal_cases_present_stage ON public.legal_cases USING btree (present_stage);
CREATE INDEX IF NOT EXISTS idx_legal_cases_current_status ON public.legal_cases USING btree (current_status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_ca_filed ON public.legal_cases USING btree (ca_filed);
CREATE INDEX IF NOT EXISTS idx_legal_cases_appeal_filed ON public.legal_cases USING btree (appeal_filed);
CREATE INDEX IF NOT EXISTS idx_legal_cases_next_hearing ON public.legal_cases USING btree (next_hearing_date);

-- 4. Master Data Configuration Table
CREATE TABLE IF NOT EXISTS public.legal_master_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_legal_master_config UNIQUE (category, value)
);

ALTER TABLE public.legal_master_config ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'legal_master_config' AND policyname = 'Allow public read legal_master_config'
  ) THEN
    CREATE POLICY "Allow public read legal_master_config" ON public.legal_master_config FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'legal_master_config' AND policyname = 'Allow public write legal_master_config'
  ) THEN
    CREATE POLICY "Allow public write legal_master_config" ON public.legal_master_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
