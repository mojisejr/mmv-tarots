// Guardian Agent (Combined Gatekeeper + Analyst)
// Phase 1: GREEN - Implementation for 3-agent pipeline

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  GUARDIAN_SYSTEM_PROMPT,
  GUARDIAN_USER_PROMPT_TEMPLATE
} from '../prompts/guardian'

export interface GuardianResponse {
  approved: boolean
  reason: string | null
  mood: 'hopeful' | 'confused' | 'concerned' | 'ambitious' | 'neutral' | 'curious'
  topic: 'love' | 'career' | 'health' | 'general' | 'harmful'
  period: 'past' | 'present' | 'near_future' | 'distant_future'
  context: string
}

export async function guardianAgent(
  question: string
): Promise<GuardianResponse> {
  try {
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: GUARDIAN_SYSTEM_PROMPT,
      prompt: GUARDIAN_USER_PROMPT_TEMPLATE(question),
      temperature: 0.4
    })

    // Parse JSON response
    const result = JSON.parse(response.text) as GuardianResponse

    // Validate response structure
    const requiredFields = ['approved', 'reason', 'mood', 'topic', 'period', 'context']
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing field: ${field}`)
      }
    }

    // Validate enum values
    const validMoods = ['hopeful', 'confused', 'concerned', 'ambitious', 'neutral', 'curious']
    const validTopics = ['love', 'career', 'health', 'general', 'harmful']
    const validPeriods = ['past', 'present', 'near_future', 'distant_future']

    if (!validMoods.includes(result.mood)) {
      throw new Error(`Invalid mood: ${result.mood}`)
    }
    if (!validTopics.includes(result.topic)) {
      throw new Error(`Invalid topic: ${result.topic}`)
    }
    if (!validPeriods.includes(result.period)) {
      throw new Error(`Invalid period: ${result.period}`)
    }

    return result
  } catch (error) {
    console.error('Guardian agent error:', error)

    // Fallback response
    return {
      approved: true,
      reason: null,
      mood: 'neutral',
      topic: 'general',
      period: 'present',
      context: 'General question seeking guidance'
    }
  }
}