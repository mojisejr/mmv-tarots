// Analyst Agent
// Phase 3: GREEN - Context analysis implementation

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  ANALYST_SYSTEM_PROMPT,
  ANALYST_USER_PROMPT_TEMPLATE
} from '../prompts/analyst'

export interface AnalystResponse {
  mood: string
  topic: string
  period: string
  context: string
}

export async function analystAgent(
  question: string
): Promise<AnalystResponse> {
  try {
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: ANALYST_SYSTEM_PROMPT,
      prompt: ANALYST_USER_PROMPT_TEMPLATE(question),
      temperature: 0.5
    })

    // Parse JSON response
    const result = JSON.parse(response.text) as AnalystResponse

    // Validate response structure
    const requiredFields = ['mood', 'topic', 'period', 'context']
    for (const field of requiredFields) {
      if (typeof result[field as keyof AnalystResponse] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`)
      }
    }

    return result
  } catch (error) {
    console.error('Analyst agent error:', error)

    // Fallback analysis
    return {
      mood: 'neutral',
      topic: 'general',
      period: 'present',
      context: 'General question seeking guidance'
    }
  }
}