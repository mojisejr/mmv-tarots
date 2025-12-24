// Vercel Workflow for Tarot Reading AI Pipeline
// Phase 4: REFACTOR - Improved implementation for better performance

import { PredictionService } from './prediction-service'
import { CreditService } from './credit-service'
import { gatekeeperAgent } from '@/lib/server/ai/agents/gatekeeper'
import { analystAgent } from '@/lib/server/ai/agents/analyst'
import type { AnalystResponse } from '@/lib/server/ai/agents/analyst'
import { mysticAgent } from '@/lib/server/ai/agents/mystic'

export interface StartWorkflowParams {
  jobId: string
  question: string
  userIdentifier?: string
  userId?: string | null
  userName?: string | null
}

async function updatePredictionStatus(
  jobId: string,
  updates: {
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
    analysisResult?: any
    selectedCards?: any
    finalReading?: any
    completedAt?: Date
  }
): Promise<void> {
  try {
    await PredictionService.updatePrediction(jobId, updates)
  } catch (error) {
    console.error('Failed to update prediction status:', error)
    throw error
  }
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      console.error(`Operation failed (attempt ${attempt}/${maxRetries}):`, error)

      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw new Error('Max retries exceeded')
}

export async function startTarotWorkflow(params: StartWorkflowParams): Promise<void> {
  const { jobId, question, userName } = params

  console.log('Starting tarot workflow for job:', jobId)

  try {
    // Step 1: Mark as PROCESSING
    await updatePredictionStatus(jobId, { status: 'PROCESSING' })

    // Step 2: Gatekeeper Agent - Validate question
    console.log('Running gatekeeper agent...')
    const gatekeeperResult = await retryOperation(() => gatekeeperAgent(question))

    if (!gatekeeperResult.approved) {
      console.log('Question rejected by gatekeeper:', gatekeeperResult.reason)
      await updatePredictionStatus(jobId, {
        status: 'FAILED',
        completedAt: new Date()
      })
      throw new Error(`Question rejected by gatekeeper: ${gatekeeperResult.reason}`)
    }

    // Step 3: Analyst Agent - Analyze context with user name
    console.log('Running analyst agent...')
    const analysisResult = await retryOperation(() => analystAgent(question, userName || undefined))

    // Save analysis result
    await updatePredictionStatus(jobId, {
      status: 'PROCESSING',
      analysisResult
    })

    // Step 4: Mystic Agent - Select cards and generate reading
    console.log('Running mystic agent...')
    const finalReading = await retryOperation(() => mysticAgent(question, analysisResult))

    // Save selected cards from mystic result
    if (finalReading.success && finalReading.selectedCards) {
      await updatePredictionStatus(jobId, {
        status: 'PROCESSING',
        selectedCards: finalReading.selectedCards
      })
    }

    // Step 5: Deduct credit FIRST (if userId is present)
    if (params.userId) {
      try {
        await CreditService.deductStar(params.userId, { predictionId: jobId })
        console.log('Credit deducted for user:', params.userId)
      } catch (creditError) {
        console.error('Failed to deduct credit:', creditError)
        throw new Error('Insufficient credits or payment failed')
      }
    }

    try {
      // Step 6: Mark as COMPLETED with final reading
      await updatePredictionStatus(jobId, {
        status: 'COMPLETED',
        finalReading,
        completedAt: new Date()
      })
    } catch (dbError) {
      // If DB update fails, REFUND the user
      if (params.userId) {
        console.error('Refunding user due to DB error...')
        await CreditService.refundStar(params.userId, 1, 'System Error: Failed to save prediction', { predictionId: jobId })
      }
      throw dbError
    }

    console.log('Workflow completed successfully for job:', jobId)

  } catch (error) {
    console.error('Workflow failed for job:', jobId, error)

    // Mark as FAILED
    await updatePredictionStatus(jobId, {
      status: 'FAILED',
      completedAt: new Date()
    })

    throw error
  }
}