// Validation schemas and utilities for API

import type { PostPredictRequest } from '@/types/api'

export interface ValidationError {
  field: string
  message: string
}

export function validatePostPredictRequest(body: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  // Check if body is an object
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    errors.push({
      field: 'body',
      message: 'Request body must be a valid object'
    })
    return errors
  }

  const data = body as PostPredictRequest

  // Validate question field
  if (!data.question) {
    errors.push({
      field: 'question',
      message: 'Question is required'
    })
  } else if (typeof data.question !== 'string') {
    errors.push({
      field: 'question',
      message: 'Question must be a string'
    })
  } else {
    const question = data.question.trim()
    if (question.length < 8) {
      errors.push({
        field: 'question',
        message: 'Question must be at least 8 characters long'
      })
    }
    if (question.length > 180) {
      errors.push({
        field: 'question',
        message: 'Question must not exceed 180 characters'
      })
    }
    if (question !== data.question) {
      errors.push({
        field: 'question',
        message: 'Question cannot be empty or whitespace only'
      })
    }
  }

  // Validate userIdentifier (optional)
  if (data.userIdentifier !== undefined) {
    if (typeof data.userIdentifier !== 'string') {
      errors.push({
        field: 'userIdentifier',
        message: 'User identifier must be a string'
      })
    } else if (data.userIdentifier.trim().length === 0) {
      errors.push({
        field: 'userIdentifier',
        message: 'User identifier cannot be empty'
      })
    }
  }

  return errors
}