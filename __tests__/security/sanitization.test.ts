// Phase 5: Input Sanitization Tests
// GREEN Phase - Testing actual implementation

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sanitizeInput,
  sanitizeHtml,
  detectSqlInjection,
  sanitizeString,
  validateInput,
  sanitizeUserInput,
  sanitizeJson,
  SanitizationOptions,
  ValidationResult
} from '../../lib/security/sanitization'

describe('Input Sanitization System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('XSS Prevention', () => {
    it('should remove script tags from input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World'
      const expectedOutput = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello World'

      const result = sanitizeHtml(maliciousInput, { allowHtml: false })
      expect(result).toBe(expectedOutput)
    })

    it('should escape HTML entities', () => {
      const maliciousInput = '<img src="x" onerror="alert(\'xss\')">'
      const expectedOutput = '&lt;img src=&quot;x&quot; onerror=&quot;alert(\'xss\')&quot;&gt;'

      const result = sanitizeInput(maliciousInput)
      expect(result).toBe(expectedOutput)
    })

    it('should handle javascript: protocol', () => {
      const maliciousInput = '<a href="javascript:alert(\'xss\')">Click me</a>'
      const result = sanitizeInput(maliciousInput)

      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('alert')
    })

    it('should handle data URIs', () => {
      const maliciousInput = '<img src="data:text/html,<script>alert(\'xss\')</script>">'
      const result = sanitizeInput(maliciousInput)

      expect(result).not.toContain('data:text/html')
      expect(result).not.toContain('<script>')
    })

    it('should preserve allowed HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>'
      const options: SanitizationOptions = {
        allowHtml: true,
        allowedTags: ['p', 'strong']
      }

      const result = sanitizeHtml(input, options)
      expect(result).toBe(input)
    })

    it('should remove disallowed HTML tags', () => {
      const input = '<p>Hello <script>alert("xss")</script> <strong>world</strong>!</p>'
      const options: SanitizationOptions = {
        allowHtml: true,
        allowedTags: ['p', 'strong']
      }

      const result = sanitizeHtml(input, options)
      expect(result).toBe('<p>Hello  <strong>world</strong>!</p>')
      expect(result).not.toContain('<script>')
    })

    it('should handle nested malicious content', () => {
      const maliciousInput = '<div><p><script>malicious()</script></p></div>Clean content'
      const result = sanitizeInput(maliciousInput)

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('malicious()')
      expect(result).toContain('Clean content')
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should detect SQL injection patterns', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET password='hacked'; --",
        "' UNION SELECT * FROM sensitive_data --",
        "'; INSERT INTO users (admin) VALUES (1); --"
      ]

      sqlInjectionAttempts.forEach(attempt => {
        const result = detectSqlInjection(attempt)
        expect(result).toBe(true)
      })
    })

    it('should allow safe SQL queries', () => {
      const safeQueries = [
        "SELECT * FROM users WHERE id = ?",
        "UPDATE users SET name = ? WHERE id = ?",
        "INSERT INTO logs (message) VALUES (?)"
      ]

      safeQueries.forEach(query => {
        const result = detectSqlInjection(query)
        expect(result).toBe(false)
      })
    })

    it('should handle case variations', () => {
      const variations = [
        "'; dRoP tAbLe users; --",
        "' OR '1'='1",
        "'; uNsEt users where 1=1; --"
      ]

      variations.forEach(variation => {
        const result = detectSqlInjection(variation)
        expect(result).toBe(true)
      })
    })

    it('should detect encoded SQL injection', () => {
      const encodedAttempts = [
        "%27%3B%20DROP%20TABLE%20users%3B%20--",
        "&#39; OR &#39;1&#39;=&#39;1",
        "';\\nDROP\\nTABLE\\nusers;--"
      ]

      encodedAttempts.forEach(attempt => {
        const result = detectSqlInjection(attempt)
        expect(result).toBe(true)
      })
    })
  })

  describe('String Sanitization', () => {
    it('should trim whitespace', () => {
      const input = '   Hello World   '
      const expectedOutput = 'Hello World'

      const result = sanitizeString(input, { trim: true })
      expect(result).toBe(expectedOutput)
    })

    it('should enforce maximum length', () => {
      const longInput = 'a'.repeat(1000)
      const maxLength = 100

      const result = sanitizeString(longInput, { maxLength })
      expect(result.length).toBeLessThanOrEqual(maxLength)
    })

    it('should remove special characters if specified', () => {
      const input = 'Hello@#$%^&*()World!'
      const options = {
        removeSpecialChars: true,
        allowedSpecialChars: ['!']
      }

      const result = sanitizeString(input, options)
      expect(result).toBe('HelloWorld!')
    })

    it('should normalize Unicode characters', () => {
      const inputs = [
        'café', // Normal form
        'cafe\u0301', // Decomposed form
      ]

      const results = inputs.map(input => sanitizeString(input, { normalizeUnicode: true }))

      // All should be normalized to NFC form
      expect(results[0]).toBe(results[1])
    })

    it('should handle null and undefined inputs', () => {
      expect(() => sanitizeString(null)).not.toThrow()
      expect(() => sanitizeString(undefined)).not.toThrow()
      expect(sanitizeString(null)).toBe('')
      expect(sanitizeString(undefined)).toBe('')
    })
  })

  describe('Input Validation', () => {
    it('should validate email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com'
      ]

      validEmails.forEach(email => {
        const result = validateInput(email, { type: 'email' })
        expect(result.isValid).toBe(true)
      })

      invalidEmails.forEach(email => {
        const result = validateInput(email, { type: 'email' })
        expect(result.isValid).toBe(false)
      })
    })

    it('should validate phone number formats', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890'
      ]

      const invalidPhones = [
        '123',
        'abc-def-ghij',
        '123-456-78901'
      ]

      validPhones.forEach(phone => {
        const result = validateInput(phone, { type: 'phone' })
        expect(result.isValid).toBe(true)
      })

      invalidPhones.forEach(phone => {
        const result = validateInput(phone, { type: 'phone' })
        expect(result.isValid).toBe(false)
      })
    })

    it('should validate URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://subdomain.example.co.uk/path'
      ]

      const invalidUrls = [
        'ftp://example.com',
        'javascript:alert("xss")',
        'not-a-url',
        'https://'
      ]

      validUrls.forEach(url => {
        const result = validateInput(url, { type: 'url' })
        expect(result.isValid).toBe(true)
      })

      invalidUrls.forEach(url => {
        const result = validateInput(url, { type: 'url' })
        expect(result.isValid).toBe(false)
      })
    })

    it('should validate custom patterns', () => {
      const customPattern = /^[A-Z]{3}-\d{4}$/ // ABC-1234

      const validInputs = ['ABC-1234', 'XYZ-9999']
      const invalidInputs = ['abc-1234', 'AB-1234', 'ABC-123', 'ABC-12345']

      validInputs.forEach(input => {
        const result = validateInput(input, { pattern: customPattern })
        expect(result.isValid).toBe(true)
      })

      invalidInputs.forEach(input => {
        const result = validateInput(input, { pattern: customPattern })
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('User Input Sanitization', () => {
    it('should sanitize question inputs', () => {
      const question = 'Will I find <script>alert("xss")</script> love this year?'
      const sanitized = sanitizeUserInput(question, 'question')

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).toContain('Will I find')
      expect(sanitized).toContain('love this year?')
    })

    it('should enforce length limits for questions', () => {
      const longQuestion = 'a'.repeat(200) + '?'
      const sanitized = sanitizeUserInput(longQuestion, 'question')

      expect(sanitized.length).toBeLessThanOrEqual(180)
    })

    it('should handle malicious content in general inputs', () => {
      const maliciousInput = "'; DROP TABLE users; --"

      expect(() => sanitizeUserInput(maliciousInput, 'general')).toThrow()
    })
  })

  describe('JSON Sanitization', () => {
    it('should sanitize JSON objects', () => {
      const obj = {
        name: '<script>alert("xss")</script>',
        description: 'Hello <b>world</b>',
        nested: {
          malicious: "'; DROP TABLE users; --"
        }
      }

      const sanitized = sanitizeJson(obj)

      expect(sanitized.name).not.toContain('<script>')
      expect(sanitized.description).not.toContain('<b>')
      expect(sanitized.nested.malicious).not.toContain('DROP TABLE')
    })

    it('should sanitize JSON arrays', () => {
      const arr = [
        '<script>alert("xss")</script>',
        'normal text',
        { nested: '<b>bold</b>' }
      ]

      const sanitized = sanitizeJson(arr)

      expect(sanitized[0]).not.toContain('<script>')
      expect(sanitized[1]).toBe('normal text')
      expect(sanitized[2].nested).not.toContain('<b>')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        '',
        '\0', // Null byte
        String.fromCharCode(0xD800), // Invalid Unicode surrogate
        '\uFEFF' // BOM
      ]

      malformedInputs.forEach(input => {
        expect(() => sanitizeInput(input)).not.toThrow()
        const result = sanitizeInput(input)
        expect(typeof result).toBe('string')
      })
    })

    it('should provide detailed error messages', () => {
      const validationResult = validateInput('', { type: 'email', required: true })

      expect(validationResult.isValid).toBe(false)
      expect(validationResult.error).toBeDefined()
      expect(validationResult.error).toContain('required')
    })
  })
})