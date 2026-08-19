-- Migration 0019: Convert all string columns in major_projects_50cr to TEXT
-- Prevents "value too long for type character varying" errors on lengthy departmental notes & EOT proposals

ALTER TABLE public.major_projects_50cr
    ALTER COLUMN division TYPE TEXT,
    ALTER COLUMN scheme TYPE TEXT,
    ALTER COLUMN name_of_work TYPE TEXT,
    ALTER COLUMN probable_completion_date TYPE TEXT,
    ALTER COLUMN stage_remarks TYPE TEXT,
    ALTER COLUMN pmis_id TYPE TEXT,
    ALTER COLUMN old_new_nh TYPE TEXT,
    ALTER COLUMN job_no TYPE TEXT,
    ALTER COLUMN sanction_date TYPE TEXT,
    ALTER COLUMN appointed_date TYPE TEXT,
    ALTER COLUMN scheduled_completion_date TYPE TEXT,
    ALTER COLUMN likely_completion_date TYPE TEXT,
    ALTER COLUMN eot_granted_till TYPE TEXT,
    ALTER COLUMN eot_proposal_agency TYPE TEXT,
    ALTER COLUMN cos_details TYPE TEXT,
    ALTER COLUMN de_name_phone TYPE TEXT,
    ALTER COLUMN contractor_name TYPE TEXT,
    ALTER COLUMN updated_division_date TYPE TEXT,
    ALTER COLUMN detailed_stage_status TYPE TEXT;
