import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { getCookies } from 'better-auth/cookies';
import { middleware } from '../middleware';
import { auth } from '@/lib/server/auth';

const authCookies = getCookies(auth.options);
const sessionCookieName = authCookies.sessionToken.name;
const secureSessionCookieName = `__Secure-${sessionCookieName}`;

// Helper to create a request
function createRequest(url: string, cookies: Record<string, string> = {}) {
  const resolvedUrl = /^https?:\/\//i.test(url)
    ? url
    : new URL(url, 'http://localhost:3000').toString();
  const request = new NextRequest(resolvedUrl);
  Object.entries(cookies).forEach(([name, value]) => {
    request.cookies.set(name, value);
  });
  return request;
}

describe('Middleware Auth Enforcer', () => {
  it('should leave www-domain normalization to infrastructure-level redirects', () => {
    const request = createRequest('https://www.maemormimi.com/liff?ref=FRIEND123&from=line');
    const response = middleware(request);

    // App middleware should not issue host normalization redirects.
    expect(response?.status).not.toBe(301);
    expect(response?.headers.get('location')).toBeNull();
  });

  it('should redirect unprotected access to protected routes to /liff', () => {
    const protectedPaths = ['/profile', '/history', '/package', '/submitted'];
    
    protectedPaths.forEach(path => {
      const request = createRequest(path);
      const response = middleware(request);
      
      expect(response).toBeDefined();
      expect(response?.status).toBe(307); // NextResponse.redirect uses 307 by default
      const location = response?.headers.get('location');
      expect(location).toContain('/liff');
      expect(location).toContain(`mmv_next=${encodeURIComponent(path)}`);
    });
  });

  it('should allow access to protected routes if session token exists', () => {
    const request = createRequest('/profile', {
      [sessionCookieName]: 'valid-token'
    });
    const response = middleware(request);
    
    // NextResponse.next() returns a 200/Ok or the original response structure
    // but in Vitest with Next.js mocks, we check if it's NOT a redirect
    expect(response?.status).not.toBe(307);
  });

  it('should allow access to protected routes if secure session token exists', () => {
    const request = createRequest('/history', {
      [secureSessionCookieName]: 'valid-secure-token'
    });
    const response = middleware(request);
    
    expect(response?.status).not.toBe(307);
  });

  it('should allow access to public routes without session', () => {
    const publicPaths = ['/', '/about', '/tarot-reading'];
    
    publicPaths.forEach(path => {
      const request = createRequest(path);
      const response = middleware(request);
      
      expect(response?.status).not.toBe(307);
    });
  });

  it('should capture and set mmv_ref cookie from query param', () => {
    const request = createRequest('/?ref=FRIEND123');
    const response = middleware(request);
    
    // NextResponse.next() response should have the set-cookie header
    const cookies = response?.cookies;
    const refCookie = cookies?.get('mmv_ref');
    expect(refCookie?.value).toBe('FRIEND123');
  });

  it('should preserve original query in mmv_next when redirecting protected route', () => {
    const request = createRequest('/history?tab=all&from=line');
    const response = middleware(request);

    expect(response?.status).toBe(307);
    const location = response?.headers.get('location');
    expect(location).toContain('/liff');
    expect(location).toContain('mmv_next=%2Fhistory%3Ftab%3Dall%26from%3Dline');
  });

  it('should allow /liff route without redirect loop even when session is missing', () => {
    const request = createRequest('/liff?mmv_next=%2Fprofile');
    const response = middleware(request);

    expect(response?.status).not.toBe(307);
    expect(response?.headers.get('location')).toBeNull();
  });

  it('should keep first-touch referral cookie when mmv_ref already exists', () => {
    const request = createRequest('/?ref=NEWCODE', {
      mmv_ref: 'EXISTINGCODE',
    });
    const response = middleware(request);

    const refCookie = response?.cookies.get('mmv_ref');
    expect(refCookie).toBeUndefined();
  });
});
