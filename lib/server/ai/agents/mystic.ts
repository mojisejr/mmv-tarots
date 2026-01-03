// Mystic Agent
// Phase 4: GREEN - Database-backed prompts

import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import {
  getMysticSystemPrompt,
  MYSTIC_USER_PROMPT_TEMPLATE
} from '@/lib/server/ai/prompts/mystic'
import type { AnalystResponse } from '@/lib/server/ai/agents/analyst'
import { db } from '@/lib/server/db'
import { parseAIResponse } from '@/lib/server/ai/utils/json-parser'

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
  selectedCards?: number[]
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
  analysis: AnalystResponse
): Promise<MysticResponse> {
  try {
    const systemPrompt = await getMysticSystemPrompt();

    // Query database for available cards
    const availableCards = await db.card.findMany({
      select: {
        cardId: true,
        name: true,
        arcana: true
      }
    })

    if (!availableCards || availableCards.length === 0) {
      return {
        success: false,
        error: 'No cards available in database'
      }
    }

    // Use AI to select cards based on the question and analysis
    const cardSelectionResponse = await generateText({
      model: google(process.env.MODEL_NAME || 'gemini-2.5-flash'),
      system: `You are a Tarot Card Dealer AI. Select ${analysis.cardCount} unique tarot cards from the available database cards that best answer the user's question.

Available cards: ${JSON.stringify(availableCards)}

Return JSON format:
{
  "selectedCards": [cardId1, cardId2, cardId3]
}

Requirements:
- Select exactly ${analysis.cardCount} cards
- Cards must be unique (no duplicates)
- Choose cards that best match the question context
- Return card IDs as numbers`,
      prompt: `Question: "${question}"
Analysis: ${JSON.stringify(analysis)}

Select ${analysis.cardCount} cards that best answer this question.`,
      temperature: 0.7
    })

    // Parse card selection (handle markdown format from Gemini)
    const cardSelection = parseAIResponse(cardSelectionResponse.text)
    const selectedCards = cardSelection.selectedCards

    // Validate card selection
    if (!Array.isArray(selectedCards) || selectedCards.length !== analysis.cardCount) {
      throw new Error(`Invalid selectedCards format: expected ${analysis.cardCount} cards`)
    }

    // Validate card values (0-77 for complete tarot deck)
    for (const card of selectedCards) {
      if (typeof card !== 'number' || card < 0 || card > 77) {
        throw new Error(`Invalid card value: ${card}. Must be between 0-77.`)
      }
    }

    // Check for duplicates
    if (new Set(selectedCards).size !== selectedCards.length) {
      throw new Error('Duplicate cards selected')
    }

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
        displayName: true,
        arcana: true,
        keywords: true,
        shortMeaning: true,
        longMeaning: true,
        imageUrl: true
      }
    })

    if (!cardMetadata || cardMetadata.length === 0) {
      return {
        success: false,
        error: 'Card metadata not found in database'
      }
    }

    // Transform database metadata for AI prompt
    const transformedCardMetadata = cardMetadata.map(card => {
      let keywords: string[] = []
      if (Array.isArray(card.keywords)) {
        keywords = card.keywords.map(k => String(k))
      } else if (card.keywords) {
        keywords = [String(card.keywords)]
      }

      return {
        cardId: card.cardId,
        name: card.name,
        displayName: card.displayName,
        arcana: card.arcana,
        keywords,
        shortMeaning: card.shortMeaning || '',
        longMeaning: card.longMeaning || '',
        imageUrl: card.imageUrl || ''
      }
    })

    // Use AI to generate reading based on database metadata
    const response = await generateText({
      model: google(process.env.MODEL_NAME || 'gemini-2.5-flash'),
      system: systemPrompt,
      prompt: MYSTIC_USER_PROMPT_TEMPLATE(question, analysis, selectedCards, transformedCardMetadata),
      temperature: 0.8
    })

    // Parse JSON response (handle markdown format from Gemini)
    const result = parseAIResponse(response.text) as any

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

      // Transform keywords from JsonArray to string[]
      let keywords: string[] = []
      if (Array.isArray(cardData.keywords)) {
        keywords = cardData.keywords.map(k => String(k))
      } else if (cardData.keywords) {
        keywords = [String(cardData.keywords)]
      }

      return {
        position: index + 1,
        name_en: cardData.name,
        name_th: cardData.displayName || cardData.name,
        image: cardData.imageUrl || `cards/${cardData.arcana.toLowerCase()}/${cardId}.jpg`,
        arcana: cardData.arcana,
        keywords,
        interpretation: aiCardReading.interpretation || `Interpretation for ${cardData.name}`
      }
    })

    return {
      success: true,
      selectedCards,
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

    // Fallback: Generate basic reading with random cards
    try {
      // Generate random cards as fallback
      const fallbackCardCount = analysis.cardCount || 3
      const allCards = await db.card.findMany({
        select: {
          cardId: true,
          name: true,
          displayName: true,
          arcana: true,
          keywords: true,
          imageUrl: true
        }
      })

      if (!allCards || allCards.length === 0) {
        return {
          success: false,
          error: 'Failed to generate reading: No cards available in database'
        }
      }

      // Select random cards
      const shuffled = [...allCards].sort(() => 0.5 - Math.random())
      const selectedFallbackCards = shuffled.slice(0, fallbackCardCount).map(card => card.cardId)
      const cardMetadata = shuffled.slice(0, fallbackCardCount)

      const cardsReading: CardReading[] = selectedFallbackCards.map((cardId, index) => {
        const cardData = cardMetadata.find(card => card.cardId === cardId)
        if (!cardData) {
          throw new Error(`Card metadata not found for cardId: ${cardId}`)
        }

        // Transform keywords from JsonArray to string[]
      let keywords: string[] = []
      if (Array.isArray(cardData.keywords)) {
        keywords = cardData.keywords.map(k => String(k))
      } else if (cardData.keywords) {
        keywords = [String(cardData.keywords)]
      }

      return {
        position: index + 1,
        name_en: cardData.name,
        name_th: cardData.displayName || cardData.name,
        image: cardData.imageUrl || `cards/${cardData.arcana.toLowerCase()}/${cardId}.jpg`,
        arcana: cardData.arcana,
        keywords,
        interpretation: `การอ่านไพ่ ${cardData.displayName || cardData.name} สำหรับตำแหน่งที่ ${index + 1}`
      }
      })

      const cardNames = cardsReading.map(card => card.name_th).join(', ')

      return {
        success: true,
        selectedCards: selectedFallbackCards,
        reading: {
          header: 'สวัสดีค่ะ มาดูไพ่กัน',
          cards_reading: cardsReading,
          reading: `จากการสลาไพ่ทั้ง ${selectedFallbackCards.length} ใบ พบว่าอนาคตของคุณมีโอกาสดีๆ เข้ามา ควรใช้วิจารณญาณในการตัดสินใจและเปิดใจรับสิ่งใหม่ๆ`,
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