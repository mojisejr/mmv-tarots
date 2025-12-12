// Dealer Agent
// Phase 3: GREEN - Card selection implementation

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  DEALER_SYSTEM_PROMPT,
  DEALER_USER_PROMPT_TEMPLATE
} from '../prompts/dealer'
import { GuardianResponse } from './guardian'

export interface DealerResponse {
  selectedCards: number[]
  reasoning: string
  theme: string
  confidence: number
}

export async function dealerAgent(
  question: string,
  guardianContext: GuardianResponse
): Promise<DealerResponse> {
  try {
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: DEALER_SYSTEM_PROMPT,
      prompt: DEALER_USER_PROMPT_TEMPLATE(question, guardianContext),
      temperature: 0.7
    })

    // Parse JSON response
    const result = JSON.parse(response.text) as DealerResponse

    // Validate response structure
    if (!Array.isArray(result.selectedCards) || result.selectedCards.length !== 3) {
      throw new Error('Invalid selectedCards format')
    }

    // Validate card values (0-21 for Major Arcana)
    for (const card of result.selectedCards) {
      if (typeof card !== 'number' || card < 0 || card > 21) {
        throw new Error(`Invalid card value: ${card}`)
      }
    }

    // Check for duplicates
    if (new Set(result.selectedCards).size !== 3) {
      throw new Error('Duplicate cards selected')
    }

    if (typeof result.reasoning !== 'string') {
      throw new Error('Missing or invalid reasoning')
    }

    if (typeof result.theme !== 'string') {
      throw new Error('Missing or invalid theme')
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      throw new Error('Missing or invalid confidence score')
    }

    return result
  } catch (error) {
    console.error('Dealer agent error:', error)

    // Fallback: select random cards
    const cards = Array.from({ length: 22 }, (_, i) => i)
    const shuffled = cards.sort(() => Math.random() - 0.5)

    return {
      selectedCards: shuffled.slice(0, 3),
      reasoning: 'Standard card selection for general guidance',
      theme: 'general_guidance',
      confidence: 0.5
    }
  }
}