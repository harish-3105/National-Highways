-- Migration 0038: Add Circle column to major_projects_50cr & Parent-Child hierarchy to ongoing_works_master_config

-- 1. Add circle column to major projects table
ALTER TABLE public.major_projects_50cr ADD COLUMN IF NOT EXISTS circle TEXT;
CREATE INDEX IF NOT EXISTS idx_major_projects_circle ON public.major_projects_50cr(circle);
CREATE INDEX IF NOT EXISTS idx_major_projects_circle_div ON public.major_projects_50cr(circle, division);

-- 2. Add relational parent-child columns to master config table
ALTER TABLE public.ongoing_works_master_config ADD COLUMN IF NOT EXISTS parent_category TEXT;
ALTER TABLE public.ongoing_works_master_config ADD COLUMN IF NOT EXISTS parent_value TEXT;

-- 3. Update constraints and indexes
ALTER TABLE public.ongoing_works_master_config DROP CONSTRAINT IF EXISTS ongoing_works_master_config_category_value_key;
CREATE INDEX IF NOT EXISTS idx_ongoing_master_config_parent ON public.ongoing_works_master_config(parent_category, parent_value);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ongoing_master_config_unique 
  ON public.ongoing_works_master_config (category, lower(value), COALESCE(lower(parent_value), ''));

-- 4. Seed Standard Circles
INSERT INTO public.ongoing_works_master_config (category, value) VALUES
  ('circle', 'Chennai'),
  ('circle', 'Salem'),
  ('circle', 'Madurai'),
  ('circle', 'Coimbatore'),
  ('circle', 'Tirunelveli'),
  ('circle', 'Villupuram'),
  ('circle', 'Tiruchirappalli')
ON CONFLICT DO NOTHING;

-- 5. Backfill parent relations for existing divisions
UPDATE public.ongoing_works_master_config SET parent_category = 'circle', parent_value = 'Chennai' WHERE category = 'division' AND (value ILIKE '%Chennai%' OR value ILIKE '%Tiruvallur%' OR value ILIKE '%Chengalpattu%');
UPDATE public.ongoing_works_master_config SET parent_category = 'circle', parent_value = 'Salem' WHERE category = 'division' AND (value ILIKE '%Salem%' OR value ILIKE '%Namakkal%' OR value ILIKE '%Dharmapuri%' OR value ILIKE '%Krishnagiri%');
UPDATE public.ongoing_works_master_config SET parent_category = 'circle', parent_value = 'Madurai' WHERE category = 'division' AND (value ILIKE '%Madurai%' OR value ILIKE '%Dindigul%' OR value ILIKE '%Theni%' OR value ILIKE '%Ramanathapuram%' OR value ILIKE '%Sivagangai%');
UPDATE public.ongoing_works_master_config SET parent_category = 'circle', parent_value = 'Coimbatore' WHERE category = 'division' AND (value ILIKE '%Coimbatore%' OR value ILIKE '%Dharapuram%' OR value ILIKE '%Tiruppur%' OR value ILIKE '%Erode%');
UPDATE public.ongoing_works_master_config SET parent_category = 'circle', parent_value = 'Tirunelveli' WHERE category = 'division' AND (value ILIKE '%Tirunelveli%' OR value ILIKE '%Tuticorin%' OR value ILIKE '%Thoothukudi%' OR value ILIKE '%Tenkasi%' OR value ILIKE '%Kanyakumari%' OR value ILIKE '%Nagercoil%');
UPDATE public.ongoing_works_master_config SET parent_category = 'circle', parent_value = 'Villupuram' WHERE category = 'division' AND (value ILIKE '%Villupuram%' OR value ILIKE '%Cuddalore%' OR value ILIKE '%Vellore%' OR value ILIKE '%Tiruvannamalai%');
UPDATE public.ongoing_works_master_config SET parent_category = 'circle', parent_value = 'Tiruchirappalli' WHERE category = 'division' AND (value ILIKE '%Tiruchirappalli%' OR value ILIKE '%Trichy%' OR value ILIKE '%Thanjavur%' OR value ILIKE '%Karur%' OR value ILIKE '%Pudukkottai%' OR value ILIKE '%Nagapattinam%');

-- 6. Backfill circle column on major_projects_50cr from division
UPDATE public.major_projects_50cr SET circle = 'Chennai' WHERE circle IS NULL AND (division ILIKE '%Chennai%' OR division ILIKE '%Tiruvallur%' OR division ILIKE '%Chengalpattu%');
UPDATE public.major_projects_50cr SET circle = 'Salem' WHERE circle IS NULL AND (division ILIKE '%Salem%' OR division ILIKE '%Namakkal%' OR division ILIKE '%Dharmapuri%' OR division ILIKE '%Krishnagiri%');
UPDATE public.major_projects_50cr SET circle = 'Madurai' WHERE circle IS NULL AND (division ILIKE '%Madurai%' OR division ILIKE '%Dindigul%' OR division ILIKE '%Theni%' OR division ILIKE '%Ramanathapuram%' OR division ILIKE '%Sivagangai%');
UPDATE public.major_projects_50cr SET circle = 'Coimbatore' WHERE circle IS NULL AND (division ILIKE '%Coimbatore%' OR division ILIKE '%Dharapuram%' OR division ILIKE '%Tiruppur%' OR division ILIKE '%Erode%');
UPDATE public.major_projects_50cr SET circle = 'Tirunelveli' WHERE circle IS NULL AND (division ILIKE '%Tirunelveli%' OR division ILIKE '%Tuticorin%' OR division ILIKE '%Thoothukudi%' OR division ILIKE '%Tenkasi%' OR division ILIKE '%Kanyakumari%' OR division ILIKE '%Nagercoil%');
UPDATE public.major_projects_50cr SET circle = 'Villupuram' WHERE circle IS NULL AND (division ILIKE '%Villupuram%' OR division ILIKE '%Cuddalore%' OR division ILIKE '%Vellore%' OR division ILIKE '%Tiruvannamalai%');
UPDATE public.major_projects_50cr SET circle = 'Tiruchirappalli' WHERE circle IS NULL AND (division ILIKE '%Tiruchirappalli%' OR division ILIKE '%Trichy%' OR division ILIKE '%Thanjavur%' OR division ILIKE '%Karur%' OR division ILIKE '%Pudukkottai%' OR division ILIKE '%Nagapattinam%');

