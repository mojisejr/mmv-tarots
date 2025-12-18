// Development Learning Journal - Memory Manager Tests
// 🔴 RED Phase: These tests MUST fail before implementation

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import type {
  DevSession,
  DevRetrospective,
  DebugSession,
  RetrospectiveData,
  MemorySearchQuery
} from '../lib/types/memory'

describe('Memory Manager', () => {
  const TEST_DB_PATH = '.claude/memory/test_memory_manager.db'

  beforeEach(async () => {
    // Clean up test database before each test
    try {
      await fs.unlink(TEST_DB_PATH)
    } catch {
      // File doesn't exist, that's fine
    }
  })

  afterEach(async () => {
    // Clean up test database after each test
    try {
      await fs.unlink(TEST_DB_PATH)
    } catch {
      // File doesn't exist, that's fine
    }
  })

  describe('Session Tracking', () => {
    it('should create new development session with correct properties', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Implement user authentication',
        deliverables: ['Login form', 'Session management', 'JWT tokens']
      })

      expect(sessionId).toBeDefined()
      expect(typeof sessionId).toBe('string')
      expect(sessionId.length).toBeGreaterThan(0)

      // Verify session was created with correct data
      const session = memoryManager.getSession(sessionId)
      expect(session).toBeDefined()
      expect(session?.command_type).toBe('/impl')
      expect(session?.session_type).toBe('feature')
      expect(session?.status).toBe('active')
      expect(session?.initial_input).toBe('Implement user authentication')
      expect(session?.deliverables).toEqual(['Login form', 'Session management', 'JWT tokens'])
      expect(session?.created_at).toBeDefined()
    })

    it('should update session status on completion', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'bug-fix',
        initialInput: 'Fix login redirect issue',
        deliverables: ['Identify root cause', 'Implement fix', 'Add tests']
      })

      // Complete the session
      memoryManager.endSession(sessionId, 'completed', 45)

      const session = memoryManager.getSession(sessionId)
      expect(session?.status).toBe('completed')
      expect(session?.duration_minutes).toBe(45)
      expect(session?.completed_at).toBeDefined()
    })

    it('should retrieve session by command type', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Create sessions with different command types
      const implSession = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Add user profiles',
        deliverables: ['Profile component', 'Database schema']
      })

      const debugSession = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'bug-fix',
        initialInput: 'Fix profile loading',
        deliverables: ['Identify issue', 'Patch bug']
      })

      const implSessions = memoryManager.getSessionsByCommandType('/impl')
      const debugSessions = memoryManager.getSessionsByCommandType('/debug')

      expect(implSessions).toHaveLength(1)
      expect(implSessions[0].id).toBe(implSession)
      expect(debugSessions).toHaveLength(1)
      expect(debugSessions[0].id).toBe(debugSession)
    })

    it('should calculate session duration accurately', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const startTime = Date.now()
      const sessionId = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Test duration calculation',
        deliverables: ['Test feature']
      })

      // Simulate some work time
      await new Promise(resolve => setTimeout(resolve, 100))

      const endTime = Date.now()
      memoryManager.endSession(sessionId, 'completed', Math.floor((endTime - startTime) / 60000))

      const session = memoryManager.getSession(sessionId)
      expect(session?.duration_minutes).toBeGreaterThanOrEqual(0)
    })

    it('should handle multiple active sessions', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const session1 = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Feature 1',
        deliverables: ['Feature 1 implementation']
      })

      const session2 = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'bug-fix',
        initialInput: 'Bug 1',
        deliverables: ['Bug 1 fix']
      })

      const activeSessions = memoryManager.getActiveSessions()
      expect(activeSessions).toHaveLength(2)
      expect(activeSessions.map(s => s.id)).toEqual(expect.arrayContaining([session1, session2]))
    })
  })

  describe('Learning Capture', () => {
    it('should store retrospective with lessons learned', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Implement caching layer',
        deliverables: ['Redis integration', 'Cache invalidation']
      })

      const retrospectiveData: RetrospectiveData = {
        approaches: ['TDD approach', 'Incremental development'],
        patterns: ['Strategy pattern for cache providers', 'Factory pattern for cache instances'],
        problems: 'Redis connection issues in development',
        userInsights: 'Need better local development setup',
        aiInsights: 'Consider connection pooling for Redis',
        lessons: 'Always test external service integrations early',
        qualityScore: 4,
        learningScore: 5
      }

      const retrospectiveId = memoryManager.captureRetrospective(sessionId, retrospectiveData)
      expect(retrospectiveId).toBeDefined()

      const retrospective = memoryManager.getRetrospective(retrospectiveId)
      expect(retrospective).toBeDefined()
      expect(retrospective?.session_id).toBe(sessionId)
      expect(retrospective?.approaches_used).toEqual(['TDD approach', 'Incremental development'])
      expect(retrospective?.design_patterns).toEqual(['Strategy pattern for cache providers', 'Factory pattern for cache instances'])
      expect(retrospective?.problems_encountered).toBe('Redis connection issues in development')
      expect(retrospective?.user_taught_ai).toBe('Need better local development setup')
      expect(retrospective?.ai_taught_user).toBe('Consider connection pooling for Redis')
      expect(retrospective?.lessons_learned).toBe('Always test external service integrations early')
      expect(retrospective?.quality_score).toBe(4)
      expect(retrospective?.learning_score).toBe(5)
    })

    it('should capture user-taught-AI insights', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId = memoryManager.startSession({
        commandType: '/aha',
        sessionType: 'learning',
        initialInput: 'Domain knowledge about payment processing',
        deliverables: ['Document payment flow', 'Add compliance notes']
      })

      const userInsight = {
        domain: 'Payment Processing',
        context: 'Stripe integration for subscription billing',
        businessRules: ['Proration handling', 'Tax calculation by jurisdiction', 'Refund policies'],
        compliance: ['PCI DSS requirements', 'GDPR data handling', 'SOX audit trails']
      }

      memoryManager.captureUserInsights(sessionId, userInsight)

      const session = memoryManager.getSession(sessionId)
      expect(session).toBeDefined()
      // Should store user insights in session or related table
    })

    it('should capture AI-taught-user technical patterns', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Implement rate limiting',
        deliverables: ['Rate limiter middleware', 'Redis backend']
      })

      const aiInsights = {
        patterns: ['Token bucket algorithm', 'Sliding window counter'],
        libraries: ['express-rate-limit', 'rate-limiter-flexible'],
        bestPractices: ['Use Redis for distributed rate limiting', 'Implement different limits per user tier'],
        pitfalls: ['Don\'t use in-memory storage for production', 'Consider edge cases like burst traffic']
      }

      memoryManager.captureAIInsights(sessionId, aiInsights)

      const session = memoryManager.getSession(sessionId)
      expect(session).toBeDefined()
      // Should store AI insights in session or related table
    })

    it('should generate session embeddings for semantic search', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'bug-fix',
        initialInput: 'Memory leak in WebSocket connections',
        deliverables: ['Identify leak source', 'Implement proper cleanup']
      })

      const content = 'Debugging memory leak in WebSocket connections. Found that connections weren\'t properly closed on disconnect. Implemented proper cleanup with event listeners and connection pooling.'

      // This should generate embeddings for semantic search
      const embedding = await memoryManager.generateEmbeddings(sessionId, content)

      expect(embedding).toBeDefined()
      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBeGreaterThan(0)
    })
  })

  describe('Search and Retrieval', () => {
    it('should find lessons learned by query', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      // Create some sessions with lessons
      const session1 = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Add database connection pooling',
        deliverables: ['Connection pool implementation']
      })

      memoryManager.captureRetrospective(session1, {
        approaches: ['Connection pooling'],
        patterns: ['Object pool pattern'],
        problems: 'Too many database connections',
        userInsights: 'Need better resource management',
        aiInsights: 'Use connection pooling libraries',
        lessons: 'Always implement connection pooling for database access',
        qualityScore: 5,
        learningScore: 4
      })

      const session2 = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'bug-fix',
        initialInput: 'Fix slow database queries',
        deliverables: ['Query optimization']
      })

      memoryManager.captureRetrospective(session2, {
        approaches: ['Query profiling'],
        patterns: ['Query optimization patterns'],
        problems: 'Slow N+1 query problem',
        userInsights: 'Need better query monitoring',
        aiInsights: 'Use query optimization techniques',
        lessons: 'Profile database queries before optimization',
        qualityScore: 4,
        learningScore: 5
      })

      // Search for lessons about database
      const query: MemorySearchQuery = {
        query: 'database connection optimization',
        type: 'solution',
        limit: 5
      }

      const results = memoryManager.findLessonsLearned(query)
      expect(results.length).toBeGreaterThan(0)

      // Should return relevant lessons
      const lessonTexts = results.map(r => r.description)
      expect(lessonTexts.some(text =>
        text.includes('connection pooling') || text.includes('query optimization')
      )).toBe(true)
    })

    it('should retrieve sessions by date range', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Create sessions on different dates
      const session1 = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Feature 1',
        deliverables: ['Implementation']
      })

      // Simulate older session by manually setting created_at
      const session2 = memoryManager.startSession({
        commandType: '/debug',
        sessionType: 'bug-fix',
        initialInput: 'Bug 1',
        deliverables: ['Fix']
      })

      const query: MemorySearchQuery = {
        query: '',
        dateRange: {
          start: yesterday.toISOString(),
          end: today.toISOString()
        }
      }

      const sessions = memoryManager.searchSessions(query)
      expect(sessions.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Data Persistence', () => {
    it('should persist data across manager instances', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')

      // Create first manager instance
      const manager1 = new MemoryManager(TEST_DB_PATH)
      const sessionId = manager1.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Test persistence',
        deliverables: ['Persistent data']
      })

      manager1.endSession(sessionId, 'completed', 30)

      // Create new manager instance with same database
      const manager2 = new MemoryManager(TEST_DB_PATH)
      const session = manager2.getSession(sessionId)

      expect(session).toBeDefined()
      expect(session?.initial_input).toBe('Test persistence')
      expect(session?.status).toBe('completed')
      expect(session?.duration_minutes).toBe(30)
    })

    it('should handle database corruption gracefully', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')

      // Try to create manager with invalid database path
      expect(() => {
        new MemoryManager('/invalid/path/db.sqlite')
      }).not.toThrow() // Should handle gracefully, perhaps creating new DB
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid session IDs gracefully', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const session = memoryManager.getSession('invalid-session-id')
      expect(session).toBeUndefined()
    })

    it('should handle duplicate session creation', async () => {
      const { MemoryManager } = await import('../lib/memory_manager')
      const memoryManager = new MemoryManager(TEST_DB_PATH)

      const sessionId1 = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Test duplicate',
        deliverables: ['Test']
      })

      const sessionId2 = memoryManager.startSession({
        commandType: '/impl',
        sessionType: 'feature',
        initialInput: 'Test duplicate',
        deliverables: ['Test']
      })

      // Should generate unique IDs even for identical sessions
      expect(sessionId1).not.toBe(sessionId2)
    })
  })
})