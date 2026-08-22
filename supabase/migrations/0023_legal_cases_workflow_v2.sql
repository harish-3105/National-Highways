-- Migration 0023: Legal Cases Workflow V2 Complete Table Schema
-- Clean table definition for fresh creation (or upgrade) matching the final entry form specification

-- 1. Lawyers Table (if not exists)
CREATE TABLE IF NOT EXISTS public.lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  bar_council_no VARCHAR(100) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialization VARCHAR(100),
  office_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Legal Cases Table (Fresh Complete Definition)
CREATE TABLE IF NOT EXISTS public.legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Top Level Classification (Normal Case vs Appeal Case)
  case_classification VARCHAR(50) NOT NULL DEFAULT 'Normal Case',
  
  -- Section A: Appeal Case Information (JSON structure when case_classification = 'Appeal Case')
  appeal_info JSONB NULL,

  -- Section B.1: Case Information
  case_type VARCHAR(100) NOT NULL,
  circle VARCHAR(100) NOT NULL,
  division VARCHAR(100) NOT NULL,
  case_number VARCHAR(100) UNIQUE NOT NULL,
  case_year VARCHAR(10) NOT NULL,
  category VARCHAR(100) NOT NULL,
  name_of_court VARCHAR(255) NOT NULL,
  petitioner_names TEXT NOT NULL,
  respondent_names TEXT NOT NULL,
  case_pertains_to VARCHAR(50) NOT NULL,
  nature_of_case VARCHAR(100) NOT NULL,
  specify_nature_of_case VARCHAR(255) NULL,
  brief_of_prayer TEXT NOT NULL,
  financial_implication VARCHAR(100) NULL,
  present_stage VARCHAR(150) NOT NULL,
  current_status VARCHAR(50) NOT NULL DEFAULT 'Pending',

  -- Section B.2: Counter Affidavit (CA) Information
  ca_required VARCHAR(10) NOT NULL DEFAULT 'Yes',
  ca_filed VARCHAR(10) NOT NULL DEFAULT 'No',
  ca_due_date DATE NULL,
  ca_filed_date DATE NULL,

  -- Section B.3: Hearing & Orders
  last_hearing_date DATE NULL,
  next_hearing_date DATE NULL,
  next_listing_purpose TEXT NULL,
  interim_order_direction TEXT NULL,
  interim_order_date DATE NULL,
  latest_order_final_order TEXT NULL,
  latest_order_date DATE NULL,

  -- Section B.4: Compliance (Interim / Directives)
  compliance_required VARCHAR(10) NOT NULL DEFAULT 'No',
  compliance_action TEXT NULL,
  compliance_period VARCHAR(100) NULL,
  compliance_end_date DATE NULL,
  action_taken_details_for_compliance TEXT NULL,
  compliance_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  remarks TEXT NULL,

  -- Section B.5: Final Result & GP Opinion
  final_result VARCHAR(10) NOT NULL DEFAULT 'No',
  final_result_order TEXT NULL,
  final_order_date DATE NULL,
  adverse_to_department VARCHAR(10) NOT NULL DEFAULT 'No',
  gp_opinion VARCHAR(50) NOT NULL DEFAULT 'Pending',

  -- Section B.6: Appeal
  appeal_filed VARCHAR(10) NOT NULL DEFAULT 'No',
  appeal_filed_date DATE NULL,
  linked_appeal_case_id UUID REFERENCES public.legal_cases(id) ON DELETE SET NULL,

  -- Section B.7: Final-Order Compliance
  final_order_compliance_action_given TEXT NULL,
  final_order_compliance_action VARCHAR(10) NOT NULL DEFAULT 'No',
  final_order_compliance_period VARCHAR(100) NULL,
  final_order_compliance_end_date DATE NULL,
  final_order_compliance_action_taken TEXT NULL,
  final_order_compliance_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  final_order_remarks TEXT NULL,

  -- System & Audit Metadata
  lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE SET NULL,
  delete_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for Filtering & Search
CREATE INDEX IF NOT EXISTS idx_legal_cases_circle_div ON public.legal_cases USING btree (circle, division);
CREATE INDEX IF NOT EXISTS idx_legal_cases_case_num ON public.legal_cases USING btree (case_number);
CREATE INDEX IF NOT EXISTS idx_legal_cases_classification ON public.legal_cases USING btree (case_classification);
CREATE INDEX IF NOT EXISTS idx_legal_cases_present_stage ON public.legal_cases USING btree (present_stage);
CREATE INDEX IF NOT EXISTS idx_legal_cases_current_status ON public.legal_cases USING btree (current_status);
CREATE INDEX IF NOT EXISTS idx_legal_cases_ca_filed ON public.legal_cases USING btree (ca_filed);
CREATE INDEX IF NOT EXISTS idx_legal_cases_appeal_filed ON public.legal_cases USING btree (appeal_filed);
CREATE INDEX IF NOT EXISTS idx_legal_cases_next_hearing ON public.legal_cases USING btree (next_hearing_date);
CREATE INDEX IF NOT EXISTS idx_legal_cases_delete_status ON public.legal_cases USING btree (delete_status);

-- 4. Master Data Configuration Table
CREATE TABLE IF NOT EXISTS public.legal_master_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_legal_master_config UNIQUE (category, value)
);

-- 5. Row Level Security Policies
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_master_config ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- legal_cases policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_cases' AND policyname = 'Allow public read legal_cases') THEN
    CREATE POLICY "Allow public read legal_cases" ON public.legal_cases FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_cases' AND policyname = 'Allow public write legal_cases') THEN
    CREATE POLICY "Allow public write legal_cases" ON public.legal_cases FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- lawyers policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lawyers' AND policyname = 'Allow public read lawyers') THEN
    CREATE POLICY "Allow public read lawyers" ON public.lawyers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lawyers' AND policyname = 'Allow public write lawyers') THEN
    CREATE POLICY "Allow public write lawyers" ON public.lawyers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- legal_master_config policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_master_config' AND policyname = 'Allow public read legal_master_config') THEN
    CREATE POLICY "Allow public read legal_master_config" ON public.legal_master_config FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_master_config' AND policyname = 'Allow public write legal_master_config') THEN
    CREATE POLICY "Allow public write legal_master_config" ON public.legal_master_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
