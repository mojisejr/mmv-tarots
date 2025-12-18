// Development Learning Journal - End-to-End Workflow Tests
// 🔴 RED Phase: These tests MUST fail before implementation

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'

describe('Development Learning Journal - End-to-End Workflow', () => {
  const TEST_DB_PATH = '.claude/memory/test_e2e_workflow.db'

  beforeEach(async () => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Debug-to-Learning Pipeline', () => {
    it('should handle complete workflow from error detection to learning application', async () => {
      // Phase 1: Error Detection and Analysis
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')
      const { VectorSearch } = await import('../../lib/vector_search')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Developer encounters an error
      const errorInput = 'TypeError: Cannot read properties of undefined (reading \'user\')'

      // 1. Start debug session
      const sessionId = memoryManager.startSession({
        commandType: 'debug',
        sessionType: 'investigation',
        initialInput: errorInput,
        deliverables: ['error analysis', 'solution plan', 'learning insights']
      })

      expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/)

      // 2. Analyze error with context-aware assistance
      const initialAnalysis = await debugAssistant.analyzeError(errorInput)
      expect(initialAnalysis.errorType).toBe('TypeError')
      expect(initialAnalysis.possibleCauses).toContain(
        expect.stringContaining('undefined')
      )
      expect(initialAnalysis.suggestedSolutions).toContain(
        expect.objectContaining({
          action: expect.stringContaining('null check'),
          confidence: expect.any(Number)
        })
      )

      // 3. Search for similar past solutions
      const similarSolutions = await vectorSearch.findSimilarSolutions(errorInput, {
        limit: 5,
        similarityThreshold: 0.7
      })

      // Initially, should find similar patterns if they exist
      expect(similarSolutions).toBeInstanceOf(Array)

      // 4. Enhanced analysis with historical context
      const enhancedAnalysis = await debugAssistant.analyzeErrorWithContext(
        errorInput,
        similarSolutions
      )

      expect(enhancedAnalysis.basedOnHistoricalData).toBeDefined()
      expect(enhancedAnalysis.confidence).toBeGreaterThan(initialAnalysis.confidence)

      // Phase 2: Investigation and Resolution
      const investigation = await debugAssistant.performActiveInvestigation({
        file: '/src/components/UserProfile.tsx',
        line: 23,
        context: 'const user = apiResponse.data; return <div>{user.name}</div>',
        stackTrace: errorInput
      })

      expect(investigation.steps).toContain(
        expect.objectContaining({
          action: expect.any(String),
          result: expect.any(String)
        })
      )

      // 5. Apply solution
      const resolution = {
        action: 'Added null check and optional chaining',
        code: 'const user = apiResponse?.data || {}; return <div>{user?.name}</div>',
        outcome: 'success',
        timeSpent: 12
      }

      // Phase 3: Learning Extraction and Retention
      const retrospective = await debugAssistant.completeSession(sessionId, {
        resolution,
        lessonsLearned: [
          'Always validate API responses before use',
          'Use optional chaining for nested properties',
          'Add type guards for better error handling'
        ],
        patterns: [
          'Null Safety Pattern',
          'API Response Validation Pattern',
          'TypeScript Type Guard Pattern'
        ],
        effectivenessScore: 5,
        difficulty: 2,
        timeSaved: 30 // Estimated minutes saved in future similar issues
      })

      // 4. Verify learning was extracted and indexed
      expect(retrospective.sessionId).toBe(sessionId)
      expect(retrospective.extractedInsights).toContain(
        expect.objectContaining({
          insight: expect.stringContaining('API response'),
          category: 'defensive programming',
          applicability: expect.arrayContaining(['API integration'])
        })
      )

      // 5. Verify session persisted to memory
      const savedSession = memoryManager.getSession(sessionId)
      expect(savedSession).toBeDefined()
      expect(savedSession?.status).toBe('completed')
      expect(savedSession?.duration_seconds).toBeGreaterThan(0)

      // 6. Verify patterns were recorded for future reference
      const updatedPatterns = debugAssistant.getErrorPatterns()
      const nullSafetyPattern = updatedPatterns.find(p =>
        p.pattern.toLowerCase().includes('null')
      )
      expect(nullSafetyPattern).toBeDefined()
      expect(nullSafetyPattern.frequency).toBeGreaterThan(0)

      // 7. Verify learning was indexed for vector search
      await vectorSearch.indexRetrospective(retrospective)

      const futureSearchResults = await vectorSearch.semanticSearch('API response undefined', {
        type: 'learning',
        limit: 3
      })

      expect(futureSearchResults).toContain(
        expect.objectContaining({
          id: sessionId,
          similarity_score: expect.any(Number),
          metadata: expect.objectContaining({
            type: 'learning',
            sessionId: sessionId
          })
        })
      )
    })

    it('should enable continuous learning across multiple sessions', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')
      const { VectorSearch } = await import('../../lib/vector_search')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Session 1: First encounter with TypeError
      const session1Id = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'debug-chain',
        initialInput: 'TypeError: Cannot read properties of undefined',
        deliverables: ['solution', 'learning']
      })

      const analysis1 = await debugAssistant.analyzeError('Cannot read property name of undefined')
      await debugAssistant.completeSession(session1Id, {
        resolution: { action: 'Added null check', outcome: 'success' },
        lessonsLearned: ['Add null checks before property access'],
        patterns: ['Null Safety Pattern'],
        effectivenessScore: 4
      })

      // Session 2: Similar but different context
      const session2Id = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'debug-chain',
        initialInput: 'TypeError: Cannot read properties of undefined',
        deliverables: ['solution', 'learning']
      })

      const analysis2 = await debugAssistant.analyzeError('Cannot read property email of undefined')

      // Should leverage learning from session 1
      const similarCases = await vectorSearch.findSimilarSolutions('TypeError undefined property', {
        limit: 3
      })

      expect(similarCases).toContain(
        expect.objectContaining({
          sessionId: session1Id,
          solution: expect.stringContaining('null check'),
          effectiveness: expect.any(Number)
        })
      )

      // Enhanced analysis should be faster and more confident
      expect(analysis2.confidence).toBeGreaterThanOrEqual(analysis1.confidence)
      expect(analysis2.basedOnHistoricalData).toBe(true)

      await debugAssistant.completeSession(session2Id, {
        resolution: { action: 'Applied null check pattern', outcome: 'success' },
        lessonsLearned: ['Consistently apply null safety patterns'],
        patterns: ['Null Safety Pattern'],
        effectivenessScore: 5 // Higher effectiveness due to learned pattern
      })

      // Verify pattern frequency increased
      const patterns = debugAssistant.getErrorPatterns()
      const nullSafetyPattern = patterns.find(p => p.pattern.includes('Null Safety'))
      expect(nullSafetyPattern.frequency).toBe(2) // Applied in both sessions

      // Verify learning analytics show improvement
      const analytics = memoryManager.getLearningAnalytics({
        commandType: 'debug',
        timeRange: '7d'
      })

      expect(analytics.averageEffectiveness).toBeGreaterThanOrEqual(4.5)
      expect(analytics.improvementTrend).toBe('positive')
      expect(analytics.topLessons).toContain(
        expect.stringContaining('null check')
      )
    })

    it('should provide proactive learning recommendations', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Simulate several sessions to establish learning patterns
      const commonErrors = [
        'TypeError: Cannot read properties of undefined',
        'ReferenceError: variable is not defined',
        'TypeError: Cannot read properties of null',
        'SyntaxError: Unexpected token',
        'TypeError: X is not a function'
      ]

      for (let i = 0; i < commonErrors.length; i++) {
        const sessionId = memoryManager.startSession({
          commandType: 'debug',
          sessionType: 'interactive',
          initialInput: commonErrors[i],
          deliverables: ['solution', 'prevention']
        })

        await debugAssistant.analyzeError(commonErrors[i])
        await debugAssistant.completeSession(sessionId, {
          resolution: { action: 'Applied defensive programming', outcome: 'success' },
          lessonsLearned: [`Defensive programming lesson ${i + 1}`],
          patterns: [`Pattern ${i + 1}`],
          effectivenessScore: Math.floor(Math.random() * 2) + 4 // 4-5
        })
      }

      // Get proactive recommendations based on learning history
      const recommendations = debugAssistant.getProactiveRecommendations({
        context: 'React component development',
        riskLevel: 'medium'
      })

      expect(recommendations).toContain(
        expect.objectContaining({
          category: 'defensive programming',
          priority: expect.any(Number),
          action: expect.any(String),
          rationale: expect.stringContaining('historical patterns'),
          estimatedImpact: expect.any(String)
        })
      )

      // Should identify high-frequency patterns to prevent
      const preventionStrategies = debugAssistant.getPreventionStrategies({
        frequencyThreshold: 0.6 // Patterns that appear in 60%+ of sessions
      })

      expect(preventionStrategies).toContain(
        expect.objectContaining({
          pattern: expect.stringContaining('TypeError'),
          prevention: expect.stringContaining('null check'),
          implementation: expect.any(String),
          resources: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              title: expect.any(String),
              url: expect.any(String)
            })
          ])
        })
      )

      // Should generate personalized learning path
      const learningPath = debugAssistant.generateLearningPath({
        currentSkills: ['JavaScript', 'React'],
        commonErrors: ['TypeError', 'ReferenceError'],
        goals: ['improve debugging efficiency', 'reduce runtime errors']
      })

      expect(learningPath.modules).toContain(
        expect.objectContaining({
          title: expect.stringContaining('Defensive Programming'),
          lessons: expect.arrayContaining([
            expect.objectContaining({
              topic: expect.any(String),
              duration: expect.any(Number),
              prerequisites: expect.arrayContaining([])
            })
          ]),
          estimatedImpact: expect.any(String)
        })
      )
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle high-volume debugging sessions efficiently', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')
      const { VectorSearch } = await import('../../lib/vector_search')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Simulate 100 debug sessions
      const sessionPromises = []
      const startTime = Date.now()

      for (let i = 0; i < 100; i++) {
        const sessionPromise = (async () => {
          const sessionId = memoryManager.startSession({
            commandType: 'debug',
            sessionType: 'interactive',
            initialInput: `Debug session ${i}: Various errors`,
            deliverables: ['analysis']
          })

          await debugAssistant.analyzeError(`TypeError ${i}: Cannot read properties`)

          return sessionId
        })()

        sessionPromises.push(sessionPromise)
      }

      const sessionIds = await Promise.all(sessionPromises)
      const creationTime = Date.now() - startTime

      // Should create 100 sessions efficiently (< 5 seconds)
      expect(creationTime).toBeLessThan(5000)
      expect(sessionIds).toHaveLength(100)

      // Vector search should remain fast with large dataset
      const searchStartTime = Date.now()
      const searchResults = await vectorSearch.semanticSearch('TypeError debugging', {
        limit: 10,
        type: 'resolution'
      })
      const searchTime = Date.now() - searchStartTime

      expect(searchTime).toBeLessThan(1000) // < 1 second for search
      expect(searchResults.length).toBeLessThanOrEqual(10)

      // Memory queries should be performant
      const queryStartTime = Date.now()
      const analytics = memoryManager.getLearningAnalytics({
        timeRange: '30d',
        commandType: 'debug'
      })
      const queryTime = Date.now() - queryStartTime

      expect(queryTime).toBeLessThan(500) // < 500ms for analytics query
      expect(analytics.totalSessions).toBe(100)
    })
  })
})