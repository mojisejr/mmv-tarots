// Simple Synchronous Tarot Workflow
// For immediate curl testing without Vercel Workflow complexity

import { db } from '@/lib/server/db'
import { gatekeeperAgent } from '@/lib/server/ai/agents/gatekeeper'
import { analystAgent } from '@/lib/server/ai/agents/analyst'
import { mysticAgent } from '@/lib/server/ai/agents/mystic'

export interface SimpleTarotReadingParams {
  question: string
  userIdentifier?: string
  userId?: string | null
}

export interface SimpleTarotResult {
  success: boolean
  jobId: string
  status: 'COMPLETED' | 'FAILED'
  question: string
  result?: {
    selectedCards: number[]
    analysis: any
    reading: any
  }
  error?: string
  createdAt: Date
  completedAt?: Date
}

export async function runSimpleTarotWorkflow(
  params: SimpleTarotReadingParams
): Promise<SimpleTarotResult> {
  const { question, userIdentifier, userId } = params

  // Generate job ID (matching expected format: 9 chars)
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 11)
  const jobId = `job-${timestamp}-${randomId}`

  const startTime = new Date()

  try {
    // Create prediction record
    await db.prediction.create({
      data: {
        jobId,
        userIdentifier: userIdentifier || null,
        question,
        status: 'PROCESSING',
        createdAt: startTime
      }
    })

    // Step 1: Gatekeeper Agent
    const gatekeeperResult = await gatekeeperAgent(question)

    if (!gatekeeperResult.approved) {
      await db.prediction.updateMany({
        where: { jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      })

      return {
        success: false,
        jobId,
        status: 'FAILED',
        question,
        error: `Question rejected: ${gatekeeperResult.reason}`,
        createdAt: startTime,
        completedAt: new Date()
      }
    }

    // Step 2: Analyst Agent
    const analysisResult = await analystAgent(question)

    // Step 3: Mystic Agent (includes card selection)
    const finalReading = await mysticAgent(question, analysisResult)

    if (!finalReading.success || !finalReading.selectedCards) {
      await db.prediction.updateMany({
        where: { jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      })

      return {
        success: false,
        jobId,
        status: 'FAILED',
        question,
        error: finalReading.error || 'Failed to generate reading',
        createdAt: startTime,
        completedAt: new Date()
      }
    }

    // Save complete result
    const completedAt = new Date()
    await db.prediction.updateMany({
      where: { jobId },
      data: {
        status: 'COMPLETED',
        analysisResult: analysisResult as any,
        selectedCards: finalReading.selectedCards,
        finalReading: finalReading as any,
        completedAt
      }
    })

    return {
      success: true,
      jobId,
      status: 'COMPLETED',
      question,
      result: {
        selectedCards: finalReading.selectedCards,
        analysis: analysisResult,
        reading: finalReading.reading
      },
      createdAt: startTime,
      completedAt
    }

  } catch (error) {
    console.error('Simple tarot workflow error:', error)

    // Mark as failed
    try {
      await db.prediction.updateMany({
        where: { jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      })
    } catch (dbError) {
      console.error('Failed to update prediction status:', dbError)
    }

    return {
      success: false,
      jobId,
      status: 'FAILED',
      question,
      error: error instanceof Error ? error.message : 'Unknown error',
      createdAt: startTime,
      completedAt: new Date()
    }
  }
}