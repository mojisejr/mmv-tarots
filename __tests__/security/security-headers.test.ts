// Phase 5: Security Headers Tests
// GREEN Phase - Testing actual implementation

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getSecurityHeaders,
  applySecurityHeaders,
  securityMiddleware,
  validateCsp,
  createCspDirective,
  validateSecurityConfig,
  defaultSecurityConfig,
  developmentSecurityConfig,
  productionSecurityConfig,
  SecurityHeadersConfig,
  ContentSecurityPolicy,
  HstsConfig,
  ReferrerPolicy
} from '../../lib/security/security-headers'
import { NextRequest, NextResponse } from 'next/server'

describe('Security Headers System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment to development
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
  })

  describe('Content Security Policy (CSP)', () => {
    it('should generate default CSP headers', () => {
      const expectedDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        'img-src \'self\' data: https:',
        "font-src 'self' data:",
        "connect-src 'self' https://api.openai.com https://gateway.ai.cloudflare.com",
        "frame-ancestors 'none'"
      ]

      const headers = getSecurityHeaders()

      expect(headers).toHaveProperty('Content-Security-Policy')

      expectedDirectives.forEach(directive => {
        expect(headers['Content-Security-Policy']).toContain(directive)
      })
    })

    it('should support custom CSP configuration', () => {
      const config: SecurityHeadersConfig = {
        csp: {
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", 'https://trusted.cdn.com']
          }
        }
      }

      const headers = getSecurityHeaders(config)

      expect(headers).toHaveProperty('Content-Security-Policy')
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
      expect(headers['Content-Security-Policy']).toContain("script-src 'self' https://trusted.cdn.com")
    })

    it('should support CSP report-only mode', () => {
      const config: SecurityHeadersConfig = {
        csp: {
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'"]
          },
          reportOnly: true
        }
      }

      const headers = getSecurityHeaders(config)

      expect(headers).toHaveProperty('Content-Security-Policy-Report-Only')
      expect(headers).not.toHaveProperty('Content-Security-Policy')
    })

    it('should validate CSP directives', () => {
      const validDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://trusted.cdn.com'],
        'style-src': ["'self'", "'unsafe-inline'"]
      }

      const invalidDirectives = {
        'script-src': ["'unsafe-inline'", "'unsafe-eval'", 'javascript:alert(1)']
      }

      expect(validateCsp(validDirectives)).toBe(true)
      expect(validateCsp(invalidDirectives)).toBe(false)
    })

    it('should create CSP directive correctly', () => {
      const directive = createCspDirective('script-src', ["'self'", "'unsafe-inline'"])

      expect(directive).toBe("script-src 'self' 'unsafe-inline'")
    })
  })

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should not set HSTS in development', () => {
      process.env.NODE_ENV = 'development'

      const headers = getSecurityHeaders({
        hsts: {
          maxAge: 31536000
        }
      })

      expect(headers).not.toHaveProperty('Strict-Transport-Security')
    })

    it('should set HSTS in production', () => {
      process.env.NODE_ENV = 'production'

      const config: SecurityHeadersConfig = {
        hsts: {
          maxAge: 31536000
        }
      }

      const headers = getSecurityHeaders(config)
      expect(headers).toHaveProperty('Strict-Transport-Security')
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000')
    })

    it('should include subdomains in HSTS', () => {
      process.env.NODE_ENV = 'production'

      const config: SecurityHeadersConfig = {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true
        }
      }

      const headers = getSecurityHeaders(config)
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
      expect(headers['Strict-Transport-Security']).toContain('includeSubDomains')
    })

    it('should include preload in HSTS', () => {
      process.env.NODE_ENV = 'production'

      const config: SecurityHeadersConfig = {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      }

      const headers = getSecurityHeaders(config)
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
      expect(headers['Strict-Transport-Security']).toContain('includeSubDomains')
      expect(headers['Strict-Transport-Security']).toContain('preload')
    })
  })

  describe('X-Frame-Options', () => {
    it('should set X-Frame-Options to DENY by default', () => {
      const headers = getSecurityHeaders({
        frameOptions: 'DENY'
      })

      expect(headers).toHaveProperty('X-Frame-Options', 'DENY')
    })

    it('should support SAMEORIGIN option', () => {
      const headers = getSecurityHeaders({
        frameOptions: 'SAMEORIGIN'
      })

      expect(headers).toHaveProperty('X-Frame-Options', 'SAMEORIGIN')
    })

    it('should handle ALLOW-FROM option', () => {
      const headers = getSecurityHeaders({
        frameOptions: 'ALLOW-FROM'
      })

      expect(headers).toHaveProperty('X-Frame-Options', 'DENY') // ALLOW-FROM is deprecated
    })
  })

  describe('X-Content-Type-Options', () => {
    it('should set X-Content-Type-Options to nosniff by default', () => {
      const headers = getSecurityHeaders({
        contentTypeOptions: true
      })

      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff')
    })

    it('should not set header when disabled', () => {
      const headers = getSecurityHeaders({
        contentTypeOptions: false
      })

      expect(headers).not.toHaveProperty('X-Content-Type-Options')
    })
  })

  describe('X-XSS-Protection', () => {
    it('should set X-XSS-Protection header', () => {
      const headers = getSecurityHeaders({})

      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block')
    })
  })

  describe('Referrer Policy', () => {
    it('should set referrer policy', () => {
      const config: SecurityHeadersConfig = {
        referrerPolicy: {
          policy: 'strict-origin-when-cross-origin'
        }
      }

      const headers = getSecurityHeaders(config)
      expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin')
    })

    it('should support different referrer policies', () => {
      const policies = [
        'no-referrer',
        'no-referrer-when-downgrade',
        'strict-origin-when-cross-origin'
      ] as const

      policies.forEach(policy => {
        const headers = getSecurityHeaders({
          referrerPolicy: { policy }
        })
        expect(headers).toHaveProperty('Referrer-Policy', policy)
      })
    })
  })

  describe('Permissions Policy', () => {
    it('should set permissions policy', () => {
      const config: SecurityHeadersConfig = {
        permissionsPolicy: {
          'geolocation': [],
          'camera': [],
          'microphone': [],
          'payment': []
        }
      }

      const headers = getSecurityHeaders(config)
      expect(headers).toHaveProperty('Permissions-Policy')
      expect(headers['Permissions-Policy']).toContain('geolocation=()')
      expect(headers['Permissions-Policy']).toContain('camera=()')
      expect(headers['Permissions-Policy']).toContain('microphone=()')
      expect(headers['Permissions-Policy']).toContain('payment=()')
    })

    it('should allow specific origins for permissions', () => {
      const config: SecurityHeadersConfig = {
        permissionsPolicy: {
          'geolocation': ['self', 'https://trusted.example.com']
        }
      }

      const headers = getSecurityHeaders(config)
      expect(headers['Permissions-Policy']).toContain('geolocation=(self "https://trusted.example.com")')
    })
  })

  describe('Security Middleware', () => {
    it('should apply all security headers to response', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
        },
        url: '/api/test',
        ip: '127.0.0.1'
      } as NextRequest

      const mockResponse = {
        headers: {
          set: vi.fn(),
          get: vi.fn()
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextResponse

      let nextCalled = false
      const mockNext = () => {
        nextCalled = true
      }

      await securityMiddleware(mockRequest, mockResponse, mockNext)

      // Should set multiple security headers
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Content-Security-Policy', expect.any(String))
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Frame-Options', expect.any(String))
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Content-Type-Options', expect.any(String))
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-XSS-Protection', expect.any(String))
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Referrer-Policy', expect.any(String))

      // Should call next()
      expect(nextCalled).toBe(true)
    })
  })

  describe('Header Validation', () => {
    it('should validate security configuration', () => {
      const validConfig: SecurityHeadersConfig = {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true
        },
        frameOptions: 'DENY',
        referrerPolicy: {
          policy: 'strict-origin-when-cross-origin'
        }
      }

      expect(() => validateSecurityConfig(validConfig)).not.toThrow()
    })

    it('should throw error for invalid HSTS configuration', () => {
      const invalidConfig = {
        hsts: {
          maxAge: -1 // Negative max age
        }
      }

      expect(() => validateSecurityConfig(invalidConfig as SecurityHeadersConfig))
        .toThrow('Invalid security header configuration: HSTS maxAge must be positive')
    })

    it('should throw error for invalid frame options', () => {
      const invalidConfig = {
        frameOptions: 'INVALID' as any
      }

      expect(() => validateSecurityConfig(invalidConfig as SecurityHeadersConfig))
        .toThrow('Invalid security header configuration: Invalid frameOptions value')
    })

    it('should throw error for invalid referrer policy', () => {
      const invalidConfig = {
        referrerPolicy: {
          policy: 'invalid-policy' as any
        }
      }

      expect(() => validateSecurityConfig(invalidConfig as SecurityHeadersConfig))
        .toThrow('Invalid security header configuration: Invalid referrer policy')
    })
  })

  describe('Environment-specific Configuration', () => {
    it('should provide default configurations', () => {
      expect(defaultSecurityConfig).toBeDefined()
      expect(developmentSecurityConfig).toBeDefined()
      expect(productionSecurityConfig).toBeDefined()
    })

    it('should have different CSP for development and production', () => {
      // Development
      process.env.NODE_ENV = 'development'
      const devHeaders = getSecurityHeaders(developmentSecurityConfig)

      // Production
      process.env.NODE_ENV = 'production'
      const prodHeaders = getSecurityHeaders(productionSecurityConfig)

      // Production should have stricter CSP
      expect(devHeaders['Content-Security-Policy']).toContain("'unsafe-inline'")
      expect(prodHeaders['Content-Security-Policy']).not.toContain("'unsafe-inline'")
    })
  })

  describe('Additional Security Headers', () => {
    it('should include additional security headers', () => {
      const headers = getSecurityHeaders()

      expect(headers).toHaveProperty('X-DNS-Prefetch-Control', 'off')
      expect(headers).toHaveProperty('X-Download-Options', 'noopen')
      expect(headers).toHaveProperty('X-Permitted-Cross-Domain-Policies', 'none')
      expect(headers).toHaveProperty('Cross-Origin-Embedder-Policy', 'require-corp')
      expect(headers).toHaveProperty('Cross-Origin-Opener-Policy', 'same-origin')
    })
  })

  describe('Performance', () => {
    it('should generate headers quickly', () => {
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        getSecurityHeaders()
      }

      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(500) // Should be very fast
    })
  })
})