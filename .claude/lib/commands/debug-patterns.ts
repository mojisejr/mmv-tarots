// Development Learning Journal - Debug Patterns Command
// 🟢 GREEN Phase: Minimal implementation to make tests pass

import type { CommandResult } from '../types/memory'
import { DebugAssistant } from '../debug_assistant'

export async function debugPatternsCommand(options: any = {}): Promise<CommandResult> {
  try {
    const debugAssistant = new DebugAssistant('.claude/memory/debug-patterns.db')

    const patterns = debugAssistant.getCommonPatterns()
    const preventionStrategies = debugAssistant.getPreventionStrategies('common')

    debugAssistant.close()

    return {
      success: true,
      message: 'Debug patterns analysis completed',
      data: {
        patterns,
        summary: {
          totalPatterns: patterns.length,
          mostCommon: patterns.length > 0 ? patterns[0].pattern : 'None'
        },
        preventionStrategies: options.includePrevention ? preventionStrategies : undefined
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to analyze debug patterns',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}