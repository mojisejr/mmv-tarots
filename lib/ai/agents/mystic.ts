// Mystic Agent
// Phase 2: GREEN - Database integration for 78-card reading generation

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  MYSTIC_SYSTEM_PROMPT,
  MYSTIC_USER_PROMPT_TEMPLATE
} from '../prompts/mystic'
import { AnalystResponse } from '@/types/api'
import { db } from '@/lib/db'

export interface CardReading {
  position: number
  name_en: string
  name_th: string
  image: string
  arcana: string
  keywords: string[]
  interpretation: string
}

export interface MysticResponse {
  success: boolean
  reading?: {
    header: string
    cards_reading: CardReading[]
    reading: string
    suggestions: string[]
    next_questions: string[]
    final_summary: string
    disclaimer: string
  }
  error?: string
}

export async function mysticAgent(
  question: string,
  analysis: AnalystResponse,
  selectedCards: number[]
): Promise<MysticResponse> {
  try {
    // Query database for selected card metadata
    const cardMetadata = await db.card.findMany({
      where: {
        cardId: {
          in: selectedCards
        }
      },
      select: {
        cardId: true,
        name: true,
        nameTh: true,
        arcana: true,
        keywords: true,
        meaningUp: true,
        meaningRev: true,
        imageUrl: true
      }
    })

    if (!cardMetadata || cardMetadata.length === 0) {
      return {
        success: false,
        error: 'Card metadata not found in database'
      }
    }

    // Use AI to generate reading based on database metadata
    const response = await generateText({
      model: openai('gpt-4o'),
      system: MYSTIC_SYSTEM_PROMPT,
      prompt: MYSTIC_USER_PROMPT_TEMPLATE(question, analysis, selectedCards, cardMetadata),
      temperature: 0.8
    })

    // Parse JSON response
    const result = JSON.parse(response.text) as any

    // Validate response structure
    if (!result.header || typeof result.header !== 'string') {
      throw new Error('Missing or invalid header')
    }

    if (!Array.isArray(result.cards_reading) || result.cards_reading.length !== selectedCards.length) {
      throw new Error(`Invalid cards_reading format: expected ${selectedCards.length} cards`)
    }

    if (!result.reading || typeof result.reading !== 'string') {
      throw new Error('Missing or invalid reading')
    }

    if (!Array.isArray(result.suggestions)) {
      throw new Error('Missing or invalid suggestions')
    }

    if (!Array.isArray(result.next_questions)) {
      throw new Error('Missing or invalid next_questions')
    }

    if (!result.final_summary || typeof result.final_summary !== 'string') {
      throw new Error('Missing or invalid final_summary')
    }

    if (!result.disclaimer || typeof result.disclaimer !== 'string') {
      throw new Error('Missing or invalid disclaimer')
    }

    // Create card readings with database metadata
    const cardsReading: CardReading[] = selectedCards.map((cardId, index) => {
      const cardData = cardMetadata.find(card => card.cardId === cardId)
      if (!cardData) {
        throw new Error(`Card metadata not found for cardId: ${cardId}`)
      }

      const aiCardReading = result.cards_reading[index] || {}

      return {
        position: index + 1,
        name_en: cardData.name,
        name_th: cardData.nameTh || cardData.name,
        image: cardData.imageUrl || `cards/${cardData.arcana.toLowerCase()}/${cardId}.jpg`,
        arcana: cardData.arcana,
        keywords: Array.isArray(cardData.keywords) ? cardData.keywords : [String(cardData.keywords)],
        interpretation: aiCardReading.interpretation || `Interpretation for ${cardData.name}`
      }
    })

    return {
      success: true,
      reading: {
        header: result.header,
        cards_reading: cardsReading,
        reading: result.reading,
        suggestions: result.suggestions,
        next_questions: result.next_questions,
        final_summary: result.final_summary,
        disclaimer: result.disclaimer
      }
    }

  } catch (error) {
    console.error('Mystic agent error:', error)

    // Fallback: Generate basic reading with database metadata
    try {
      const cardMetadata = await db.card.findMany({
        where: {
          cardId: {
            in: selectedCards
          }
        },
        select: {
          cardId: true,
          name: true,
          nameTh: true,
          arcana: true,
          keywords: true,
          imageUrl: true
        }
      })

      if (!cardMetadata || cardMetadata.length === 0) {
        return {
          success: false,
          error: 'Failed to generate reading: Card metadata not found in database'
        }
      }

      const cardsReading: CardReading[] = selectedCards.map((cardId, index) => {
        const cardData = cardMetadata.find(card => card.cardId === cardId)
        if (!cardData) {
          throw new Error(`Card metadata not found for cardId: ${cardId}`)
        }

        return {
          position: index + 1,
          name_en: cardData.name,
          name_th: cardData.nameTh || cardData.name,
          image: cardData.imageUrl || `cards/${cardData.arcana.toLowerCase()}/${cardId}.jpg`,
          arcana: cardData.arcana,
          keywords: Array.isArray(cardData.keywords) ? cardData.keywords : [String(cardData.keywords)],
          interpretation: `การอ่านไพ่ ${cardData.nameTh || cardData.name} สำหรับตำแหน่งที่ ${index + 1}`
        }
      })

      const cardNames = cardsReading.map(card => card.name_th).join(', ')

      return {
        success: true,
        reading: {
          header: 'สวัสดีค่ะ มาดูไพ่กัน',
          cards_reading: cardsReading,
          reading: `จากการสลาไพ่ทั้ง ${selectedCards.length} ใบ (${cardNames}) พบว่าอนาคตของคุณมีโอกาสดีๆ เข้ามา ควรใช้วิจารณญาณในการตัดสินใจและเปิดใจรับสิ่งใหม่ๆ`,
          suggestions: ['มั่นใจในตัวเอง', 'เปิดใจรับสิ่งใหม่', 'ใช้วิจารณญาณ'],
          next_questions: ['สิ่งที่คุณต้องการคืออะไร?', 'อุปสรรคที่พบคืออะไร?'],
          final_summary: 'อนาคตสดใสรออยู่ข้างหน้า',
          disclaimer: 'โปรดใช้วิจารณญาณในการตัดสินใจ การทำนายไพ่เป็นเพียงแนวทางเบื้องต้น'
        }
      }

    } catch (fallbackError) {
      console.error('Mystic fallback error:', fallbackError)
      return {
        success: false,
        error: `Failed to generate reading: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
      }
    }
  }
}