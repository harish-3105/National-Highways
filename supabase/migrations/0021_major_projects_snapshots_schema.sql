-- Migration 0021: Historical Snapshot & Audit Tracking for Ongoing Works
-- Tracks state snapshots, progress deltas, and mutation events over time

CREATE TABLE IF NOT EXISTS public.major_projects_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.major_projects_50cr(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    action_source TEXT NOT NULL DEFAULT 'MANUAL_EDIT', -- 'EXCEL_UPLOAD', 'MANUAL_ADD', 'MANUAL_EDIT', 'INLINE_EDIT'
    user_identifier TEXT,
    
    -- Progress & Expenditure metrics at time of snapshot
    progress_percent NUMERIC(5, 2),
    financial_progress_percent NUMERIC(5, 2),
    cumm_financial_expenditure_cr NUMERIC(12, 2),
    contract_cum_expenditure_cr NUMERIC(12, 2),
    
    -- Remarks & Clearance Issues at time of snapshot
    progress_remarks TEXT,
    stage_remarks TEXT,
    detailed_stage_status TEXT,
    issue_land TEXT,
    issue_forest TEXT,
    issue_utility TEXT,
    issue_railways TEXT,
    issue_others TEXT,
    
    -- Full state payload at snapshot time
    full_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup by project_id and timeline ordering
CREATE INDEX IF NOT EXISTS idx_major_projects_snapshots_project_id ON public.major_projects_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_major_projects_snapshots_date ON public.major_projects_snapshots(snapshot_date DESC);

-- Enable RLS
ALTER TABLE public.major_projects_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated & anonymous clients in portal
CREATE POLICY "Allow read major_projects_snapshots" ON public.major_projects_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow insert major_projects_snapshots" ON public.major_projects_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update major_projects_snapshots" ON public.major_projects_snapshots FOR UPDATE USING (true);
CREATE POLICY "Allow delete major_projects_snapshots" ON public.major_projects_snapshots FOR DELETE USING (true);
