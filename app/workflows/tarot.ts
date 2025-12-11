// Vercel Workflow for Tarot Reading AI Pipeline
// Phase 3: GREEN - Full AI agent pipeline implementation

import { db } from '@/lib/db'
import { gatekeeperAgent } from '@/lib/ai/agents/gatekeeper'
import { analystAgent } from '@/lib/ai/agents/analyst'
import { dealerAgent } from '@/lib/ai/agents/dealer'
import { mysticAgent } from '@/lib/ai/agents/mystic'

export interface StartWorkflowParams {
  jobId: string
  question: string
}

async function updatePredictionStatus(
  jobId: string,
  updates: {
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
    analysisResult?: any
    selectedCards?: number[]
    finalReading?: any
    completedAt?: Date
  }
): Promise<void> {
  try {
    await db.prediction.updateMany({
      where: { jobId },
      data: updates
    })
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
  const { jobId, question } = params

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

    // Step 3: Analyst Agent - Analyze context
    console.log('Running analyst agent...')
    const analysisResult = await retryOperation(() => analystAgent(question))

    // Save analysis result
    await updatePredictionStatus(jobId, {
      status: 'PROCESSING',
      analysisResult
    })

    // Step 4: Dealer Agent - Select cards
    console.log('Running dealer agent...')
    const dealerResult = await retryOperation(() => dealerAgent(question, analysisResult))

    // Save selected cards
    await updatePredictionStatus(jobId, {
      status: 'PROCESSING',
      selectedCards: dealerResult.selectedCards
    })

    // Step 5: Mystic Agent - Generate reading
    console.log('Running mystic agent...')
    const finalReading = await retryOperation(() =>
      mysticAgent(question, analysisResult, dealerResult.selectedCards)
    )

    // Step 6: Mark as COMPLETED with final reading
    await updatePredictionStatus(jobId, {
      status: 'COMPLETED',
      finalReading,
      completedAt: new Date()
    })

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