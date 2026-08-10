-- Migration 0008: Fix RLS Policies for dlp_contracts
-- Enables SELECT, INSERT, UPDATE, and DELETE policies for public/anon roles

ALTER TABLE IF EXISTS public.dlp_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.dlp_contracts;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.dlp_contracts;
DROP POLICY IF EXISTS "Enable update for all users" ON public.dlp_contracts;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.dlp_contracts;

CREATE POLICY "Enable read access for all users"
ON public.dlp_contracts
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.dlp_contracts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.dlp_contracts
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
ON public.dlp_contracts
FOR DELETE
USING (true);
