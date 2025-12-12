// Analyst Agent
// Phase 3: GREEN - Context analysis implementation

import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import {
  ANALYST_SYSTEM_PROMPT,
  ANALYST_USER_PROMPT_TEMPLATE
} from '../prompts/analyst'
import { parseAIResponse } from '../utils/json-parser'

export interface AnalystResponse {
  mood: string
  topic: string
  period: string
  context: string
  cardCount: 3 | 5
}

export async function analystAgent(
  question: string
): Promise<AnalystResponse> {
  try {
    const response = await generateText({
      model: google(process.env.MODEL_NAME || 'gemini-2.5-flash'),
      system: ANALYST_SYSTEM_PROMPT,
      prompt: ANALYST_USER_PROMPT_TEMPLATE(question),
      temperature: 0.5
    })

    // Parse JSON response (handle markdown format from Gemini)
    const result = parseAIResponse(response.text) as AnalystResponse

    // Validate response structure
    const requiredFields = ['mood', 'topic', 'period', 'context']
    for (const field of requiredFields) {
      if (typeof result[field as keyof AnalystResponse] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`)
      }
    }

    // Validate cardCount
    if (typeof result.cardCount !== 'number' ||
        ![3, 5].includes(result.cardCount)) {
      result.cardCount = 3 // default fallback
    }

    return result
  } catch (error) {
    console.error('Analyst agent error:', error)

    // Fallback analysis
    return {
      mood: 'neutral',
      topic: 'general',
      period: 'present',
      context: 'General question seeking guidance',
      cardCount: 3
    }
  }
}