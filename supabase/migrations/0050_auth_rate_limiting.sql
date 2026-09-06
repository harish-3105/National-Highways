-- ============================================================================
-- Migration 0050: Distributed Rate Limiting for Authentication Endpoints
-- Backed by dedicated native PostgreSQL table & atomic ON CONFLICT RPC
-- ============================================================================

-- 1. Create Dedicated Native Table for Rate Limit Buckets
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE, -- 'identify:phone:<phone>' or 'identify:ip:<ip>'
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_key ON public.auth_rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_expires ON public.auth_rate_limits(expires_at);

-- 2. Lockdown Row Level Security (RLS) - Deny Public/Anon, Permit Service Role
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_rate_limits FROM anon, public;

DROP POLICY IF EXISTS "Service role full access auth_rate_limits" ON public.auth_rate_limits;
CREATE POLICY "Service role full access auth_rate_limits"
  ON public.auth_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.auth_rate_limits TO service_role, postgres;

-- 3. Atomic Single-Statement Rate Limit RPC (Zero-Race Lock Serialization)
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key TEXT,
  p_max_attempts INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_new_expiry TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
  v_record RECORD;
  v_allowed BOOLEAN;
  v_remaining INT;
  v_retry_after INT;
BEGIN
  -- Single Atomic Statement: Unique index constraint forces all concurrent transactions
  -- on the same key into a serialized queue, executing DO UPDATE sequentially.
  INSERT INTO public.auth_rate_limits (
    key,
    attempt_count,
    first_attempt_at,
    last_attempt_at,
    expires_at
  )
  VALUES (
    p_key,
    1,
    v_now,
    v_now,
    v_new_expiry
  )
  ON CONFLICT (key) DO UPDATE
  SET
    attempt_count = CASE
      WHEN auth_rate_limits.expires_at <= EXCLUDED.first_attempt_at THEN 1
      ELSE auth_rate_limits.attempt_count + 1
    END,
    first_attempt_at = CASE
      WHEN auth_rate_limits.expires_at <= EXCLUDED.first_attempt_at THEN EXCLUDED.first_attempt_at
      ELSE auth_rate_limits.first_attempt_at
    END,
    last_attempt_at = EXCLUDED.last_attempt_at,
    expires_at = CASE
      WHEN auth_rate_limits.expires_at <= EXCLUDED.first_attempt_at THEN EXCLUDED.expires_at
      ELSE auth_rate_limits.expires_at
    END
  RETURNING * INTO v_record;

  -- Evaluate rate limit outcome on the resulting atomic record state
  IF v_record.attempt_count <= p_max_attempts THEN
    v_allowed := true;
    v_remaining := GREATEST(0, p_max_attempts - v_record.attempt_count);
    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_record.expires_at - v_now)))::INT);
  ELSE
    v_allowed := false;
    v_remaining := 0;
    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_record.expires_at - v_now)))::INT);
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'retry_after', v_retry_after
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, INT) TO service_role, postgres;
