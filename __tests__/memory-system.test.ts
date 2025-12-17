import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryManager } from '../lib/memory_manager'
import { DevSession, DevRetrospective } from '../types/memory'
import { promises as fs } from 'fs'

describe('MemoryManager', () => {
  const TEST_DB_PATH = '.tmp/test_dev_memory.db'
  let memoryManager: MemoryManager

  beforeEach(async () => {
    // Clean up any existing test database
    try {
      await fs.unlink(TEST_DB_PATH)
    } catch {
      // File doesn't exist, that's fine
    }

    memoryManager = new MemoryManager(TEST_DB_PATH)
    await memoryManager.initialize()
  })

  afterEach(async () => {
    if (memoryManager) {
      memoryManager.close()
    }

    // Clean up test database
    try {
      await fs.unlink(TEST_DB_PATH)
    } catch {
      // File doesn't exist, that's fine
    }
  })

  describe('Development Sessions', () => {
    it('should create a new development session', async () => {
      const session: Omit<DevSession, 'id' | 'timestamp'> = {
        command_type: '/impl',
        session_type: 'feature',
        status: 'active',
        initial_input: 'Implement user authentication',
        deliverables: ['login component', 'auth API'],
        duration_minutes: null
      }

      const sessionId = await memoryManager.createSession(session)

      expect(sessionId).toBeDefined()
      expect(typeof sessionId).toBe('string')
    })

    it('should retrieve a development session by ID', async () => {
      const session: Omit<DevSession, 'id' | 'timestamp'> = {
        command_type: '/impl',
        session_type: 'feature',
        status: 'active',
        initial_input: 'Implement user authentication',
        deliverables: ['login component', 'auth API'],
        duration_minutes: null
      }

      const sessionId = await memoryManager.createSession(session)
      const retrieved = await memoryManager.getSession(sessionId)

      expect(retrieved).toBeDefined()
      expect(retrieved!.command_type).toBe('/impl')
      expect(retrieved!.session_type).toBe('feature')
      expect(retrieved!.initial_input).toBe('Implement user authentication')
      expect(retrieved!.deliverables).toEqual(['login component', 'auth API'])
      expect(retrieved!.status).toBe('active')
    })

    it('should update session status to completed', async () => {
      const session: Omit<DevSession, 'id' | 'timestamp'> = {
        command_type: '/impl',
        session_type: 'feature',
        status: 'active',
        initial_input: 'Implement user authentication',
        deliverables: ['login component', 'auth API'],
        duration_minutes: null
      }

      const sessionId = await memoryManager.createSession(session)
      const updated = await memoryManager.updateSessionStatus(sessionId, 'completed', 45)

      expect(updated).toBe(true)

      const retrieved = await memoryManager.getSession(sessionId)
      expect(retrieved!.status).toBe('completed')
      expect(retrieved!.duration_minutes).toBe(45)
    })

    it('should list recent sessions', async () => {
      // Create multiple sessions
      const sessionId1 = await memoryManager.createSession({
        command_type: '/impl',
        session_type: 'feature',
        status: 'completed',
        initial_input: 'Implement user authentication',
        deliverables: ['login component'],
        duration_minutes: 30
      })

      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))

      const sessionId2 = await memoryManager.createSession({
        command_type: '/debug',
        session_type: 'bug-fix',
        status: 'active',
        initial_input: 'Fix login error',
        deliverables: ['error fix'],
        duration_minutes: null
      })

      const recentSessions = await memoryManager.getRecentSessions(10)

      expect(recentSessions).toHaveLength(2)

      // Verify both sessions are present (order might vary if timestamps are close)
      const sessionInputs = recentSessions.map(s => s.initial_input)
      expect(sessionInputs).toContain('Implement user authentication')
      expect(sessionInputs).toContain('Fix login error')
    })
  })

  describe('Development Retrospectives', () => {
    it('should create a retrospective for a session', async () => {
      // First create a session
      const session: Omit<DevSession, 'id' | 'timestamp'> = {
        command_type: '/impl',
        session_type: 'feature',
        status: 'completed',
        initial_input: 'Implement user authentication',
        deliverables: ['login component'],
        duration_minutes: 45
      }

      const sessionId = await memoryManager.createSession(session)

      // Then create a retrospective
      const retrospective: Omit<DevRetrospective, 'id'> = {
        session_id: sessionId,
        approaches_used: ['TDD', 'React Hooks'],
        design_patterns: ['Strategy Pattern'],
        problems_encountered: 'TypeScript type errors with context',
        user_taught_ai: 'Authentication flow requirements',
        ai_taught_user: 'Use useEffect for auth state management',
        lessons_learned: 'Always test authentication flows with different user roles',
        quality_score: 4,
        learning_score: 5
      }

      const retrospectiveId = await memoryManager.createRetrospective(retrospective)

      expect(retrospectiveId).toBeDefined()
      expect(typeof retrospectiveId).toBe('string')
    })

    it('should retrieve retrospective by session ID', async () => {
      // Create a session
      const sessionId = await memoryManager.createSession({
        command_type: '/impl',
        session_type: 'feature',
        status: 'completed',
        initial_input: 'Implement user authentication',
        deliverables: ['login component'],
        duration_minutes: 45
      })

      // Create a retrospective
      await memoryManager.createRetrospective({
        session_id: sessionId,
        approaches_used: ['TDD', 'React Hooks'],
        design_patterns: ['Strategy Pattern'],
        problems_encountered: 'TypeScript type errors',
        user_taught_ai: 'Auth requirements',
        ai_taught_user: 'useEffect for auth state',
        lessons_learned: 'Test with different user roles',
        quality_score: 4,
        learning_score: 5
      })

      // Retrieve the retrospective
      const retrospective = await memoryManager.getRetrospectiveBySession(sessionId)

      expect(retrospective).toBeDefined()
      expect(retrospective!.session_id).toBe(sessionId)
      expect(retrospective!.approaches_used).toEqual(['TDD', 'React Hooks'])
      expect(retrospective!.lessons_learned).toBe('Test with different user roles')
    })

    it('should search sessions by keyword', async () => {
      // Create sessions with different keywords
      await memoryManager.createSession({
        command_type: '/impl',
        session_type: 'feature',
        status: 'completed',
        initial_input: 'Implement user authentication with JWT',
        deliverables: ['login component', 'JWT handling'],
        duration_minutes: 45
      })

      await memoryManager.createSession({
        command_type: '/debug',
        session_type: 'bug-fix',
        status: 'completed',
        initial_input: 'Fix database connection issues',
        deliverables: ['database fix'],
        duration_minutes: 20
      })

      // Search for authentication-related sessions
      const authResults = await memoryManager.searchSessions('authentication')
      const dbResults = await memoryManager.searchSessions('database')

      expect(authResults).toHaveLength(1)
      expect(authResults[0].initial_input).toContain('authentication')

      expect(dbResults).toHaveLength(1)
      expect(dbResults[0].initial_input).toContain('database')
    })
  })

  describe('Learning Analytics', () => {
    it('should calculate learning statistics', async () => {
      // Create a session with retrospective
      const sessionId = await memoryManager.createSession({
        command_type: '/impl',
        session_type: 'feature',
        status: 'completed',
        initial_input: 'Implement user authentication',
        deliverables: ['login component'],
        duration_minutes: 45
      })

      await memoryManager.createRetrospective({
        session_id: sessionId,
        approaches_used: ['TDD', 'React Hooks'],
        design_patterns: ['Strategy Pattern'],
        problems_encountered: 'TypeScript errors',
        user_taught_ai: 'Auth flow requirements',
        ai_taught_user: 'React best practices',
        lessons_learned: 'Test with user roles',
        quality_score: 4,
        learning_score: 5
      })

      const stats = await memoryManager.getLearningStats()

      expect(stats.total_sessions).toBe(1)
      expect(stats.completed_sessions).toBe(1)
      expect(stats.total_learning_hours).toBeCloseTo(0.75, 1) // 45 minutes
      expect(stats.average_quality_score).toBe(4)
      expect(stats.average_learning_score).toBe(5)
    })
  })
})