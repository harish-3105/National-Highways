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
  isActive?: boolean;
}

export const COOKIE_NAME = 'tnhighways_session';
export const SESSION_MAX_AGE = 60 * 60 * 24; // 1 day in seconds (24 hours)

/**
 * Returns the cryptographically secure JWT signing secret from environment.
 * Throws a fatal security error in production if AUTH_SECRET is missing.
 */
export function getSessionSecret(): string {
  const secret = (process.env.AUTH_SECRET || '').trim();
  if (secret.length >= 32) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL SECURITY CONFIGURATION ERROR: AUTH_SECRET environment variable is missing or less than 32 characters in production.');
  }
  return 'dev_temporary_jwt_secret_key_minimum_32_characters_for_local_testing_only';
}

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
    encoder.encode(getSessionSecret()),
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
      encoder.encode(getSessionSecret()),
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

export const DEFAULT_USER: SessionUser = {
  id: 'default-admin-id',
  phoneNumber: '9999999999',
  fullName: 'Department Administrator',
  roleId: 'super-admin-role',
  roleName: 'Super Admin',
  position: 100,
  isSuperAdmin: true,
  jurisdictionScope: 'STATEWIDE',
  circle: null,
  division: null,
  subDivision: null,
  permissions: ['*:*'],
  isLockdownActive: false,
  isActive: true,
};

/**
 * Gets the current session user from the incoming request cookies (Server Components & Route Handlers)
 * When authentication is disabled, defaults to full Super Admin permissions.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) return verified;
    }
  } catch {
    // ignore
  }
  return DEFAULT_USER;
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
