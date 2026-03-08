import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const host = request.headers.get('host') ?? request.nextUrl.host;
  if (host.toLowerCase().startsWith('www.')) {
    const normalizedUrl = request.nextUrl.clone();
    normalizedUrl.host = host.replace(/^www\./i, '');
    return NextResponse.redirect(normalizedUrl, 301);
  }

  const response = NextResponse.next();

  // 1. Referral Logic
  const refParam = searchParams.get('ref');
  
  if (refParam) {
    const existingRef = request.cookies.get('mmv_ref');
    if (!existingRef) {
      response.cookies.set('mmv_ref', refParam, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
  }

  // 2. Auth Enforcer (Protected Routes)
  const protectedRoutes = ['/profile', '/history', '/package', '/submitted'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const sessionToken = request.cookies.get('mmv_auth.session_token') || 
                         request.cookies.get('__Secure-mmv_auth.session_token');
    
    if (!sessionToken) {
      // Missing session, redirect to /liff entry with current path as state
      const liffUrl = new URL('/liff', request.url);
      liffUrl.searchParams.set('liff.state', pathname + (request.nextUrl.search || ''));
      return NextResponse.redirect(liffUrl);
    }
  }
  
  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
