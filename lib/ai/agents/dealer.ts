// Dealer Agent
// Phase 2: GREEN - Database integration for 78-card selection

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  DEALER_SYSTEM_PROMPT,
  DEALER_USER_PROMPT_TEMPLATE
} from '../prompts/dealer'
import { AnalystResponse } from '@/types/api'
import { db } from '@/lib/db'

export interface DealerResponse {
  success: boolean
  selectedCards?: number[]
  reasoning?: string
  theme?: string
  confidence?: number
  error?: string
}

export async function dealerAgent(
  question: string,
  analysis: AnalystResponse
): Promise<DealerResponse> {
  try {
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

    // Use AI to select cards based on the available database cards
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: DEALER_SYSTEM_PROMPT,
      prompt: DEALER_USER_PROMPT_TEMPLATE(question, analysis, availableCards),
      temperature: 0.7
    })

    // Parse JSON response
    const result = JSON.parse(response.text) as DealerResponse

    // Validate response structure
    if (!Array.isArray(result.selectedCards) || result.selectedCards.length !== analysis.card_count_recommendation) {
      throw new Error(`Invalid selectedCards format: expected ${analysis.card_count_recommendation} cards`)
    }

    // Validate card values (0-77 for complete tarot deck)
    for (const card of result.selectedCards) {
      if (typeof card !== 'number' || card < 0 || card > 77) {
        throw new Error(`Invalid card value: ${card}. Must be between 0-77.`)
      }
    }

    // Check for duplicates
    if (new Set(result.selectedCards).size !== result.selectedCards.length) {
      throw new Error('Duplicate cards selected')
    }

    // Validate other fields
    if (typeof result.reasoning !== 'string') {
      throw new Error('Missing or invalid reasoning')
    }

    if (typeof result.theme !== 'string') {
      throw new Error('Missing or invalid theme')
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('Missing or invalid confidence score')
    }

    return {
      success: true,
      selectedCards: result.selectedCards,
      reasoning: result.reasoning,
      theme: result.theme,
      confidence: result.confidence
    }

  } catch (error) {
    console.error('Dealer agent error:', error)

    // Fallback: select random cards from database
    try {
      const availableCards = await db.card.findMany({
        select: { cardId: true }
      })

      if (!availableCards || availableCards.length === 0) {
        return {
          success: false,
          error: 'Failed to select cards from database'
        }
      }

      // Fisher-Yates shuffle for unique card selection
      const cardIds = availableCards.map(card => card.cardId)
      const shuffled = [...cardIds].sort(() => Math.random() - 0.5)
      const cardCount = analysis.card_count_recommendation || 3

      return {
        success: true,
        selectedCards: shuffled.slice(0, cardCount),
        reasoning: 'Random card selection from database for guidance',
        theme: 'database_guidance',
        confidence: 0.5
      }

    } catch (fallbackError) {
      console.error('Dealer fallback error:', fallbackError)
      return {
        success: false,
        error: 'Failed to select cards from database'
      }
    }
  }
}