// 3-Agent Tarot Workflow (Refactored Pipeline)
// Phase 1: GREEN - Implementation of optimized 3-agent workflow

import { db } from '@/lib/db'
import { guardianAgent } from '@/lib/ai/agents/guardian'
import { dealerAgent } from '@/lib/ai/agents/dealer'
import { mysticAgent } from '@/lib/ai/agents/mystic'

export interface StartWorkflowParams {
  jobId: string
  question: string
  userIdentifier?: string
  userId?: string | null
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
    await db.prediction.updateMany({
      where: { jobId: jobId },
      data: {
        status: updates.status,
        analysisResult: updates.analysisResult,
        selectedCards: updates.selectedCards,
        finalReading: updates.finalReading,
        completedAt: updates.completedAt
      }
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

export async function startTarotWorkflow3Agent(params: StartWorkflowParams): Promise<void> {
  const { jobId, question } = params

  console.log('Starting 3-agent tarot workflow for job:', jobId)

  try {
    // Step 1: Mark as PROCESSING
    await updatePredictionStatus(jobId, { status: 'PROCESSING' })

    // Step 2: Guardian Agent - Combined validation and analysis
    console.log('Running guardian agent...')
    const guardianResult = await retryOperation(() => guardianAgent(question))

    if (!guardianResult.approved) {
      console.log('Question rejected by guardian:', guardianResult.reason)
      await updatePredictionStatus(jobId, {
        status: 'FAILED',
        completedAt: new Date()
      })
      throw new Error(`Question rejected by guardian: ${guardianResult.reason}`)
    }

    // Save Guardian analysis as both analysis and context
    await updatePredictionStatus(jobId, {
      status: 'PROCESSING',
      analysisResult: guardianResult
    })

    // Step 3: Dealer Agent - Enhanced card selection with Guardian context
    console.log('Running dealer agent...')
    const dealerResult = await retryOperation(() => dealerAgent(question, guardianResult))

    // Save selected cards with theme and confidence
    await updatePredictionStatus(jobId, {
      status: 'PROCESSING',
      selectedCards: {
        cards: dealerResult.selectedCards,
        theme: dealerResult.theme,
        confidence: dealerResult.confidence,
        reasoning: dealerResult.reasoning
      }
    })

    // Step 4: Mystic Agent - Enhanced reading generation with Guardian context
    console.log('Running mystic agent...')
    const finalReading = await retryOperation(() =>
      mysticAgent(question, guardianResult, dealerResult.selectedCards)
    )

    // Step 5: Mark as COMPLETED with enhanced final reading
    await updatePredictionStatus(jobId, {
      status: 'COMPLETED',
      finalReading: {
        ...finalReading,
        guardianContext: guardianResult,
        dealerContext: {
          theme: dealerResult.theme,
          confidence: dealerResult.confidence,
          reasoning: dealerResult.reasoning
        }
      },
      completedAt: new Date()
    })

    console.log('3-agent workflow completed successfully for job:', jobId)

  } catch (error) {
    console.error('3-agent workflow failed for job:', jobId, error)

    // Mark as FAILED
    await updatePredictionStatus(jobId, {
      status: 'FAILED',
      completedAt: new Date()
    })

    throw error
  }
}