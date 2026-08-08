-- Migration 0005: Comprehensive Legal Cases & Litigation Schema Update

CREATE TABLE IF NOT EXISTS lawyers (
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

CREATE TABLE IF NOT EXISTS legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle VARCHAR(100),
  division VARCHAR(100),
  case_number VARCHAR(100) UNIQUE NOT NULL,
  case_year VARCHAR(10),
  category VARCHAR(100),
  name_of_court VARCHAR(255),
  name_of_respondent VARCHAR(255),
  case_pertains_to VARCHAR(50),
  nature_of_case VARCHAR(100),
  specify_nature_of_case VARCHAR(255),
  brief_of_prayer TEXT,
  case_details_present_status TEXT,
  counter_affidavit_filed VARCHAR(10) DEFAULT 'No',
  counter_affidavit_details JSONB,
  post_hearing_details JSONB,
  action_to_take_counter_affidavit TEXT,
  converted_case JSONB,
  lawyer_id UUID REFERENCES lawyers(id),
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_cases_circle_div ON legal_cases(circle, division);
CREATE INDEX IF NOT EXISTS idx_legal_cases_case_num ON legal_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON legal_cases(status);

ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read legal_cases" ON legal_cases FOR SELECT USING (true);
CREATE POLICY "Allow public write legal_cases" ON legal_cases FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read lawyers" ON lawyers FOR SELECT USING (true);
CREATE POLICY "Allow public write lawyers" ON lawyers FOR ALL USING (true) WITH CHECK (true);
