import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

// Public routes that do NOT require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/identify',
  '/api/auth/verify-totp',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public static assets and Next.js internal files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Allow public auth endpoints
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    // If user is already logged in and visits /login, redirect to /highways
    const token = req.cookies.get('tnhighways_session')?.value;
    if (pathname === '/login' && token && (await verifySessionToken(token))) {
      return NextResponse.redirect(new URL('/highways', req.url));
    }
    return NextResponse.next();
  }

  // 3. Verify session token for protected routes
  const token = req.cookies.get('tnhighways_session')?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    // If it's an API request, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication session required.' },
        { status: 401 }
      );
    }

    // If it's a page request, redirect to /login with redirect query param
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Root path redirect to /highways
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/highways', req.url));
  }

  // 5. Emergency Lockdown Enforcement in Middleware
  // If system is locked down and this is an API mutation (POST/PUT/PATCH/DELETE), block non-admins
  if (
    user.isLockdownActive &&
    !user.isSuperAdmin &&
    pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  ) {
    // Allow logout, identify, verify-totp
    if (!pathname.startsWith('/api/auth/')) {
      return NextResponse.json(
        { error: 'Emergency Lockdown Active: System is in read-only freeze mode. Write operations are temporarily disabled.' },
        { status: 423 } // 423 Locked
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
