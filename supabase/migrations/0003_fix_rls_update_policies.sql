-- Migration 0003: Fix RLS Update & Delete Security Policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/painfnxuqzwtmowddogt/sql

-- Drop existing restricted update policy on highways
DROP POLICY IF EXISTS "Enable update for all users" ON public.highways;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.highways;

-- Re-create UPDATE policy with explicit WITH CHECK (true) clause for Supabase REST API
CREATE POLICY "Enable update for all users" 
ON public.highways 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Enable DELETE policy on highways table
CREATE POLICY "Enable delete for all users" 
ON public.highways 
FOR DELETE 
USING (true);

-- Drop & recreate legal_cases update policy
DROP POLICY IF EXISTS "Enable update for all users" ON public.legal_cases;

CREATE POLICY "Enable update for all users" 
ON public.legal_cases 
FOR UPDATE 
USING (true) 
WITH CHECK (true);
