// Development Learning Journal - Debug Command
// 🟢 GREEN Phase: Minimal implementation to make tests pass

import type { CommandResult, DebugAnalysis } from '../types/memory'
import { DebugAssistant } from '../debug_assistant'

export async function debugCommand(errorMessage: string): Promise<CommandResult> {
  try {
    const debugAssistant = new DebugAssistant('.claude/memory/debug-command.db')
    const analysis: DebugAnalysis = await debugAssistant.analyzeError(errorMessage)

    // Create debug session
    const sessionId = await debugAssistant.startDebugSession({
      initialError: errorMessage,
      errorTraceback: errorMessage
    })

    debugAssistant.close()

    return {
      success: true,
      message: 'Debug session started successfully',
      data: {
        sessionId,
        analysis,
        suggestedExperiment: `/experiment "${analysis.suggestedAction}"`
      },
      nextCommand: `/experiment "${analysis.suggestedAction}"`
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to analyze error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}