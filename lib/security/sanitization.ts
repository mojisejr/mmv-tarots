// Input Sanitization Implementation
// Phase 5: GREEN - Minimal implementation to make tests pass

import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Create a DOM window for DOMPurify
const window = new JSDOM('').window
const purify = DOMPurify(window)

export interface SanitizationOptions {
  allowHtml?: boolean
  maxLength?: number
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  removeSpecialChars?: boolean
  allowedSpecialChars?: string[]
  trim?: boolean
  normalizeUnicode?: boolean
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitizedValue?: string
}

export function sanitizeInput(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return ''
  }

  // Basic HTML escaping
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;') // Use numeric entity instead of hex
}

export function sanitizeHtml(
  input: string,
  options: SanitizationOptions = {}
): string {
  if (!input) {
    return ''
  }

  if (!options.allowHtml) {
    return sanitizeInput(input)
  }

  // DOMPurify configuration
  const config = {
    ALLOWED_TAGS: options.allowedTags || [],
    ALLOWED_ATTR: Object.values(options.allowedAttributes || {}).flat(),
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  }

  return purify.sanitize(input, config)
}

export function detectSqlInjection(input: string): boolean {
  if (!input) {
    return false
  }

  const sqlPatterns = [
    /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC)\b/i, // DDL/DML after semicolon
    /'\s*(OR|AND)\s*'\d*'\s*=\s*'\d*/i, // Numeric injection
    /'\s*(OR|AND)\s*'\w+'\s*=\s*'\w+/i, // String injection
    /'\s*(OR|AND)\s*1\s*=\s*1/i, // Always true condition
    /--\s*$/, // SQL comment at end
    /\/\*.*?\*\//, // SQL block comment
    /\b(ASCII|CHAR|CONCAT|STRING_AGG|LOAD_FILE)\s*\(/i, // Dangerous functions
    /UNION\s+SELECT/i, // UNION SELECT (allow regular SELECT with placeholders)
    /;\s*--/, // Semicolon followed by comment
    /(\x27\x27)/, // Double single quote
    /(%27%27)/i // URL encoded double single quote
  ]

  // Safe patterns that should not be flagged
  const safePatterns = [
    /\bSELECT\b.*\?/i, // SELECT with placeholder
    /\b(UPDATE|INSERT|DELETE)\b.*\?/i, // DML with placeholder
    /\bWHERE\b.*\?/i // WHERE with placeholder
  ]

  // Handle various encodings
  let decodedInput = input
  try {
    // URL decode
    decodedInput = decodeURIComponent(input)
    // HTML entity decode
    decodedInput = decodedInput.replace(/&#39;/g, "'")
    decodedInput = decodedInput.replace(/&#x27;/g, "'")
    decodedInput = decodedInput.replace(/&#34;/g, '"')
    decodedInput = decodedInput.replace(/&#x22;/g, '"')
  } catch {
    decodedInput = input
  }

  // Check if it matches safe patterns first (check original input)
  if (safePatterns.some(pattern => pattern.test(input))) {
    return false
  }

  // Check if it matches dangerous patterns
  return sqlPatterns.some(pattern =>
    pattern.test(input) || pattern.test(decodedInput)
  )
}

export function sanitizeString(
  input: string | null | undefined,
  options: {
    trim?: boolean
    maxLength?: number
    removeSpecialChars?: boolean
    allowedSpecialChars?: string[]
    normalizeUnicode?: boolean
  } = {}
): string {
  if (input === null || input === undefined) {
    return ''
  }

  let result = input

  // Trim whitespace
  if (options.trim) {
    result = result.trim()
  }

  // Remove special characters
  if (options.removeSpecialChars) {
    const allowedChars = options.allowedSpecialChars || []
    const pattern = new RegExp(
      `[^a-zA-Z0-9\\s${allowedChars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')}]`,
      'g'
    )
    result = result.replace(pattern, '')
  }

  // Normalize Unicode
  if (options.normalizeUnicode) {
    result = result.normalize('NFC')
  }

  // Enforce maximum length
  if (options.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength)
  }

  return result
}

export function validateInput(
  input: string,
  options: {
    type?: 'email' | 'phone' | 'url'
    pattern?: RegExp
    required?: boolean
    minLength?: number
    maxLength?: number
  } = {}
): ValidationResult {
  // Check required field
  if (options.required && (!input || input.trim() === '')) {
    return {
      isValid: false,
      error: 'This field is required'
    }
  }

  // Skip validation for empty non-required fields
  if (!input && !options.required) {
    return { isValid: true }
  }

  // Length validation
  if (options.minLength && input.length < options.minLength) {
    return {
      isValid: false,
      error: `Minimum length is ${options.minLength} characters`
    }
  }

  if (options.maxLength && input.length > options.maxLength) {
    return {
      isValid: false,
      error: `Maximum length is ${options.maxLength} characters`
    }
  }

  // Type-specific validation
  switch (options.type) {
    case 'email':
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(input)) {
        return {
          isValid: false,
          error: 'Invalid email format'
        }
      }
      break

    case 'phone':
      const phonePattern = /^[\+]?[1-9][\d]{3,14}$|^\(?[\d]{3}\)?[-\s]?[\d]{3}[-\s]?[\d]{4}$/
      if (!phonePattern.test(input.replace(/\D/g, ''))) {
        return {
          isValid: false,
          error: 'Invalid phone number format'
        }
      }
      break

    case 'url':
      try {
        const url = new URL(input)
        if (!['http:', 'https:'].includes(url.protocol)) {
          return {
            isValid: false,
            error: 'Only HTTP and HTTPS URLs are allowed'
          }
        }
      } catch {
        return {
          isValid: false,
          error: 'Invalid URL format'
        }
      }
      break
  }

  // Custom pattern validation
  if (options.pattern && !options.pattern.test(input)) {
    return {
      isValid: false,
      error: 'Input does not match required pattern'
    }
  }

  return { isValid: true }
}

// Comprehensive sanitization for user input
export function sanitizeUserInput(
  input: string,
  context: 'question' | 'comment' | 'general' = 'general'
): string {
  const baseOptions: SanitizationOptions = {
    allowHtml: false,
    trim: true,
    normalizeUnicode: true
  }

  const contextOptions = {
    question: {
      ...baseOptions,
      maxLength: 180,
      minLength: 8
    },
    comment: {
      ...baseOptions,
      maxLength: 500,
      minLength: 1
    },
    general: {
      ...baseOptions,
      maxLength: 1000
    }
  }

  const options = contextOptions[context]
  let sanitized = sanitizeString(input, options)

  // Additional XSS prevention
  sanitized = sanitizeInput(sanitized)

  // SQL injection detection
  if (detectSqlInjection(sanitized)) {
    throw new Error('Input contains potentially malicious content')
  }

  return sanitized
}

// Sanitize JSON objects
export function sanitizeJson(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson)
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = sanitizeJson(value)
    }
    return sanitized
  }

  return obj
}