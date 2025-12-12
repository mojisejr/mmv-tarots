// API Type Definitions for Tarot Reading Application
// Based on PRD Section 6: Response Format

export interface PostPredictRequest {
  question: string
  userIdentifier?: string
}

export interface PostPredictResponse {
  jobId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  message: string
}

export interface CardReading {
  position: number
  name_en: string
  name_th: string
  image: string
  keywords: string[]
  interpretation: string
}

export interface ReadingResult {
  header: string
  cards_reading: CardReading[]
  reading: string
  suggestions: string[]
  next_questions: string[]
  final_summary: string
  disclaimer: string
}

export interface PredictionResult {
  selectedCards: number[]
  analysis?: {
    mood: string
    topic: string
    period: string
  }
  reading?: ReadingResult
}

export interface GetPredictResponse {
  jobId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  question: string
  result?: PredictionResult
  error?: {
    code: string
    message: string
  }
  createdAt: string
  completedAt?: string
}

// API Error Response
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

// Validation schemas
export const POST_PREDICT_SCHEMA = {
  question: {
    type: 'string',
    minLength: 8,
    maxLength: 180,
    required: true
  },
  userIdentifier: {
    type: 'string',
    optional: true
  }
} as const

export const JOB_ID_REGEX = /^job-\d+-[a-z0-9]{9}$/