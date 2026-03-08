import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

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
  it('should normalize www domain to root domain and preserve path/query', () => {
    const request = createRequest('https://www.maemormimi.com/liff?ref=FRIEND123&from=line');
    const response = middleware(request);

    expect(response?.status).toBe(301);
    const location = response?.headers.get('location');
    expect(location).toBe('https://maemormimi.com/liff?ref=FRIEND123&from=line');
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
      expect(location).toContain(`liff.state=${encodeURIComponent(path)}`);
    });
  });

  it('should allow access to protected routes if session token exists', () => {
    const request = createRequest('/profile', {
      'mmv_auth.session_token': 'valid-token'
    });
    const response = middleware(request);
    
    // NextResponse.next() returns a 200/Ok or the original response structure
    // but in Vitest with Next.js mocks, we check if it's NOT a redirect
    expect(response?.status).not.toBe(307);
  });

  it('should allow access to protected routes if secure session token exists', () => {
    const request = createRequest('/history', {
      '__Secure-mmv_auth.session_token': 'valid-secure-token'
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

  it('should preserve original query in liff.state when redirecting protected route', () => {
    const request = createRequest('/history?tab=all&from=line');
    const response = middleware(request);

    expect(response?.status).toBe(307);
    const location = response?.headers.get('location');
    expect(location).toContain('/liff');
    expect(location).toContain('liff.state=%2Fhistory%3Ftab%3Dall%26from%3Dline');
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
