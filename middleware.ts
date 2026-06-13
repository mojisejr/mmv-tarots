import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { isContentCreatorEnabled } from '@/content-creator/lib/enabled';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 0. content-creator gate — admin tool รัน local เท่านั้น. ปิด = 404 จริง (ดูเหมือนไม่มี route)
  //    ครอบทั้ง page /content-creator และ api /content-creator/api/* (อยู่ใต้ prefix เดียว)
  if (pathname === '/content-creator' || pathname.startsWith('/content-creator/')) {
    if (!isContentCreatorEnabled()) {
      return new NextResponse(null, { status: 404 });
    }
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
  const isLiffRoute = pathname.startsWith('/liff');

  if (isProtectedRoute && !isLiffRoute) {
    const sessionToken = getSessionCookie(request.headers, {
      cookiePrefix: 'mmv_auth',
    });
    
    if (!sessionToken) {
      // Missing session, redirect to /liff entry with current path as state
      const liffUrl = new URL('/liff', request.url);
      liffUrl.searchParams.set('mmv_next', pathname + (request.nextUrl.search || ''));
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
