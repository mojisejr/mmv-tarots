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
  INVALID_JOB_ID: 'INVALID_JOB_ID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PREDICTION_NOT_FOUND: 'PREDICTION_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
} as const

export const createErrorResponse = (
  error: unknown,
  status: number = 500,
  includeTimestamp: boolean = true
) => {
  let errorData: ApiErrorData;

  if (error instanceof ApiError) {
    errorData = {
      code: error.code,
      message: error.message,
      details: error.details
    };
    // Adjust status code based on error code if needed
    if (error.code === ERROR_CODES.UNAUTHORIZED) status = 401;
    if (error.code === ERROR_CODES.PAYMENT_REQUIRED) status = 402;
    if (error.code === ERROR_CODES.INVALID_REQUEST) status = 400;
  } else if (error instanceof Error) {
    errorData = {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message
    };
  } else {
    errorData = {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unknown error occurred'
    };
  }

  const response: any = {
    error: {
      code: errorData.code,
      message: errorData.message
    }
  }

  if (errorData.details) {
    response.error.details = errorData.details
  }

  if (includeTimestamp) {
    response.timestamp = new Date().toISOString()
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}