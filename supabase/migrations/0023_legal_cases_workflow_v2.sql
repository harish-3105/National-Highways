-- Migration 0023: Legal Cases Workflow V2 Complete Table Schema & Master Data Seed
-- Clean table definition for fresh creation matching the final entry form specification

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

-- 2. Drop existing table if recreating from scratch
DROP TABLE IF EXISTS public.legal_cases CASCADE;

-- 3. Clean Legal Cases Table Definition
CREATE TABLE public.legal_cases (
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

-- 4. High Performance Indexes
CREATE INDEX idx_legal_cases_circle_div ON public.legal_cases (circle, division);
CREATE INDEX idx_legal_cases_case_num ON public.legal_cases (case_number);
CREATE INDEX idx_legal_cases_classification ON public.legal_cases (case_classification);
CREATE INDEX idx_legal_cases_present_stage ON public.legal_cases (present_stage);
CREATE INDEX idx_legal_cases_current_status ON public.legal_cases (current_status);
CREATE INDEX idx_legal_cases_ca_filed ON public.legal_cases (ca_filed);
CREATE INDEX idx_legal_cases_appeal_filed ON public.legal_cases (appeal_filed);
CREATE INDEX idx_legal_cases_next_hearing ON public.legal_cases (next_hearing_date);
CREATE INDEX idx_legal_cases_delete_status ON public.legal_cases (delete_status);

-- 5. Master Data Config Table
CREATE TABLE IF NOT EXISTS public.legal_master_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_legal_master_config UNIQUE (category, value)
);

-- 6. Row Level Security Policies
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

-- 7. Seed Complete Initial Master Data into legal_master_config
INSERT INTO public.legal_master_config (category, value) VALUES
  -- Circles
  ('circle', 'Chennai'),
  ('circle', 'Madurai'),
  ('circle', 'Salem'),
  ('circle', 'Coimbatore'),
  ('circle', 'Tirunelveli'),
  ('circle', 'Villupuram'),

  -- Divisions
  ('division', 'Chennai City Division'),
  ('division', 'Chengalpattu Division'),
  ('division', 'Tiruvallur Division'),
  ('division', 'Madurai Division'),
  ('division', 'Dindigul Division'),
  ('division', 'Theni Division'),
  ('division', 'Salem Division'),
  ('division', 'Namakkal Division'),
  ('division', 'Dharmapuri Division'),
  ('division', 'Coimbatore Division'),
  ('division', 'Tirunelveli Division'),
  ('division', 'Villupuram Division'),

  -- Categories
  ('category', 'Filed Against Department'),
  ('category', 'Filed By Department'),

  -- Case Types
  ('case_type', 'Writ Petition (WP)'),
  ('case_type', 'Writ Appeal (WA)'),
  ('case_type', 'Civil Revision Petition (CRP)'),
  ('case_type', 'Original Side Appeal (OSA)'),
  ('case_type', 'Special Leave Petition (SLP)'),
  ('case_type', 'Contempt Petition'),
  ('case_type', 'Civil Miscellaneous Petition (CMP)'),
  ('case_type', 'Review Application'),
  ('case_type', 'Original Petition (OP)'),
  ('case_type', 'Original Suit (OS)'),
  ('case_type', 'Appeal Suit (AS)'),
  ('case_type', 'Civil Miscellaneous Appeal (CMA)'),
  ('case_type', 'Arbitration Original Petition (Arb. OP)'),
  ('case_type', 'Other'),

  -- Case Statuses
  ('case_status', 'Pending'),
  ('case_status', 'Disposed'),
  ('case_status', 'Stay Granted'),
  ('case_status', 'Interim Order Issued'),
  ('case_status', 'Dismissed'),
  ('case_status', 'Allowed in Favour'),
  ('case_status', 'Allowed Adverse to Dept'),
  ('case_status', 'Remanded'),

  -- Case Pertains To
  ('case_pertains_to', 'GOTN'),
  ('case_pertains_to', 'MoRTH'),
  ('case_pertains_to', 'Both'),
  ('case_pertains_to', 'NHAI'),

  -- Nature of Cases
  ('nature_of_case', 'Work'),
  ('nature_of_case', 'Tender'),
  ('nature_of_case', 'Land Acquisition'),
  ('nature_of_case', 'Encroachment'),
  ('nature_of_case', 'Arbitration / Dispute'),
  ('nature_of_case', 'Service Matter / Service Rights'),
  ('nature_of_case', 'Toll Plaza / User Fee'),
  ('nature_of_case', 'Road Safety & Maintenance'),
  ('nature_of_case', 'Other'),

  -- Courts
  ('court_name', 'High Court of Madras (Principal Seat, Chennai)'),
  ('court_name', 'High Court of Madras (Madurai Bench)'),
  ('court_name', 'Supreme Court of India (New Delhi)'),
  ('court_name', 'City Civil Court Complex, Chennai'),
  ('court_name', 'District & Sessions Court'),
  ('court_name', 'Subordinate Judge Court (Sub Court)'),
  ('court_name', 'District Munsif Court'),
  ('court_name', 'National Green Tribunal (NGT), Southern Zone'),
  ('court_name', 'Labour Court / Industrial Tribunal'),
  ('court_name', 'Arbitral Tribunal'),
  ('court_name', 'Other Court'),

  -- Law Officers
  ('law_officer', 'Advocate General of Tamil Nadu'),
  ('law_officer', 'Additional Advocate General'),
  ('law_officer', 'Special Government Pleader (Highways)'),
  ('law_officer', 'Additional Government Pleader'),
  ('law_officer', 'Government Advocate (Civil Side)'),
  ('law_officer', 'Standing Counsel (Highways)'),

  -- Appeal Levels
  ('appeal_level', 'Single Bench to Division Bench (High Court)'),
  ('appeal_level', 'District / Sub Court to High Court'),
  ('appeal_level', 'High Court to Supreme Court of India'),
  ('appeal_level', 'Tribunal to High Court'),
  ('appeal_level', 'Other Appellate Forum'),

  -- Appeal Case Types
  ('appeal_case_type', 'Writ Appeal (WA)'),
  ('appeal_case_type', 'Civil Miscellaneous Appeal (CMA)'),
  ('appeal_case_type', 'Appeal Suit (AS)'),
  ('appeal_case_type', 'Special Leave Petition (SLP)'),
  ('appeal_case_type', 'Civil Revision Petition (CRP)'),
  ('appeal_case_type', 'Review Petition'),
  ('appeal_case_type', 'Letters Patent Appeal (LPA)'),
  ('appeal_case_type', 'Other'),

  -- Appellate Courts
  ('appellate_court', 'High Court of Madras (Division Bench, Principal Seat, Chennai)'),
  ('appellate_court', 'High Court of Madras (Madurai Bench)'),
  ('appellate_court', 'Supreme Court of India (New Delhi)'),
  ('appellate_court', 'Principal District & Sessions Court'),
  ('appellate_court', 'National Green Tribunal (NGT) - Southern Zone'),
  ('appellate_court', 'Other Appellate Forum'),

  -- Condonation of Delay
  ('condonation_of_delay', 'Pending'),
  ('condonation_of_delay', 'Allowed / Condoned'),
  ('condonation_of_delay', 'Dismissed / Rejected'),
  ('condonation_of_delay', 'Not Applicable / Filed In Time'),

  -- Present Stages
  ('present_stage', 'Notice / Admission'),
  ('present_stage', 'Counter Affidavit Pending'),
  ('present_stage', 'Interim Stay / Direction in Operation'),
  ('present_stage', 'Counter Filed / Awaiting Hearing'),
  ('present_stage', 'Arguments in Progress'),
  ('present_stage', 'Orders Reserved'),
  ('present_stage', 'Disposed / Final Order Issued'),
  ('present_stage', 'Compliance Pending'),
  ('present_stage', 'Contempt Proceedings Initiated'),
  ('present_stage', 'Appeal Filed in Higher Forum'),

  -- GP Opinions
  ('gp_opinion', 'Pending'),
  ('gp_opinion', 'Not Recommended'),
  ('gp_opinion', 'Recommended'),
  ('gp_opinion', 'Not Required'),

  -- Compliance Statuses
  ('compliance_status', 'Complied'),
  ('compliance_status', 'Pending')
ON CONFLICT (category, value) DO NOTHING;
