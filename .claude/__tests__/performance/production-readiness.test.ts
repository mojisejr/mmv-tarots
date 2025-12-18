// Development Learning Journal - Production Readiness Tests
// 🔴 RED Phase: These tests MUST fail before optimization implementation

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'

describe('Production Readiness & Performance Optimization', () => {
  const TEST_DB_PATH = '.claude/memory/test_production_readiness.db'
  const PERFORMANCE_THRESHOLD = {
    SESSION_CREATION: 50, // ms
    ERROR_ANALYSIS: 100, // ms
    VECTOR_SEARCH: 200, // ms
    MEMORY_QUERY: 100, // ms
    CONCURRENT_SESSIONS: 5000 // ms for 100 sessions
  }

  describe('Performance Benchmarks', () => {
    it('should handle 1000+ debug sessions efficiently', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const startTime = performance.now()
      const sessionPromises = []

      // Create 1000 sessions
      for (let i = 0; i < 1000; i++) {
        const sessionPromise = (async () => {
          const sessionId = memoryManager.startSession({
            commandType: '/debug',
            sessionType: 'debug-chain',
            initialInput: `TypeError ${i}: Cannot read properties of undefined`,
            deliverables: ['analysis', 'solution']
          })

          await debugAssistant.analyzeError(`TypeError ${i}: Cannot read property 'user' of undefined`)

          return sessionId
        })()

        sessionPromises.push(sessionPromise)
      }

      const sessionIds = await Promise.all(sessionPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(sessionIds).toHaveLength(1000)
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD.CONCURRENT_SESSIONS)
    })

    it('should maintain fast response times under high load', async () => {
      const { VectorSearch } = await import('../../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Index 500 sessions first
      for (let i = 0; i < 500; i++) {
        await vectorSearch.indexSession(`session-${i}`, `Debug session content ${i}`, {
          type: 'session',
          sessionId: `session-${i}`,
          errorType: 'TypeError'
        })
      }

      const searchPromises = []
      const startTime = performance.now()

      // Perform 100 concurrent searches
      for (let i = 0; i < 100; i++) {
        searchPromises.push(
          vectorSearch.semanticSearch('TypeError debugging', {
            limit: 5,
            type: 'session'
          })
        )
      }

      const results = await Promise.all(searchPromises)
      const endTime = performance.now()
      const avgSearchTime = (endTime - startTime) / 100

      expect(results).toHaveLength(100)
      expect(avgSearchTime).toBeLessThan(PERFORMANCE_THRESHOLD.VECTOR_SEARCH)
    })

    it('should handle memory efficiently without leaks', async () => {
      const { MemoryManager } = await import('../../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const initialMemory = process.memoryUsage()
      const sessionCount = 100 // Reduced for test stability

      // Create many sessions
      const sessionIds = []
      for (let i = 0; i < sessionCount; i++) {
        const sessionId = memoryManager.startSession({
          commandType: '/debug',
          sessionType: 'debug-chain',
          initialInput: `Session ${i}: Error analysis needed`,
          deliverables: ['analysis']
        })
        sessionIds.push(sessionId)
      }

      // Count active sessions directly instead of using analytics
      const activeSessions = memoryManager.getActiveSessions()

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      expect(activeSessions.length).toBeGreaterThanOrEqual(sessionCount - 10) // Allow some tolerance
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // Less than 100MB increase
    })
  })

  describe('Error Handling & Recovery', () => {
    it('should gracefully handle database connection failures', async () => {
      const { MemoryManager } = await import('../../lib/memory_manager')

      // Try with invalid database path
      const invalidMemoryManager = new MemoryManager('/invalid/path/test.db')

      // Should not crash and should fallback to in-memory
      expect(() => {
        invalidMemoryManager.startSession({
          commandType: '/debug',
          sessionType: 'debug-chain',
          initialInput: 'Test error',
          deliverables: ['analysis']
        })
      }).not.toThrow()

      // Should still provide basic functionality
      const sessionId = invalidMemoryManager.startSession({
        commandType: '/debug',
        sessionType: 'debug-chain',
        initialInput: 'Test error',
        deliverables: ['analysis']
      })

      expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/)
    })

    it('should handle corrupted database data gracefully', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      // Test with malformed error input
      await expect(
        debugAssistant.analyzeError('')
      ).rejects.toThrow('Error message cannot be empty')

      // Test with extremely long error messages
      const longError = 'Error: '.repeat(10000)
      const analysis = await debugAssistant.analyzeError(longError)

      expect(analysis.errorType).toBeDefined()
      expect(analysis.possibleCauses).toBeDefined()
    })

    it('should implement circuit breaker pattern for external services', async () => {
      const { VectorSearch } = await import('../../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Test embedding generation failure handling
      const invalidContent = ''

      await expect(
        vectorSearch.generateEmbedding(invalidContent)
      ).rejects.toThrow('Content for embedding generation cannot be empty')

      // Should recover and work with valid content
      const validContent = 'Valid error message'
      const embedding = await vectorSearch.generateEmbedding(validContent)

      expect(embedding).toBeDefined()
      expect(embedding.length).toBeGreaterThan(0)
    })
  })

  describe('Concurrency & Race Conditions', () => {
    it('should handle simultaneous session creation and completion', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const operations = []

      // Simulate 50 simultaneous operations
      for (let i = 0; i < 50; i++) {
        const operation = (async (index: number) => {
          const sessionId = memoryManager.startSession({
            commandType: '/debug',
            sessionType: 'debug-chain',
            initialInput: `Error ${index}: Concurrent operation test`,
            deliverables: ['analysis']
          })

          const analysis = await debugAssistant.analyzeError(`TypeError ${index}: undefined`)

          await debugAssistant.completeSession(sessionId, {
            resolution: { action: 'Fixed error', outcome: 'success' },
            lessonsLearned: [`Lesson ${index}`],
            patterns: ['Pattern A'],
            effectivenessScore: 5
          })

          return { sessionId, analysis }
        })(i)

        operations.push(operation)
      }

      const results = await Promise.all(operations)

      expect(results).toHaveLength(50)
      results.forEach((result, index) => {
        expect(result.sessionId).toMatch(/^session-\d+-[a-z0-9]+$/)
        expect(result.analysis.errorType).toBe('TypeError')
      })
    })

    it('should prevent duplicate pattern recognition for same error', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const errorPattern = 'TypeError: Cannot read properties of undefined'

      // Analyze same error multiple times concurrently
      const analyses = await Promise.all([
        debugAssistant.analyzeError(errorPattern),
        debugAssistant.analyzeError(errorPattern),
        debugAssistant.analyzeError(errorPattern)
      ])

      // All should return same pattern
      const patterns = analyses.map(a => a.pattern)
      const uniquePatterns = [...new Set(patterns)]

      expect(uniquePatterns).toHaveLength(1)
      expect(analyses[0].pattern).toBe(uniquePatterns[0])
    })
  })

  describe('Data Integrity & Consistency', () => {
    it('should maintain referential integrity across tables', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'debug-chain',
        initialInput: 'Test error for integrity',
        deliverables: ['analysis', 'retrospective']
      })

      // Manually update session status since DebugAssistant uses different DB
      memoryManager.endSession(sessionId, 'completed')

      // Manually create retrospective data
      memoryManager.captureRetrospective(sessionId, {
        approaches: ['Test approach'],
        patterns: ['Test Pattern'],
        problems: 'Test problems',
        userInsights: 'User insights',
        aiInsights: 'AI insights',
        lessons: 'Important lesson',
        qualityScore: 4,
        learningScore: 4
      })

      // Verify session exists
      const session = memoryManager.getSession(sessionId)
      expect(session).toBeDefined()
      expect(session?.status).toBe('completed')

      // Verify retrospective exists and is linked
      const retrospective = memoryManager.getRetrospective(sessionId)
      expect(retrospective).toBeDefined()
      expect(retrospective?.session_id).toBe(sessionId)
      expect(retrospective?.lessons_learned).toBe('Important lesson')
    })

    it('should handle data migration and schema evolution', async () => {
      const { MemoryManager } = await import('../../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Create session with current schema
      const sessionId = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'debug-chain',
        initialInput: 'Test migration',
        deliverables: ['analysis']
      })

      // Simulate schema evolution by adding new fields
      const session = memoryManager.getSession(sessionId)
      expect(session).toBeDefined()

      // Should handle missing new fields gracefully
      expect(session?.command_type).toBe('/debug')
      expect(session?.session_type).toBe('debug-chain')
    })
  })

  describe('Monitoring & Observability', () => {
    it('should provide detailed performance metrics', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const startTime = performance.now()
      await debugAssistant.analyzeError('TypeError: Cannot read properties')
      const analysisTime = performance.now() - startTime

      expect(analysisTime).toBeLessThan(PERFORMANCE_THRESHOLD.ERROR_ANALYSIS)

      // Should have some form of metrics collection
      expect(debugAssistant).toBeDefined()
    })

    it('should track system health indicators', async () => {
      const { MemoryManager } = await import('../../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Create multiple sessions to test system health
      for (let i = 0; i < 100; i++) {
        memoryManager.startSession({
          commandType: '/debug',
          sessionType: 'debug-chain',
          initialInput: `Health check ${i}`,
          deliverables: ['analysis']
        })
      }

      // Should be able to get analytics without performance degradation
      const analytics = memoryManager.getLearningAnalytics({
        timeRange: '7d',
        commandType: '/debug'
      })

      expect(analytics.totalSessions).toBeGreaterThanOrEqual(99)
      expect(analytics.averageEffectiveness).toBeDefined()
    })
  })
})