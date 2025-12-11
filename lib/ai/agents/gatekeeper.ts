// Gatekeeper Agent
// Phase 3: GREEN - Question validation implementation

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  GATEKEEPER_SYSTEM_PROMPT,
  GATEKEEPER_USER_PROMPT_TEMPLATE
} from '../prompts/gatekeeper'

export interface GatekeeperResponse {
  approved: boolean
  reason: string
}

export async function gatekeeperAgent(
  question: string
): Promise<GatekeeperResponse> {
  try {
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: GATEKEEPER_SYSTEM_PROMPT,
      prompt: GATEKEEPER_USER_PROMPT_TEMPLATE(question),
      temperature: 0.3
    })

    // Parse JSON response
    const result = JSON.parse(response.text) as GatekeeperResponse

    // Validate response structure
    if (typeof result.approved !== 'boolean' || typeof result.reason !== 'string') {
      throw new Error('Invalid gatekeeper response format')
    }

    return result
  } catch (error) {
    console.error('Gatekeeper agent error:', error)

    // Fail-safe: if uncertain, approve the question
    return {
      approved: true,
      reason: 'Auto-approved due to error'
    }
  }
}