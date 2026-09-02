import crypto from 'crypto';
import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  roleId: string;
  roleName: string;
  position: number;
  isSuperAdmin: boolean;
  jurisdictionScope: 'STATEWIDE' | 'CIRCLE' | 'DIVISION' | 'SUB_DIVISION';
  circle?: string | null;
  division?: string | null;
  subDivision?: string | null;
  permissions: string[];
  isLockdownActive: boolean;
}

const COOKIE_NAME = 'tnhighways_session';
const SESSION_SECRET = process.env.AUTH_SECRET || 'tnhighways_dept_secret_key_2026_rbac_jwt_secure_auth';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Creates a signed base64url JWT-like session token
 */
export function createSessionToken(payload: SessionUser): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verifies and decodes a signed session token
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Gets the current session user from the incoming request cookies (Server Components & Route Handlers)
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clears the session cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
