// Development Learning Journal - Debug Memory Integration Tests
// 🔴 RED Phase: These tests MUST fail before implementation

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Debug Assistant ↔ Memory Manager Integration', () => {
  const TEST_DB_PATH = '.claude/memory/test_debug_memory_integration.db'

  beforeEach(async () => {
    // Clean up test database before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Debug-to-Learning Workflow', () => {
    it('should create debug session and automatically save to memory', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Start a debug session
      const sessionId = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'debug-chain',
        initialInput: 'TypeError: Cannot read properties of undefined',
        deliverables: ['error analysis', 'solution plan', 'learning insights']
      })

      // Analyze error
      const analysis = await debugAssistant.analyzeError(
        'TypeError: Cannot read properties of undefined (reading \'name\')'
      )

      // Create debug plan
      const plan = await debugAssistant.createDebugPlan(analysis)

      // Simulate investigation and resolution
      const investigation = await debugAssistant.performActiveInvestigation({
        file: '/src/components/UserProfile.tsx',
        line: 45,
        context: 'const user = response.data; console.log(user.name);'
      })

      const resolution = {
        action: 'Added null check before property access',
        code: 'const user = response.data || {}; console.log(user?.name);',
        outcome: 'success',
        timeSpent: 15
      }

      // Complete session with retrospective
      const retrospective = await debugAssistant.completeSession(sessionId, {
        resolution,
        lessonsLearned: [
          'Always validate API response structure',
          'Use optional chaining for nested properties',
          'Add comprehensive error boundaries'
        ],
        patterns: ['Null Safety Pattern', 'API Response Validation'],
        effectivenessScore: 5
      })

      // Verify session was saved to memory with all data
      const savedSession = memoryManager.getSession(sessionId)
      expect(savedSession).toBeDefined()
      expect(savedSession?.status).toBe('completed')
      expect(savedSession?.deliverables).toContain('learning insights')

      // Verify retrospective data
      const savedRetrospective = memoryManager.getRetrospective(sessionId)
      expect(savedRetrospective).toBeDefined()
      expect(savedRetrospective?.lessons_learned).toContain('Always validate API response structure')
      expect(savedRetrospective?.effectiveness_score).toBe(5)

      // Verify debug patterns were extracted and saved
      const patterns = debugAssistant.getErrorPatterns()
      expect(patterns.length).toBeGreaterThan(0)
      expect(patterns[0]).toMatchObject({
        type: 'TypeError',
        frequency: expect.any(Number),
        prevention: expect.stringContaining('null check')
      })
    })

    it('should enable cross-session learning through vector search', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { VectorSearch } = await import('../../lib/vector_search')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Simulate previous debug sessions
      await vectorSearch.indexSession('session-1', 'Fixed TypeError by adding null check', {
        type: 'resolution',
        errorType: 'TypeError',
        solution: 'Add null check before property access',
        effectiveness: 5
      })

      await vectorSearch.indexSession('session-2', 'Handled undefined API response', {
        type: 'resolution',
        errorType: 'TypeError',
        solution: 'Validate API response structure',
        effectiveness: 4
      })

      // Start new debug session with similar error
      const analysis = await debugAssistant.analyzeError(
        'TypeError: Cannot read properties of undefined (reading \'email\')'
      )

      // Search for related solutions
      const relatedSolutions = await vectorSearch.semanticSearch('TypeError undefined property access', {
        type: 'resolution',
        limit: 3
      })

      expect(relatedSolutions).toHaveLength(2)
      expect(relatedSolutions[0].metadata.errorType).toBe('TypeError')
      expect(relatedSolutions[0].metadata.solution).toContain('null check')
      expect(relatedSolutions[0].similarity_score).toBeGreaterThan(0.7)

      // Debug assistant should use vector search results for enhanced analysis
      const enhancedAnalysis = await debugAssistant.analyzeErrorWithContext(
        'TypeError: Cannot read properties of undefined (reading \'email\')',
        relatedSolutions
      )

      expect(enhancedAnalysis.suggestedSolutions).toContain(
        expect.objectContaining({
          action: 'Add null check before property access',
          confidence: expect.any(Number),
          basedOnSimilarCases: true
        })
      )
    })

    it('should automatically detect and record debug patterns', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Simulate multiple debug sessions with similar errors
      const errors = [
        'TypeError: Cannot read properties of undefined (reading \'name\')',
        'TypeError: Cannot read properties of undefined (reading \'email\')',
        'TypeError: Cannot read properties of undefined (reading \'address\')',
        'TypeError: Cannot read properties of null (reading \'id\')',
        'ReferenceError: user is not defined'
      ]

      for (let i = 0; i < errors.length; i++) {
        const sessionId = memoryManager.startSession({
          commandType: '/debug',
          sessionType: 'debug-chain',
          initialInput: errors[i],
          deliverables: ['error analysis']
        })

        const analysis = await debugAssistant.analyzeError(errors[i])

        await debugAssistant.recordPattern(sessionId, {
          errorType: analysis.errorType,
          pattern: analysis.pattern,
          frequency: 1
        })
      }

      // Check if patterns were automatically detected and recorded
      const recordedPatterns = debugAssistant.getErrorPatterns()

      // Should have detected TypeError as a common pattern
      const typeErrorPattern = recordedPatterns.find(p => p.type === 'TypeError')
      expect(typeErrorPattern).toBeDefined()
      expect(typeErrorPattern?.frequency).toBeGreaterThanOrEqual(4)
      expect(typeErrorPattern?.prevention).toContain('null check')

      // Should have ReferenceError pattern too
      const referenceErrorPattern = recordedPatterns.find(p => p.type === 'ReferenceError')
      expect(referenceErrorPattern).toBeDefined()
      expect(referenceErrorPattern?.frequency).toBe(1)

      // Patterns should be searchable through memory manager
      const searchResults = memoryManager.searchPatterns({
        errorType: 'TypeError',
        limit: 10
      })

      expect(searchResults.length).toBeGreaterThan(0)
      expect(searchResults[0]).toMatchObject({
        error_type: 'TypeError',
        prevention: expect.stringContaining('null')
      })
    })
  })

  describe('Memory System Integration', () => {
    it('should persist debug sessions and enable learning analytics', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Create multiple debug sessions over time
      const sessions = []
      for (let i = 0; i < 5; i++) {
        const sessionId = memoryManager.startSession({
          commandType: '/debug',
          sessionType: 'debug-chain',
          initialInput: `Debug session ${i + 1}: API timeout error`,
          deliverables: ['analysis', 'solution']
        })

        const analysis = await debugAssistant.analyzeError('Request timeout after 5000ms')

        await debugAssistant.completeSession(sessionId, {
          resolution: { action: 'Implemented retry logic', outcome: 'success' },
          lessonsLearned: [`Lesson learned ${i + 1}`],
          patterns: ['Timeout Pattern'],
          effectivenessScore: Math.floor(Math.random() * 5) + 1
        })

        sessions.push(sessionId)
      }

      // Get learning analytics
      const analytics = memoryManager.getLearningAnalytics({
        timeRange: '7d',
        commandType: 'debug'
      })

      expect(analytics.totalSessions).toBe(5)
      expect(analytics.averageEffectiveness).toBeGreaterThan(0)
      expect(analytics.commonPatterns).toContain('Timeout Pattern')
      expect(analytics.topLessons).toHaveLength(5)

      // Should identify improvement opportunities
      const improvements = memoryManager.getImprovementOpportunities()
      expect(improvements.length).toBeGreaterThan(0)
      expect(improvements[0]).toMatchObject({
        pattern: expect.any(String),
        frequency: expect.any(Number),
        suggestion: expect.any(String),
        impact: expect.any(String)
      })
    })

    it('should enable retrospective analysis and learning extraction', async () => {
      const { DebugAssistant } = await import('../../lib/debug_assistant')
      const { MemoryManager } = await import('../../lib/memory_manager')

      const debugAssistant = new DebugAssistant(TEST_DB_PATH)
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Complete a complex debug session
      const sessionId = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'debug-chain',
        initialInput: 'Complex state management issue in React component',
        deliverables: ['root cause analysis', 'prevention strategies']
      })

      const investigation = await debugAssistant.performActiveInvestigation({
        file: '/src/components/DataGrid.tsx',
        context: 'Complex useEffect dependencies causing infinite re-renders',
        duration: 45,
        steps: [
          'Identified render loop',
          'Analyzed dependency array',
          'Found stale closure issue'
        ]
      })

      const retrospective = await debugAssistant.completeSession(sessionId, {
        resolution: {
          action: 'Fixed useEffect dependencies and added useCallback',
          outcome: 'resolved',
          timeSpent: 45
        },
        lessonsLearned: [
          'Always include all dependencies in useEffect',
          'Use useCallback for stable function references',
          'Consider using custom hooks for complex state logic'
        ],
        patterns: [
          'React Hook Dependency Pattern',
          'Stale Closure Prevention Pattern'
        ],
        effectivenessScore: 5
      })

      // Extract learning insights from retrospective
      const insights = debugAssistant.extractLearningInsights(retrospective)

      expect(insights.keyTakeaways).toContain(
        expect.stringContaining('useEffect dependencies')
      )
      expect(insights.actionablePatterns).toHaveLength(2)
      expect(insights.preventiveMeasures).toContain(
        expect.stringContaining('useCallback')
      )

      // Insights should be searchable and rankable
      const relatedInsights = memoryManager.searchLearningInsights({
        query: 'React hooks useEffect',
        limit: 5
      })

      expect(relatedInsights.length).toBeGreaterThan(0)
      expect(relatedInsights[0]).toMatchObject({
        insight: expect.any(String),
        sessionId: sessionId,
        relevanceScore: expect.any(Number),
        applicableContexts: expect.arrayContaining(['React components'])
      })
    })
  })
})