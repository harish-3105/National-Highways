-- Migration 0037: Expand legal_master_config categories and purge unused categories

-- 1. Purge legacy unused categories
DELETE FROM public.legal_master_config
WHERE category IN ('law_officer', 'petition_type', 'converted_category');

-- 2. Seed default values for new legal master config categories if not already present
INSERT INTO public.legal_master_config (category, value)
SELECT * FROM (VALUES
  ('ca_required', 'Yes'),
  ('ca_required', 'No'),
  ('ca_required', 'Not Required'),
  ('ca_filed', 'Yes'),
  ('ca_filed', 'No'),
  ('ca_filed', 'Under Preparation'),
  ('compliance_required', 'Yes'),
  ('compliance_required', 'No'),
  ('compliance_required', 'Not Applicable'),
  ('final_result', 'Yes'),
  ('final_result', 'No'),
  ('adverse_to_department', 'Yes'),
  ('adverse_to_department', 'No'),
  ('adverse_to_department', 'Neutral'),
  ('appeal_filed', 'Yes'),
  ('appeal_filed', 'No'),
  ('appeal_filed', 'Under Proposal')
) AS v(category, value)
WHERE NOT EXISTS (
  SELECT 1 FROM public.legal_master_config lmc
  WHERE lmc.category = v.category AND lmc.value = v.value
);
