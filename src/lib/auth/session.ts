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

export const COOKIE_NAME = 'tnhighways_session';
const SESSION_SECRET = process.env.AUTH_SECRET || 'tnhighways_dept_secret_key_2026_rbac_jwt_secure_auth';
const SESSION_MAX_AGE = 60 * 60 * 24; // 1 day in seconds (24 hours)

// Helper to base64url encode an ArrayBuffer or Uint8Array
function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper to base64url decode into a Uint8Array
function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper to stringify & base64url encode JSON object
function jsonToBase64Url(obj: any): string {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper to decode base64url to JSON object
function base64UrlToJson<T = any>(base64url: string): T | null {
  try {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Creates a signed JWT session token using standard Web Crypto API (Edge & Node compatible)
 */
export async function createSessionToken(payload: SessionUser): Promise<string> {
  const header = jsonToBase64Url({ alg: 'HS256', typ: 'JWT' });
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const body = jsonToBase64Url({ ...payload, exp });
  const message = `${header}.${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signature = bufferToBase64Url(signatureBuffer);

  return `${message}.${signature}`;
}

/**
 * Verifies and decodes a signed session token using standard Web Crypto API (Edge & Node compatible)
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const message = `${header}.${body}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlToBuffer(signature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as any,
      encoder.encode(message)
    );

    if (!isValid) return null;

    const payload = base64UrlToJson<{ exp?: number } & SessionUser>(body);
    if (!payload) return null;

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
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
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
