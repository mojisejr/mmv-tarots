// Error utilities for API responses

export interface ApiErrorData {
  code: string
  message: string
  details?: any
}

export class ApiError extends Error {
  public readonly code: string
  public readonly details?: any

  constructor(error: ApiErrorData) {
    super(error.message)
    this.name = 'ApiError'
    this.code = error.code
    this.details = error.details
  }
}

export const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_JSON: 'INVALID_JSON',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

export const createErrorResponse = (
  error: ApiErrorData,
  status: number = 500,
  includeTimestamp: boolean = true
) => {
  const response: any = {
    error: {
      code: error.code,
      message: error.message
    }
  }

  if (error.details) {
    response.error.details = error.details
  }

  if (includeTimestamp) {
    response.timestamp = new Date().toISOString()
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}