-- ============================================================================
-- Migration 0049: Atomic Soft-Delete and Restore RPC Functions for DLP Corridors
-- Ensures parent corridor and child work stretches update atomically in a single transaction
-- ============================================================================

-- 1. Atomic Soft-Delete Function for DLP Corridors
CREATE OR REPLACE FUNCTION public.soft_delete_dlp_corridor(p_corridor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Soft-delete parent corridor
  UPDATE public.dlp_corridors
  SET status = 'DELETED', updated_at = NOW()
  WHERE id = p_corridor_id;

  -- 2. Soft-delete all child work stretches
  UPDATE public.dlp_work_stretches
  SET status = 'DELETED', updated_at = NOW()
  WHERE corridor_id = p_corridor_id;
END;
$$;

-- 2. Atomic Restore Function for DLP Corridors
CREATE OR REPLACE FUNCTION public.restore_dlp_corridor(p_corridor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Restore parent corridor
  UPDATE public.dlp_corridors
  SET status = 'ACTIVE', updated_at = NOW()
  WHERE id = p_corridor_id;

  -- 2. Restore all child work stretches
  UPDATE public.dlp_work_stretches
  SET status = 'ACTIVE', updated_at = NOW()
  WHERE corridor_id = p_corridor_id;
END;
$$;
