-- Migration 0042: Drop redundant ced_complaint_sent_date column from legal_cases
ALTER TABLE public.legal_cases DROP COLUMN IF EXISTS ced_complaint_sent_date;
