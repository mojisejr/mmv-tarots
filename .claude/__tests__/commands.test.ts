// Development Learning Journal - Enhanced Command Tests
// 🔴 RED Phase: These tests MUST fail before implementation

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { CommandResult, DebugAnalysis } from '../lib/types/memory'

describe('Enhanced Commands', () => {
  const TEST_DB_PATH = '.claude/memory/test_commands.db'

  beforeEach(async () => {
    // Mock environment
    vi.mock('../../lib/db', () => ({
      db: {
        prediction: {
          create: vi.fn(),
          updateMany: vi.fn(),
          findMany: vi.fn()
        }
      }
    }))

    vi.mock('fs/promises', () => ({
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readdir: vi.fn().mockResolvedValue(['file1.ts', 'file2.ts'])
    }))

    // Mock SlashCommand tool
    vi.mock('../tools/slash-command', () => ({
      SlashCommand: vi.fn()
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('/debug Command', () => {
    it('should trigger active investigation workflow', async () => {
      const { debugCommand } = await import('../lib/commands/debug')

      const errorMessage = `
        TypeError: Cannot read properties of undefined (reading 'user')
          at UserService.getCurrentUser (/app/services/user.ts:15:12)
          at UserController.getProfile (/app/controllers/user.ts:8:18)
      `

      const result: CommandResult = await debugCommand(errorMessage)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.analysis).toBeDefined()
      expect(result.data.analysis.probableCause).toContain('undefined')
      expect(result.data.analysis.suggestedAction).toBeDefined()
      expect(result.data.analysis.confidence).toBeGreaterThan(0)
      expect(result.nextCommand).toContain('/experiment')
    })

    it('should create debug session and store in memory', async () => {
      const { debugCommand } = await import('../lib/commands/debug')

      const error = 'Database connection failed: connection timeout'
      const result: CommandResult = await debugCommand(error)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Debug session started')

      // Should store in database
      expect(result.data.sessionId).toBeDefined()
      expect(typeof result.data.sessionId).toBe('string')
    })

    it('should analyze code context when file paths available', async () => {
      const { debugCommand } = await import('../lib/commands/debug')

      const errorWithFile = `
        Error: Cannot find module '@/components/Button'
          at Module.require (internal/modules/cjs/loader.js:1023)
      `

      // Mock file system
      const { readFile } = await import('fs/promises')
      vi.mocked(readFile).mockResolvedValue(`
        import { Button } from '@/components/Button'
        export default function UserProfile() {
          return <Button>Click me</Button>
        }
      `)

      const result: CommandResult = await debugCommand(errorWithFile)

      expect(result.success).toBe(true)
      expect(result.data.analysis.relatedFiles).toContain('@/components/Button')
      expect(result.data.analysis.suggestedAction).toContain('import path')
    })

    it('should provide confidence score based on error clarity', async () => {
      const { debugCommand } = await import('../lib/commands/debug')

      const clearError = 'TypeError: Cannot read properties of null (reading "id")'
      const vagueError = 'Something went wrong'

      const clearResult: CommandResult = await debugCommand(clearError)
      const vagueResult: CommandResult = await debugCommand(vagueError)

      expect(clearResult.data.analysis.confidence).toBeGreaterThan(vagueResult.data.analysis.confidence)
    })

    it('should handle unknown error types gracefully', async () => {
      const { debugCommand } = await import('../lib/commands/debug')

      const unknownError = 'XYZ123: Unknown error code'
      const result: CommandResult = await debugCommand(unknownError)

      expect(result.success).toBe(true)
      expect(result.data.analysis.probableCause).toContain('Unknown error')
      expect(result.data.analysis.suggestedAction).toContain('investigate')
    })
  })

  describe('/experiment Command', () => {
    it('should implement code changes safely', async () => {
      const { experimentCommand } = await import('../lib/commands/experiment')

      const sessionId = 'debug-session-123'
      const suggestedFix = 'Add null check before accessing user property'

      const result: CommandResult = await experimentCommand(sessionId, suggestedFix)

      expect(result.success).toBe(true)
      expect(result.data.changes).toBeDefined()
      expect(result.data.filesModified).toBeInstanceOf(Array)
      expect(result.data.rollbackScript).toBeDefined()
    })

    it('should create backup before making changes', async () => {
      const { experimentCommand } = await import('../lib/commands/experiment')

      const sessionId = 'debug-session-456'
      const changes = 'Replace var with const in user service'

      const result: CommandResult = await experimentCommand(sessionId, changes)

      expect(result.success).toBe(true)
      expect(result.data.backupPath).toBeDefined()
      expect(result.data.backupCreated).toBe(true)
    })

    it('should validate changes before applying', async () => {
      const { experimentCommand } = await import('../lib/commands/experiment')

      const sessionId = 'debug-session-789'
      const invalidChanges = 'Remove all error handling'

      const result: CommandResult = await experimentCommand(sessionId, invalidChanges)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid changes detected')
      expect(result.data.validationErrors).toBeDefined()
    })

    it('should support rollback functionality', async () => {
      const { experimentCommand } = await import('../lib/commands/experiment')

      const sessionId = 'debug-session-999'
      const changes = 'Update import statements'

      const applyResult: CommandResult = await experimentCommand(sessionId, changes)
      expect(applyResult.success).toBe(true)

      const rollbackResult: CommandResult = await experimentCommand(sessionId, '--rollback')
      expect(rollbackResult.success).toBe(true)
      expect(rollbackResult.message).toContain('Rolled back successfully')
    })

    it('should track experiment outcomes', async () => {
      const { experimentCommand } = await import('../lib/commands/experiment')

      const sessionId = 'debug-session-outcome'
      const changes = 'Fix memory leak in component'

      const result: CommandResult = await experimentCommand(sessionId, changes)

      expect(result.data.experimentId).toBeDefined()
      expect(result.data.status).toBe('applied')
      expect(result.data.timestamp).toBeDefined()
    })
  })

  describe('/aha Command', () => {
    it('should capture learning insights', async () => {
      const { ahaCommand } = await import('../lib/commands/aha')

      const insight = {
        title: 'Connection Pooling Best Practice',
        description: 'Always implement connection pooling for database operations',
        context: 'Fixed database timeout issues by implementing proper connection pooling',
        impact: 'Reduced database response time from 2s to 200ms'
      }

      const result: CommandResult = await ahaCommand(insight)

      expect(result.success).toBe(true)
      expect(result.data.insightId).toBeDefined()
      expect(result.data.pattern).toContain('resource management')
      expect(result.message).toContain('Learning captured')
    })

    it('should link insight to current session', async () => {
      const { ahaCommand } = await import('../lib/commands/aha')

      // Mock current session
      vi.mock('../lib/session-manager', () => ({
        getCurrentSession: vi.fn().mockReturnValue({
          id: 'current-session-123',
          commandType: '/impl'
        })
      }))

      const insight = 'Always test error handling paths'
      const result: CommandResult = await ahaCommand(insight)

      expect(result.success).toBe(true)
      expect(result.data.sessionId).toBe('current-session-123')
    })

    it('should extract patterns from insights', async () => {
      const { ahaCommand } = await import('../lib/commands/aha')

      const complexInsight = `
        Discovered that implementing retry logic with exponential backoff
        significantly improved API reliability. Should apply this pattern
        to all external service integrations.
      `

      const result: CommandResult = await ahaCommand(complexInsight)

      expect(result.success).toBe(true)
      expect(result.data.extractedPatterns).toContain('retry logic')
      expect(result.data.extractedPatterns).toContain('exponential backoff')
      expect(result.data.applicableScenarios).toContain('external service integrations')
    })

    it('should generate prevention strategies', async () => {
      const { ahaCommand } = await import('../lib/commands/aha')

      const problemInsight = 'Null reference errors due to missing validation'
      const result: CommandResult = await ahaCommand(problemInsight)

      expect(result.success).toBe(true)
      expect(result.data.preventionStrategy).toBeDefined()
      expect(result.data.preventionStrategy.checklist).toBeInstanceOf(Array)
      expect(result.data.preventionStrategy.automated).toContain('input validation')
    })
  })

  describe('/learn Command', () => {
    it('should retrieve relevant past experiences', async () => {
      const { learnCommand } = await import('../lib/commands/learn')

      const query = 'database connection issues'
      const result: CommandResult = await learnCommand(query, { limit: 5 })

      expect(result.success).toBe(true)
      expect(result.data.experiences).toBeDefined()
      expect(result.data.experiences).toBeInstanceOf(Array)
      expect(result.data.totalFound).toBeGreaterThanOrEqual(0)

      if (result.data.experiences.length > 0) {
        expect(result.data.experiences[0].sessionId).toBeDefined()
        expect(result.data.experiences[0].relevanceScore).toBeGreaterThan(0)
        expect(result.data.experiences[0].summary).toBeDefined()
      }
    })

    it('should support semantic search across sessions', async () => {
      const { learnCommand } = await import('../lib/commands/learn')

      const query = 'memory management and cleanup'
      const result: CommandResult = await learnCommand(query, {
        semantic: true,
        type: 'solution'
      })

      expect(result.success).toBe(true)
      expect(result.data.searchType).toBe('semantic')
      expect(result.data.queryUnderstanding).toBeDefined()
    })

    it('should filter results by effectiveness', async () => {
      const { learnCommand } = await import('../lib/commands/learn')

      const query = 'performance optimization'
      const result: CommandResult = await learnCommand(query, {
        minEffectiveness: 4,
        type: 'solution'
      })

      expect(result.success).toBe(true)
      if (result.data.experiences.length > 0) {
        result.data.experiences.forEach((exp: any) => {
          expect(exp.effectivenessScore).toBeGreaterThanOrEqual(4)
        })
      }
    })

    it('should provide learning recommendations', async () => {
      const { learnCommand } = await import('../lib/commands/learn')

      const query = 'TypeScript type safety'
      const result: CommandResult = await learnCommand(query)

      expect(result.success).toBe(true)
      expect(result.data.recommendations).toBeDefined()
      expect(result.data.recommendations).toBeInstanceOf(Array)

      if (result.data.recommendations.length > 0) {
        expect(result.data.recommendations[0].title).toBeDefined()
        expect(result.data.recommendations[0].description).toBeDefined()
        expect(result.data.recommendations[0].applicable).toBe(true)
      }
    })
  })

  describe('/history Command', () => {
    it('should retrieve timeline queries with filtering', async () => {
      const { historyCommand } = await import('../lib/commands/history')

      const result: CommandResult = await historyCommand({
        type: 'debug',
        dateRange: 'last-7-days'
      })

      expect(result.success).toBe(true)
      expect(result.data.timeline).toBeInstanceOf(Array)
      expect(result.data.summary).toBeDefined()

      if (result.data.timeline.length > 0) {
        expect(result.data.timeline[0].timestamp).toBeDefined()
        expect(result.data.timeline[0].commandType).toBe('debug')
      }
    })

    it('should support multiple filter criteria', async () => {
      const { historyCommand } = await import('../lib/commands/history')

      const filters = {
        commandType: '/impl',
        status: 'completed',
        sessionType: 'feature',
        limit: 10
      }

      const result: CommandResult = await historyCommand(filters)

      expect(result.success).toBe(true)
      expect(result.data.appliedFilters).toEqual(filters)
      expect(result.data.totalMatching).toBeGreaterThanOrEqual(0)
    })

    it('should provide session analytics', async () => {
      const { historyCommand } = await import('../lib/commands/history')

      const result: CommandResult = await historyCommand({
        analytics: true,
        period: 'last-30-days'
      })

      expect(result.success).toBe(true)
      expect(result.data.analytics).toBeDefined()
      expect(result.data.analytics.sessionCounts).toBeDefined()
      expect(result.data.analytics.averageDuration).toBeDefined()
      expect(result.data.analytics.successRate).toBeDefined()
      expect(result.data.analytics.commandDistribution).toBeDefined()
    })
  })

  describe('/debug-patterns Command', () => {
    it('should analyze error patterns and prevention methods', async () => {
      const { debugPatternsCommand } = await import('../lib/commands/debug-patterns')

      const result: CommandResult = await debugPatternsCommand()

      expect(result.success).toBe(true)
      expect(result.data.patterns).toBeInstanceOf(Array)
      expect(result.data.summary).toBeDefined()

      if (result.data.patterns.length > 0) {
        expect(result.data.patterns[0].pattern).toBeDefined()
        expect(result.data.patterns[0].frequency).toBeGreaterThan(0)
        expect(result.data.patterns[0].preventionMethod).toBeDefined()
      }
    })

    it('should show most common error types', async () => {
      const { debugPatternsCommand } = await import('../lib/commands/debug-patterns')

      const result: CommandResult = await debugPatternsCommand({
        sortBy: 'frequency',
        limit: 5
      })

      expect(result.success).toBe(true)

      if (result.data.patterns.length > 1) {
        // Should be sorted by frequency (highest first)
        for (let i = 0; i < result.data.patterns.length - 1; i++) {
          expect(result.data.patterns[i].frequency)
            .toBeGreaterThanOrEqual(result.data.patterns[i + 1].frequency)
        }
      }
    })

    it('should suggest prevention strategies based on history', async () => {
      const { debugPatternsCommand } = await import('../lib/commands/debug-patterns')

      const result: CommandResult = await debugPatternsCommand({
        includePrevention: true
      })

      expect(result.success).toBe(true)
      expect(result.data.preventionStrategies).toBeDefined()
      expect(result.data.preventionStrategies).toBeInstanceOf(Array)

      if (result.data.preventionStrategies.length > 0) {
        expect(result.data.preventionStrategies[0].strategy).toBeDefined()
        expect(result.data.preventionStrategies[0].implementation).toBeDefined()
        expect(result.data.preventionStrategies[0].estimatedReduction).toBeDefined()
      }
    })
  })

  describe('Command Integration', () => {
    it('should support command chaining', async () => {
      const { debugCommand } = await import('../lib/commands/debug')
      const { experimentCommand } = await import('../lib/commands/experiment')

      // Start debug session
      const debugResult: CommandResult = await debugCommand('TypeError: Cannot read property of undefined')
      expect(debugResult.success).toBe(true)

      // Use the suggested experiment
      const suggestedExperiment = debugResult.nextCommand
      const sessionId = debugResult.data.sessionId

      const experimentResult: CommandResult = await experimentCommand(sessionId, 'Add null check')
      expect(experimentResult.success).toBe(true)
    })

    it('should maintain context across commands', async () => {
      const { debugCommand } = await import('../lib/commands/debug')
      const { ahaCommand } = await import('../lib/commands/aha')

      // Debug session
      const debugResult: CommandResult = await debugCommand('API rate limiting issues')
      const sessionId = debugResult.data.sessionId

      // Capture learning from debug session
      const ahaResult: CommandResult = await ahaCommand({
        insight: 'Always implement rate limiting with exponential backoff',
        context: 'Fixed API timeout issues'
      })

      expect(ahaResult.success).toBe(true)
      expect(ahaResult.data.relatedSessionId).toBeDefined()
    })

    it('should handle errors gracefully across commands', async () => {
      const { experimentCommand } = await import('../lib/commands/experiment')

      // Try to experiment with invalid session
      const result: CommandResult = await experimentCommand('invalid-session', 'some changes')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid session')
      expect(result.data).toBeDefined()
    })
  })

  describe('Performance and Usability', () => {
    it('should execute commands within reasonable time', async () => {
      const { debugCommand } = await import('../lib/commands/debug')

      const startTime = Date.now()
      await debugCommand('Simple error message for testing')
      const executionTime = Date.now() - startTime

      expect(executionTime).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should provide helpful error messages', async () => {
      const { learnCommand } = await import('../lib/commands/learn')

      const result: CommandResult = await learnCommand('', { limit: -1 })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    })

    it('should validate command parameters', async () => {
      const { historyCommand } = await import('../lib/commands/history')

      // Test invalid date range
      const result: CommandResult = await historyCommand({
        dateRange: 'invalid-date-format'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid date range')
    })
  })
})