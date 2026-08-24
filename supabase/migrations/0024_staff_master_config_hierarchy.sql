-- Migration 0024: Staff Master Config Relational Parent-Child Hierarchy Schema Definition

-- 1. Add parent_category and parent_value columns to staff_master_config
ALTER TABLE public.staff_master_config ADD COLUMN IF NOT EXISTS parent_category TEXT;
ALTER TABLE public.staff_master_config ADD COLUMN IF NOT EXISTS parent_value TEXT;

-- 2. Drop old 2-column unique constraint if present
ALTER TABLE public.staff_master_config DROP CONSTRAINT IF EXISTS staff_master_config_category_value_key;

-- 3. Create index for fast parent-child hierarchical lookup
CREATE INDEX IF NOT EXISTS idx_staff_master_config_parent ON public.staff_master_config(parent_category, parent_value);
CREATE INDEX IF NOT EXISTS idx_staff_master_config_category ON public.staff_master_config(category);
