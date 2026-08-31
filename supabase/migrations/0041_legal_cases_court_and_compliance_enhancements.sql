-- Migration 0041: Legal Cases Court and Compliance Enhancements
-- 1. Add ced_complaint_sent_date for tracking compliance delay
-- 2. Add specify helper columns for custom court and nature of case entries

ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS ced_complaint_sent_date DATE NULL;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_base_nature_of_case TEXT NULL;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_name_of_court TEXT NULL;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_appellate_court TEXT NULL;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_base_court_name TEXT NULL;
