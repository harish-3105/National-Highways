-- Migration 0041: Legal Cases Court and Compliance Enhancements
-- Add specify helper columns for custom court and nature of case entries

ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_base_nature_of_case TEXT NULL;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_name_of_court TEXT NULL;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_appellate_court TEXT NULL;
ALTER TABLE public.legal_cases ADD COLUMN IF NOT EXISTS specify_base_court_name TEXT NULL;

