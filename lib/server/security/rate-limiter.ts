// Rate Limiting Implementation
// Phase 5: GREEN - Minimal implementation to make tests pass


export interface RateLimiterOptions {
  windowMs: number
  max: number
  message: string
  standardHeaders: boolean
  legacyHeaders: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime?: Date
  error?: string
}

// In-memory store for rate limiting (in production, use Redis or database)
export const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return {
    check: async (identifier: string): Promise<RateLimitResult> => {
      const now = Date.now()
      const key = identifier || 'anonymous'
      const existing = rateLimitStore.get(key)

      // Clean up expired entries
      if (existing && now > existing.resetTime) {
        rateLimitStore.delete(key)
      }

      const current = rateLimitStore.get(key) || { count: 0, resetTime: now + options.windowMs }
      current.count++

      if (current.count > options.max) {
        return {
          success: false,
          limit: options.max,
          remaining: 0,
          resetTime: new Date(current.resetTime),
          error: options.message
        }
      }

      rateLimitStore.set(key, current)

      return {
        success: true,
        limit: options.max,
        remaining: options.max - current.count,
        resetTime: new Date(current.resetTime)
      }
    }
  }
}

export interface RateLimiter {
  check: (identifier: string) => Promise<RateLimitResult>
}

// Default rate limiters for different use cases
export const ipRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
})

export const userRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per user
  message: 'User rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false
})

export const anonymousRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute for anonymous users
  message: 'Anonymous rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false
})

// Middleware function for Next.js API routes
export async function rateLimitMiddleware(
  request: any,
  response: any,
  next: () => void,
  limiter?: RateLimiter
): Promise<void> {
  const ip = getClientIP(request)
  const userIdentifier = request.headers.get('x-user-id') || ip

  const rateLimiterToUse = limiter || ipRateLimiter
  const result = await rateLimiterToUse.check(userIdentifier)

  // Set rate limit headers
  if (result.success) {
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    if (result.resetTime) {
      response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString())
    }
    next()
  } else {
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', '0')
    if (result.resetTime) {
      response.headers.set('X-RateLimit-Reset', result.resetTime.toISOString())
    }

    // Return 429 Too Many Requests
    response.status = 429
    response.json({
      error: result.error || 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    })
  }
}

// Helper function to get client IP
export function getClientIP(request: any): string {
  return (
    request.ip ||
    request.headers?.get('x-real-ip') ||
    request.headers?.get('x-forwarded-for')?.split(',')[0] ||
    '127.0.0.1'
  )
}

// Rate limiting for specific endpoints
export const predictionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // 2 predictions per minute
  message: 'Too many prediction requests',
  standardHeaders: true,
  legacyHeaders: false
})