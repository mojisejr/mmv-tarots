// Gatekeeper Agent
// Phase 4: GREEN - Database-backed prompts

import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import {
  getGatekeeperSystemPrompt,
  GATEKEEPER_USER_PROMPT_TEMPLATE
} from '@/lib/server/ai/prompts/gatekeeper'
import { parseAIResponse } from '@/lib/server/ai/utils/json-parser'

export interface GatekeeperResponse {
  approved: boolean
  reason: string
}

export async function gatekeeperAgent(
  question: string
): Promise<GatekeeperResponse> {
  try {
    const systemPrompt = await getGatekeeperSystemPrompt();

    const response = await generateText({
      model: google(process.env.MODEL_NAME || 'gemini-2.5-flash'),
      system: systemPrompt,
      prompt: GATEKEEPER_USER_PROMPT_TEMPLATE(question),
      temperature: 0.3
    })

    // Parse JSON response (handle markdown format from Gemini)
    const result = parseAIResponse(response.text) as GatekeeperResponse

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