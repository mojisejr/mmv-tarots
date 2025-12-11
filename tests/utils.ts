// Test utilities for Phase 0
// Enhanced with TypeScript types - REFACTOR phase

import type { Card, Prediction } from '@prisma/client'

// API Types (from PRD)
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

export interface GetPredictResponse {
  jobId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  question: string
  result?: {
    selectedCards: number[]
    analysis?: {
      mood: string
      topic: string
      period: string
    }
    reading?: ReadingResult
  }
  createdAt: string
  completedAt?: string
}

// Mock utilities with proper typing
export const createMockResponse = <T = any>(
  data: T,
  status = 200
): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export const createMockJobId = (): string => {
  return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const mockCardData: Card = {
  id: 1,
  cardId: 0,
  name: 'The Fool',
  displayName: 'ไพ่คนโง่เผลอ',
  arcana: 'Major',
  shortMeaning: 'การเริ่มต้นใหม่',
  longMeaning: 'เป็นไพ่แห่งการเริ่มต้นใหม่...',
  keywords: ['new beginnings', 'innocence', 'spontaneity'],
  imageUrl: '/cards/major/00.jpg'
}

export const mockPredictionResponse: GetPredictResponse = {
  jobId: createMockJobId(),
  status: 'COMPLETED',
  question: 'อนาคตของฉันจะเป็นอย่างไร?',
  result: {
    selectedCards: [0, 15, 32],
    analysis: {
      mood: 'มีความหวัง',
      topic: 'การงาน',
      period: '6 เดือนข้างหน้า'
    },
    reading: {
      header: 'สวัสดีค่ะ มีมี่มาทำนายให้นะคะ',
      cards_reading: [
        {
          position: 1,
          name_en: 'The Fool',
          name_th: 'ไพ่คนโง่เผลอ',
          image: '/cards/major/00.jpg',
          keywords: ['ความสำเร็จ', 'ความสุข'],
          interpretation: 'ความหมายไพ่ใบนี้ในบริบทคำถาม...'
        },
        {
          position: 2,
          name_en: 'The Devil',
          name_th: 'ไพ่ซาตาน',
          image: '/cards/major/15.jpg',
          keywords: ['การพันธน์การ', 'วงล้อม'],
          interpretation: 'ความหมายไพ่ใบนี้ในบริบทคำถาม...'
        },
        {
          position: 3,
          name_en: 'The World',
          name_th: 'ไพ่โลก',
          image: '/cards/major/21.jpg',
          keywords: ['สำเร็จ', 'สมบูรณ์'],
          interpretation: 'ความหมายไพ่ใบนี้ในบริบทคำถาม...'
        }
      ],
      reading: 'จากไพ่ที่ได้ อนาคตของคุณ...',
      suggestions: [
        'ควรมองโอกาสใหม่ๆ',
        'หลีกเลี่ยงการตัดสินใจเร่งรีบ'
      ],
      next_questions: [
        'อุปสรรคใหญ่ที่ฉันต้องเผชิญคืออะไร?',
        'ควรทำอย่างไรเพื่อให้ประสบความสำเร็จ?'
      ],
      final_summary: 'คุณมีโอกาสสูงที่จะประสบความสำเร็จในช่วง 6 เดือนข้างหน้า',
      disclaimer: 'โปรดใช้วิจารณญาณในการอ่านนะคะ'
    }
  },
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString()
}

// Test helper functions
export const createTestRequest = (
  body: PostPredictRequest,
  method = 'POST'
): Request => {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }

  // Only add body for methods that support it
  if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
    options.body = JSON.stringify(body)
  }

  return new Request('http://localhost:3000/api/predict', options)
}