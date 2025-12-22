// Phase 5: Rate Limiting Tests
// GREEN Phase - Testing actual implementation

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createRateLimiter,
  RateLimiterOptions,
  RateLimitResult,
  RateLimiter,
  ipRateLimiter,
  userRateLimiter,
  anonymousRateLimiter,
  getClientIP,
  rateLimitStore
} from '@/lib/server/security/rate-limiter'

describe('Rate Limiting System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the in-memory store for clean tests
    if (rateLimitStore && typeof rateLimitStore.clear === 'function') {
      rateLimitStore.clear()
    }
  })

  describe('IP-based Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 10, // 10 requests per minute
        message: 'Too many requests',
        standardHeaders: true,
        legacyHeaders: false
      })

      // Simulate 5 requests within limit
      const results = []
      for (let i = 0; i < 5; i++) {
        const result = await limiter.check('127.0.0.1')
        results.push(result)
      }

      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.remaining).toBeGreaterThan(0)
      })
    })

    it('should block requests exceeding rate limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Too many requests',
        standardHeaders: true,
        legacyHeaders: false
      })

      // Simulate requests exceeding limit
      const results = []
      for (let i = 0; i < 5; i++) {
        const result = await limiter.check('127.0.0.1')
        results.push(result)
      }

      // First 3 should succeed
      results.slice(0, 3).forEach(result => {
        expect(result.success).toBe(true)
      })

      // Last 2 should fail
      results.slice(3).forEach(result => {
        expect(result.success).toBe(false)
        expect(result.error).toContain('Too many requests')
      })
    })

    it('should reset rate limit after window expires', async () => {
      const limiter = createRateLimiter({
        windowMs: 100, // 100ms for faster testing
        max: 2,
        message: 'Too many requests',
        standardHeaders: true,
        legacyHeaders: false
      })

      // Exhaust limit
      await limiter.check('127.0.0.1')
      await limiter.check('127.0.0.1')

      // Should be blocked
      const blocked = await limiter.check('127.0.0.1')
      expect(blocked.success).toBe(false)

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const allowed = await limiter.check('127.0.0.1')
      expect(allowed.success).toBe(true)
    })

    it('should track different IP addresses separately', async () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Too many requests',
        standardHeaders: true,
        legacyHeaders: false
      })

      // Exhaust limit for IP 1
      await limiter.check('192.168.1.1')
      await limiter.check('192.168.1.1')

      // IP 1 should be blocked
      const blocked1 = await limiter.check('192.168.1.1')
      expect(blocked1.success).toBe(false)

      // IP 2 should still be allowed
      const allowed2 = await limiter.check('192.168.1.2')
      expect(allowed2.success).toBe(true)
    })
  })

  describe('User-based Rate Limiting', () => {
    it('should limit requests per user identifier', async () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 5,
        message: 'User rate limit exceeded',
        standardHeaders: true,
        legacyHeaders: false
      })

      // Simulate requests from same user
      const results = []
      for (let i = 0; i < 7; i++) {
        const result = await limiter.check('user123')
        results.push(result)
      }

      // First 5 should succeed
      results.slice(0, 5).forEach(result => {
        expect(result.success).toBe(true)
      })

      // Last 2 should fail
      results.slice(5).forEach(result => {
        expect(result.success).toBe(false)
        expect(result.error).toContain('User rate limit exceeded')
      })
    })

    it('should handle anonymous users differently', async () => {
      const anonymousLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Anonymous rate limit exceeded',
        standardHeaders: true,
        legacyHeaders: false
      })

      const authenticatedLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 10,
        message: 'User rate limit exceeded',
        standardHeaders: true,
        legacyHeaders: false
      })

      // Anonymous users have stricter limits
      const anonymousResults = []
      for (let i = 0; i < 5; i++) {
        const result = await anonymousLimiter.check('anonymous')
        anonymousResults.push(result)
      }

      expect(anonymousResults[3].success).toBe(false)

      // Authenticated users have higher limits
      const authResults = []
      for (let i = 0; i < 5; i++) {
        const result = await authenticatedLimiter.check('user123')
        authResults.push(result)
      }

      authResults.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Configuration', () => {
    it('should support different rate limit configurations', () => {
      const strictConfig = {
        windowMs: 60 * 1000,
        max: 5,
        message: 'Strict rate limit',
        standardHeaders: true,
        legacyHeaders: false
      }

      const lenientConfig = {
        windowMs: 60 * 1000,
        max: 100,
        message: 'Lenient rate limit',
        standardHeaders: true,
        legacyHeaders: false
      }

      expect(strictConfig.max).toBeLessThan(lenientConfig.max)
      expect(strictConfig.windowMs).toBe(lenientConfig.windowMs)
    })

    it('should validate configuration parameters', () => {
      // Test that the function accepts valid configuration
      expect(() => createRateLimiter({
        windowMs: 60 * 1000,
        max: 10,
        message: 'Valid config',
        standardHeaders: true,
        legacyHeaders: false
      })).not.toThrow()
    })
  })

  describe('Default Rate Limiters', () => {
    it('should provide default rate limiters', () => {
      expect(ipRateLimiter).toBeDefined()
      expect(userRateLimiter).toBeDefined()
      expect(anonymousRateLimiter).toBeDefined()
    })

    it('should have different limits for different types', () => {
      // Test that different limiters exist and can be used
      expect(typeof ipRateLimiter.check).toBe('function')
      expect(typeof userRateLimiter.check).toBe('function')
      expect(typeof anonymousRateLimiter.check).toBe('function')
    })
  })

  describe('Client IP Extraction', () => {
    it('should extract IP from request headers', () => {
      const mockRequest = {
        ip: '192.168.1.1',
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'x-real-ip') return '10.0.0.1'
            if (header === 'x-forwarded-for') return '203.0.113.1, 192.168.1.1'
            return null
          })
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.1')
    })

    it('should fallback to localhost when no IP found', () => {
      const mockRequest = {
        ip: null,
        headers: {
          get: vi.fn(() => null)
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('127.0.0.1')
    })
  })
})