// Development Learning Journal - Learn Command
// 🟢 GREEN Phase: Minimal implementation to make tests pass

import type { CommandResult, MemorySearchQuery } from '../types/memory'
import { MemoryManager } from '../memory_manager'

export async function learnCommand(query: string, options: any = {}): Promise<CommandResult> {
  try {
    // Validate parameters
    if (!query || query.trim() === '') {
      return {
        success: false,
        message: 'Query cannot be empty',
        error: 'Query cannot be empty',
        data: null
      }
    }

    if (options.limit !== undefined && (options.limit < 0 || options.limit > 100)) {
      return {
        success: false,
        message: 'Invalid limit parameter',
        error: 'Invalid limit parameter',
        data: null
      }
    }

    const memoryManager = new MemoryManager('.claude/memory/learn-command.db')

    const searchQuery: MemorySearchQuery = {
      query,
      limit: options.limit || 5,
      type: options.type || 'all',
      semantic: options.semantic || false,
      minEffectiveness: options.minEffectiveness
    }

    const experiences = memoryManager.findLessonsLearned(searchQuery)

    const recommendations = experiences.length > 0 ? [
      {
        title: 'Apply learned patterns',
        description: 'Use the patterns from similar past experiences',
        applicable: true
      },
      {
        title: 'Document approach',
        description: 'Document your approach for future reference',
        applicable: true
      }
    ] : []

    memoryManager.close()

    return {
      success: true,
      message: `Found ${experiences.length} relevant past experiences`,
      data: {
        experiences,
        totalFound: experiences.length,
        searchType: searchQuery.semantic ? 'semantic' : 'keyword',
        queryUnderstanding: `Searching for: ${query}`,
        recommendations
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to search past experiences',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}