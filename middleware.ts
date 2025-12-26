import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Capture referral code from URL parameter
  const refParam = request.nextUrl.searchParams.get('ref');
  
  if (refParam) {
    // Check if there's already a referral cookie
    const existingRef = request.cookies.get('mmv_ref');
    
    // Only set cookie if not already set (first-touch attribution)
    if (!existingRef) {
      // Set cookie with 30 days expiry
      response.cookies.set('mmv_ref', refParam, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
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
