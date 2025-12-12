// Security Headers Implementation
// Phase 5: GREEN - Minimal implementation to make tests pass

import { NextRequest, NextResponse } from 'next/server'

export interface ContentSecurityPolicy {
  directives: Record<string, string[]>
  reportOnly?: boolean
}

export interface HstsConfig {
  maxAge: number
  includeSubDomains?: boolean
  preload?: boolean
}

export interface ReferrerPolicy {
  policy: 'no-referrer' | 'no-referrer-when-downgrade' | 'strict-origin-when-cross-origin'
}

export interface SecurityHeadersConfig {
  csp?: ContentSecurityPolicy
  hsts?: HstsConfig
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
  contentTypeOptions?: boolean
  referrerPolicy?: ReferrerPolicy
  permissionsPolicy?: Record<string, boolean[]>
}

export function getSecurityHeaders(config?: SecurityHeadersConfig): Record<string, string> {
  const headers: Record<string, string> = {}
  const isProduction = process.env.NODE_ENV === 'production'

  // Content Security Policy
  if (config?.csp) {
    const cspHeader = config.csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
    const cspValue = Object.entries(config.csp.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ')

    headers[cspHeader] = cspValue

    // Warn about unsafe directives in production
    if (isProduction) {
      const scriptSrc = config.csp.directives['script-src']
      if (scriptSrc && scriptSrc.includes("'unsafe-inline'")) {
        console.warn('Security Warning: CSP includes unsafe-inline in script-src directive')
      }
    }
  } else {
    // Default CSP
    const defaultCsp = {
      'default-src': ["'self'"],
      'script-src': isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'https://api.openai.com', 'https://gateway.ai.cloudflare.com'],
      'frame-ancestors': ["'none'"]
    }

    headers['Content-Security-Policy'] = Object.entries(defaultCsp)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ')
  }

  // HTTP Strict Transport Security (only in production with HTTPS)
  if (isProduction && config?.hsts) {
    const hstsParts = [`max-age=${config.hsts.maxAge}`]

    if (config.hsts.includeSubDomains) {
      hstsParts.push('includeSubDomains')
    }

    if (config.hsts.preload) {
      hstsParts.push('preload')
    }

    headers['Strict-Transport-Security'] = hstsParts.join('; ')
  }

  // X-Frame-Options
  if (config?.frameOptions) {
    if (config.frameOptions === 'ALLOW-FROM') {
      headers['X-Frame-Options'] = 'DENY' // ALLOW-FROM is deprecated, use DENY instead
    } else {
      headers['X-Frame-Options'] = config.frameOptions
    }
  } else {
    headers['X-Frame-Options'] = 'DENY'
  }

  // X-Content-Type-Options
  if (config?.contentTypeOptions !== false) {
    headers['X-Content-Type-Options'] = 'nosniff'
  }

  // X-XSS-Protection
  headers['X-XSS-Protection'] = '1; mode=block'

  // Referrer Policy
  if (config?.referrerPolicy) {
    headers['Referrer-Policy'] = config.referrerPolicy.policy
  } else {
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
  }

  // Permissions Policy
  if (config?.permissionsPolicy) {
    const permissions = Object.entries(config.permissionsPolicy)
      .map(([feature, origins]) => {
        if (origins.length === 0) {
          return `${feature}=()`
        }
        return `${feature}=(${origins.join(' ')})`
      })
      .join(', ')

    headers['Permissions-Policy'] = permissions
  }

  // Additional security headers
  headers['X-DNS-Prefetch-Control'] = 'off'
  headers['X-Download-Options'] = 'noopen'
  headers['X-Permitted-Cross-Domain-Policies'] = 'none'
  headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
  headers['Cross-Origin-Opener-Policy'] = 'same-origin'

  return headers
}

export function createCspDirective(directive: string, sources: string[]): string {
  return `${directive} ${sources.join(' ')}`
}

export function validateCsp(directives: Record<string, string[]>): boolean {
  const validDirectives = [
    'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
    'connect-src', 'media-src', 'object-src', 'child-src', 'frame-src',
    'worker-src', 'manifest-src', 'prefetch-src', 'base-uri',
    'form-action', 'frame-ancestors', 'navigate-to', 'report-uri',
    'report-to', 'block-all-mixed-content', 'upgrade-insecure-requests'
  ]

  // Check for invalid directives
  for (const directive of Object.keys(directives)) {
    if (!validDirectives.includes(directive)) {
      return false
    }
  }

  // Check for unsafe sources
  const scriptSrc = directives['script-src'] || []
  if (scriptSrc.includes('javascript:') || scriptSrc.includes('data:')) {
    return false
  }

  return true
}

export function applySecurityHeaders(response: NextResponse, config?: SecurityHeadersConfig): void {
  const headers = getSecurityHeaders(config)

  // Only set headers if they don't already exist
  for (const [header, value] of Object.entries(headers)) {
    if (!response.headers.get(header)) {
      response.headers.set(header, value)
    }
  }
}

export async function securityMiddleware(
  request: NextRequest,
  response: NextResponse,
  next: () => void
): Promise<void> {
  // Apply security headers
  const headers = getSecurityHeaders()

  for (const [header, value] of Object.entries(headers)) {
    response.headers.set(header, value)
  }

  // Continue to next middleware
  next()
}

// Validate security configuration
export function validateSecurityConfig(config: SecurityHeadersConfig): void {
  // Validate HSTS configuration
  if (config.hsts) {
    if (config.hsts.maxAge < 0) {
      throw new Error('Invalid security header configuration: HSTS maxAge must be positive')
    }
  }

  // Validate frame options
  if (config.frameOptions && !['DENY', 'SAMEORIGIN', 'ALLOW-FROM'].includes(config.frameOptions)) {
    throw new Error('Invalid security header configuration: Invalid frameOptions value')
  }

  // Validate referrer policy
  if (config.referrerPolicy &&
      !['no-referrer', 'no-referrer-when-downgrade', 'strict-origin-when-cross-origin'].includes(config.referrerPolicy.policy)) {
    throw new Error('Invalid security header configuration: Invalid referrer policy')
  }

  // Validate CSP
  if (config.csp && !validateCsp(config.csp.directives)) {
    throw new Error('Invalid security header configuration: Invalid CSP directives')
  }
}

// Default configurations for different environments
export const defaultSecurityConfig: SecurityHeadersConfig = {
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  permissionsPolicy: {
    'geolocation': [],
    'camera': [],
    'microphone': [],
    'payment': []
  }
}

export const developmentSecurityConfig: SecurityHeadersConfig = {
  ...defaultSecurityConfig,
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'ws:', 'wss:']
    }
  }
}

export const productionSecurityConfig: SecurityHeadersConfig = {
  ...defaultSecurityConfig,
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://api.openai.com', 'https://gateway.ai.cloudflare.com'],
      'frame-ancestors': ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}