-- Migration 0045: Highway Master Data Configuration Schema
-- Creates public.highway_master_config for dynamic Circle, Division, and Configuration master data

CREATE TABLE IF NOT EXISTS public.highway_master_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,         -- 'circle', 'division', 'configuration'
    value TEXT NOT NULL,            -- e.g. 'Salem', '2 Lane with Paved Shoulder'
    parent_category TEXT,           -- 'circle' (when category is 'division')
    parent_value TEXT,              -- e.g. 'Salem' (parent circle of division)
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance and Hierarchy Indexes
CREATE INDEX IF NOT EXISTS idx_highway_master_config_category ON public.highway_master_config(category);
CREATE INDEX IF NOT EXISTS idx_highway_master_config_parent ON public.highway_master_config(parent_category, parent_value);
CREATE INDEX IF NOT EXISTS idx_highway_master_config_status ON public.highway_master_config(status);

-- Prevent duplicate active values within the same category and parent scope
CREATE UNIQUE INDEX IF NOT EXISTS idx_highway_master_config_unique 
    ON public.highway_master_config (category, lower(value), COALESCE(lower(parent_value), ''))
    WHERE status != 'DELETED';

-- Enable Row Level Security
ALTER TABLE public.highway_master_config ENABLE ROW LEVEL SECURITY;

-- Universal Access Policies matching project conventions
DROP POLICY IF EXISTS "Allow public read access on highway_master_config" ON public.highway_master_config;
CREATE POLICY "Allow public read access on highway_master_config"
    ON public.highway_master_config FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on highway_master_config" ON public.highway_master_config;
CREATE POLICY "Allow public insert access on highway_master_config"
    ON public.highway_master_config FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on highway_master_config" ON public.highway_master_config;
CREATE POLICY "Allow public update access on highway_master_config"
    ON public.highway_master_config FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on highway_master_config" ON public.highway_master_config;
CREATE POLICY "Allow public delete access on highway_master_config"
    ON public.highway_master_config FOR DELETE
    USING (true);

GRANT ALL ON public.highway_master_config TO postgres, anon, authenticated, service_role;

-- Seed Initial Verified Baseline Options
INSERT INTO public.highway_master_config (category, value, parent_category, parent_value)
VALUES
  -- Circles
  ('circle', 'Chennai', NULL, NULL),
  ('circle', 'Salem', NULL, NULL),
  ('circle', 'Madurai', NULL, NULL),
  ('circle', 'Coimbatore', NULL, NULL),
  ('circle', 'Tirunelveli', NULL, NULL),
  ('circle', 'Villupuram', NULL, NULL),

  -- Divisions
  ('division', 'Chennai', 'circle', 'Chennai'),
  ('division', 'Chengalpattu', 'circle', 'Chennai'),
  ('division', 'Tiruvallur', 'circle', 'Chennai'),
  ('division', 'Salem', 'circle', 'Salem'),
  ('division', 'Namakkal', 'circle', 'Salem'),
  ('division', 'Dharmapuri', 'circle', 'Salem'),
  ('division', 'Madurai', 'circle', 'Madurai'),
  ('division', 'Dindigul', 'circle', 'Madurai'),
  ('division', 'Theni', 'circle', 'Madurai'),
  ('division', 'Dharapuram', 'circle', 'Coimbatore'),
  ('division', 'Tirunelveli', 'circle', 'Tirunelveli'),
  ('division', 'Villupuram', 'circle', 'Villupuram'),
  ('division', 'Thanjavur', 'circle', 'Villupuram'),

  -- Level 1 Carriageway Configurations
  ('configuration', '2 Lane', NULL, NULL),
  ('configuration', '2 Lane with Paved Shoulder', NULL, NULL),
  ('configuration', '4 Lane', NULL, NULL),
  ('configuration', '4 Lane with Paved Shoulder', NULL, NULL),
  ('configuration', '6 Lane', NULL, NULL),
  ('configuration', '8 Lane', NULL, NULL),
  ('configuration', 'Expressway / Corridor', NULL, NULL),

  -- Level 2 Sub-Chainage Lane Statuses (Exact SLD-Compliant Tokens)
  ('level2_lane_status', '2-Lane', NULL, NULL),
  ('level2_lane_status', '2L+PS', NULL, NULL),
  ('level2_lane_status', '4-Lane', NULL, NULL),
  ('level2_lane_status', '4L+PS', NULL, NULL),
  ('level2_lane_status', '6-Lane', NULL, NULL),
  ('level2_lane_status', '<2-Lane', NULL, NULL),
  ('level2_lane_status', 'Primary', NULL, NULL)
ON CONFLICT DO NOTHING;
