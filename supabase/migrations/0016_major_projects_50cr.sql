-- Migration 0016: Create major_projects_50cr table for High-Value Capital Works (> Rs. 50 Cr.)
-- Supports CM Dashboard Extracts & Departmental Review Presentations

CREATE TABLE IF NOT EXISTS public.major_projects_50cr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    s_no INTEGER,
    division VARCHAR(100) NOT NULL,
    scheme VARCHAR(150) NOT NULL,
    name_of_work TEXT NOT NULL,
    project_cost_cr NUMERIC(12, 2) NOT NULL CHECK (project_cost_cr >= 0),
    work_stage VARCHAR(50) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS' or 'TENDER_STAGE'
    progress_percent NUMERIC(5, 2) DEFAULT 0,
    probable_completion_date VARCHAR(100),
    stage_remarks TEXT,
    delete_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient filtering and searching
CREATE INDEX IF NOT EXISTS idx_major_projects_division ON public.major_projects_50cr(division);
CREATE INDEX IF NOT EXISTS idx_major_projects_stage ON public.major_projects_50cr(work_stage);
CREATE INDEX IF NOT EXISTS idx_major_projects_s_no ON public.major_projects_50cr(s_no);

-- Disable Row Level Security (RLS) to allow API CRUD operations
ALTER TABLE public.major_projects_50cr DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.major_projects_50cr TO postgres, anon, authenticated, service_role;
