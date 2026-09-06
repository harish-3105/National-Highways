import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extracts the real client IP address from Next.js incoming request headers.
 * Works across Vercel Edge/Serverless, standard proxies, and local development.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',');
    const clientIp = ips[0]?.trim();
    if (clientIp) return clientIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const vercelForwardedFor = req.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) return vercelForwardedFor.trim();

  return '127.0.0.1';
}

/**
 * Checks and increments a rate limit bucket in PostgreSQL via atomic RPC.
 * Shared across all Vercel serverless function instances with zero race conditions.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Surface raw database error according to system specifications
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  return {
    allowed: Boolean(data.allowed),
    remaining: Number(data.remaining),
    retryAfterSeconds: Number(data.retry_after),
  };
}
