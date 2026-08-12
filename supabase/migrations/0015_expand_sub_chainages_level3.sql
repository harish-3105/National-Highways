-- Migration 0015: Expand highway_sub_chainages for Level 3 SLD Straight-Line Diagram Data
-- Adds fields: important_town (Micro), row_width (Micro & Macro), carriageway_width (Micro & Macro)

ALTER TABLE public.highway_sub_chainages ADD COLUMN IF NOT EXISTS important_town TEXT;
ALTER TABLE public.highway_sub_chainages ADD COLUMN IF NOT EXISTS row_width VARCHAR(100);
ALTER TABLE public.highway_sub_chainages ADD COLUMN IF NOT EXISTS carriageway_width VARCHAR(100);

-- Comment on columns for schema clarity
COMMENT ON COLUMN public.highway_sub_chainages.important_town IS 'Important town, landmark, junction, or ROB marker at specific micro-chainage';
COMMENT ON COLUMN public.highway_sub_chainages.row_width IS 'Right of Way (ROW) width dimension (e.g., 22m-25m, 18m)';
COMMENT ON COLUMN public.highway_sub_chainages.carriageway_width IS 'Carriageway width detail (e.g., 7m, 10m, 14m, 15.6m)';

-- Ensure RLS is disabled and permissions granted for API ingestion & CRUD
ALTER TABLE public.highway_sub_chainages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.highway_sub_chainages TO postgres, anon, authenticated, service_role;
