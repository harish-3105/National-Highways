-- Migration 0034: Legal Master Config Relational Parent-Child Hierarchy Schema Definition

-- 1. Add parent_value column to legal_master_config
ALTER TABLE public.legal_master_config ADD COLUMN IF NOT EXISTS parent_value TEXT NULL;

-- 2. Drop old unique constraint if present
ALTER TABLE public.legal_master_config DROP CONSTRAINT IF EXISTS uq_legal_master_config;
ALTER TABLE public.legal_master_config DROP CONSTRAINT IF EXISTS legal_master_config_category_value_key;

-- 3. Create indexes for fast lookup and relational querying
CREATE INDEX IF NOT EXISTS idx_legal_master_config_parent ON public.legal_master_config(category, parent_value);
CREATE INDEX IF NOT EXISTS idx_legal_master_config_category ON public.legal_master_config(category);

-- 4. Backfill parent circle relations for existing seeded divisions
UPDATE public.legal_master_config SET parent_value = 'Chennai' WHERE category = 'division' AND value IN ('Chennai City Division', 'Chengalpattu Division', 'Tiruvallur Division');
UPDATE public.legal_master_config SET parent_value = 'Madurai' WHERE category = 'division' AND value IN ('Madurai Division', 'Dindigul Division', 'Theni Division');
UPDATE public.legal_master_config SET parent_value = 'Salem' WHERE category = 'division' AND value IN ('Salem Division', 'Namakkal Division', 'Dharmapuri Division');
UPDATE public.legal_master_config SET parent_value = 'Coimbatore' WHERE category = 'division' AND value = 'Coimbatore Division';
UPDATE public.legal_master_config SET parent_value = 'Tirunelveli' WHERE category = 'division' AND value = 'Tirunelveli Division';
UPDATE public.legal_master_config SET parent_value = 'Villupuram' WHERE category = 'division' AND value = 'Villupuram Division';
