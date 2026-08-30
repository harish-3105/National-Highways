-- Migration 0035: Drop redundant final-order compliance fields from legal_cases
-- Final order tracking is handled via final_result, final_result_order, final_order_date,
-- adverse_to_department, gp_opinion, appeal_filed, appeal_filed_date, and final_order_remarks.
-- Compliance is tracked under interim compliance (Section B.4).

ALTER TABLE public.legal_cases
    DROP COLUMN IF EXISTS final_order_compliance_action_given,
    DROP COLUMN IF EXISTS final_order_compliance_action,
    DROP COLUMN IF EXISTS final_order_compliance_period,
    DROP COLUMN IF EXISTS final_order_compliance_end_date,
    DROP COLUMN IF EXISTS final_order_compliance_action_taken,
    DROP COLUMN IF EXISTS final_order_compliance_status;
