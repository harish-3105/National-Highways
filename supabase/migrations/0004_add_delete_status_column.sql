-- Migration 0004: Add delete_status Column to Highways Table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/painfnxuqzwtmowddogt/sql

ALTER TABLE public.highways 
ADD COLUMN IF NOT EXISTS delete_status VARCHAR(50) DEFAULT 'KEEP';
