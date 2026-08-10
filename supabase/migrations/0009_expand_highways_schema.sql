-- Migration 0009: Expand highways table schema with Old/New NH numbers & multi-lane breakdown
-- Supports ground-truth parity with Level 1 Master Excel: NH LENGTH & LANE 09.06.2026.xlsx

ALTER TABLE public.highways
ADD COLUMN IF NOT EXISTS old_nh_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS new_nh_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS length_less_than_2l DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_2l DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_2l_ps DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_4l DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_6l DECIMAL(10, 3) DEFAULT 0;
