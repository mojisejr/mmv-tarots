// Development Learning Journal - Debug Assistant Tests
// 🔴 RED Phase: These tests MUST fail before implementation

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { DebugAnalysis, DebugPlan, DebugSession } from '../lib/types/memory'

// Mock only what we need for specific tests

describe('Debug Assistant', () => {
  const TEST_DB_PATH = '.claude/memory/test_debug_assistant.db'

  beforeEach(async () => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Code Analysis', () => {
    it('should analyze error and identify root causes', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const errorMessage = `
        TypeError: Cannot read properties of undefined (reading 'user')
          at UserService.getCurrentUser (/app/services/user.ts:15:12)
          at UserController.getProfile (/app/controllers/user.ts:8:18)
          at RequestHandler.handle (/app/middleware/auth.ts:23:15)
      `

      const analysis: DebugAnalysis = await debugAssistant.analyzeError(errorMessage)

      expect(analysis).toBeDefined()
      expect(analysis.probableCause).toContain('undefined')
      expect(analysis.suggestedAction).toBeDefined()
      expect(analysis.confidence).toBeGreaterThan(0)
      expect(analysis.confidence).toBeLessThanOrEqual(1)
      expect(analysis.relatedFiles).toContain('/app/services/user.ts')
      expect(analysis.relatedFiles).toContain('/app/controllers/user.ts')
    })

    it('should suggest solutions with action plans', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const error = 'Cannot read properties of undefined (reading user)'
      const plan: DebugPlan = await debugAssistant.createDebugPlan(error)

      expect(plan).toBeDefined()
      expect(plan.rootCause).toBeDefined()
      expect(plan.actionSteps).toBeInstanceOf(Array)
      expect(plan.actionSteps.length).toBeGreaterThan(0)
      expect(plan.suggestedExperiment).toContain('/experiment')
      expect(plan.riskLevel).toMatch(/^(low|medium|high)$/)
      expect(plan.estimatedTime).toBeGreaterThan(0)
    })

    it('should read relevant code files for context', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const errorContext = {
        file: '/app/services/user.ts',
        line: 15,
        error: 'Cannot read properties of undefined (reading user)'
      }

      // Mock file content
      const mockFileContent = `
        export class UserService {
          async getCurrentUser(id: string) {
            const user = this.database.users.find(id) // Line 15 - potential null/undefined
            return user.profile // This could fail if user is undefined
          }
        }
      `

      const { readFile } = await import('fs/promises')
      vi.mocked(readFile).mockResolvedValue(mockFileContent)

      const analysis = await debugAssistant.analyzeCodeContext(errorContext)

      expect(analysis).toBeDefined()
      expect(analysis.probableCause).toContain('user')
      expect(readFile).toHaveBeenCalledWith('/app/services/user.ts', 'utf-8')
    })

    it('should identify patterns in error traces', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const commonErrors = [
        'TypeError: Cannot read properties of undefined',
        'TypeError: Cannot read properties of null',
        'ReferenceError: variable is not defined'
      ]

      const patterns = await debugAssistant.identifyErrorPatterns(commonErrors)

      expect(patterns).toBeDefined()
      expect(patterns.length).toBeGreaterThan(0)
      expect(patterns[0].type).toBeDefined()
      expect(patterns[0].frequency).toBeGreaterThan(0)
      expect(patterns[0].suggestedFix).toBeDefined()
    })
  })

  describe('Debug Session Management', () => {
    it('should create debug session with error details', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const errorDetails = {
        initialError: 'Failed to fetch user data',
        traceback: 'Error: Failed to fetch user data\n    at API.get (api.js:45:10)',
        reproductionSteps: '1. Navigate to profile\n2. Click refresh\n3. Error occurs'
      }

      const sessionId = await debugAssistant.startDebugSession(errorDetails)

      expect(sessionId).toBeDefined()
      expect(typeof sessionId).toBe('string')

      const session = debugAssistant.getDebugSession(sessionId)
      expect(session).toBeDefined()
      expect(session?.initial_error).toBe('Failed to fetch user data')
      expect(session?.error_traceback).toBeDefined()
      expect(session?.reproduction_steps).toBe('1. Navigate to profile\n2. Click refresh\n3. Error occurs')
    })

    it('should create debug chains for cascading errors', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      // Start main debug session
      const mainSessionId = await debugAssistant.startDebugSession({
        initialError: 'Database connection failed',
        traceback: 'Error: Database connection failed'
      })

      // Create sub-problems
      const subProblem1 = await debugAssistant.createSubProblem(mainSessionId, {
        initialError: 'Environment variables not loaded',
        chainLevel: 1
      })

      const subProblem2 = await debugAssistant.createSubProblem(mainSessionId, {
        initialError: 'Invalid database credentials',
        chainLevel: 1
      })

      expect(subProblem1).toBeDefined()
      expect(subProblem2).toBeDefined()
      expect(subProblem1).not.toBe(subProblem2)

      const chain = debugAssistant.getDebugChain(mainSessionId)
      expect(chain).toHaveLength(2)
      expect(chain.map(s => s.id)).toContain(subProblem1)
      expect(chain.map(s => s.id)).toContain(subProblem2)
    })

    it('should track error patterns across sessions', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      // Create sessions with similar errors
      const session1 = await debugAssistant.startDebugSession({
        initialError: 'Cannot read properties of undefined (reading user)',
        traceback: 'TypeError: Cannot read properties of undefined'
      })

      const session2 = await debugAssistant.startDebugSession({
        initialError: 'Cannot read properties of undefined (reading profile)',
        traceback: 'TypeError: Cannot read properties of undefined'
      })

      const patterns = debugAssistant.getErrorPatterns()
      expect(patterns.length).toBeGreaterThan(0)

      const undefinedPropertyPattern = patterns.find(p =>
        p.pattern.includes('Cannot read properties of undefined')
      )
      expect(undefinedPropertyPattern).toBeDefined()
      expect(undefinedPropertyPattern?.frequency).toBe(2)
      expect(undefinedPropertyPattern?.affectedSessions).toContain(session1)
      expect(undefinedPropertyPattern?.affectedSessions).toContain(session2)
    })

    it('should update debug session with AI analysis', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const sessionId = await debugAssistant.startDebugSession({
        initialError: 'API rate limit exceeded',
        traceback: 'Error: 429 Too Many Requests'
      })

      const aiAnalysis = {
        rootCause: 'Making too many API calls in short time',
        recommendedFix: 'Implement exponential backoff',
        codeChanges: {
          file: '/app/services/api.js',
          changes: 'Add rate limiting and retry logic'
        }
      }

      debugAssistant.updateSessionWithAIAnalysis(sessionId, aiAnalysis)

      const session = debugAssistant.getDebugSession(sessionId)
      expect(session?.ai_analysis).toContain('rootCause')
      expect(session?.ai_plan).toContain('recommendedFix')
      expect(session?.ai_changes).toEqual(aiAnalysis.codeChanges)
    })
  })

  describe('Active Investigation', () => {
    it('should perform comprehensive code investigation', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const errorMessage = 'Module not found: Can\'t resolve \'@utils/logger\''

      // Mock file system exploration
      const mockFiles = [
        '/app/src/components/UserComponent.tsx',
        '/app/src/services/userService.ts',
        '/app/src/utils/logger.js',  // Wrong extension
        '/app/package.json'
      ]

      const { readFile } = await import('fs/promises')
      vi.mocked(readFile).mockResolvedValue('export const logger = console.log')

      const investigation = await debugAssistant.performActiveInvestigation(errorMessage)

      expect(investment).toBeDefined()
      expect(investigation.rootCause).toBeDefined()
      expect(investigation.investigatedFiles).toContain('/app/src/utils/logger.js')
      expect(investigation.suggestedSolution).toContain('import path')
    })

    it('should analyze dependencies and imports', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const error = 'Cannot find module \'@/components/Button\''

      const packageJson = {
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        },
        devDependencies: {
          '@types/react': '^18.0.0'
        }
      }

      const tsConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['src/*']
          }
        }
      }

      const { readFile } = await import('fs/promises')
      vi.mocked(readFile)
        .mockResolvedValueOnce(JSON.stringify(packageJson))
        .mockResolvedValueOnce(JSON.stringify(tsConfig))

      const analysis = await debugAssistant.analyzeDependencies(error)

      expect(analysis).toBeDefined()
      expect(analysis.issue).toContain('path mapping')
      expect(analysis.resolution).toBeDefined()
    })

    it('should check environment configurations', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const error = 'DATABASE_URL is not defined'

      const envContent = `
        NODE_ENV=development
        PORT=3000
        # DATABASE_URL=postgresql://localhost:5432/myapp  # Commented out
      `

      const { readFile: readFileEnv } = await import('fs/promises')
      vi.mocked(readFileEnv).mockResolvedValue(envContent)

      const configAnalysis = await debugAssistant.analyzeEnvironmentConfig(error)

      expect(configAnalysis).toBeDefined()
      expect(configAnalysis.missingVariables).toContain('DATABASE_URL')
      expect(configAnalysis.suggestedFix).toContain('uncomment DATABASE_URL')
    })
  })

  describe('Pattern Recognition', () => {
    it('should recognize common error patterns', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const commonPatterns = [
        {
          error: 'TypeError: Cannot read properties of undefined (reading \'user\')',
          pattern: 'null_reference',
          frequency: 5,
          suggestedFix: 'Add null checks before property access'
        },
        {
          error: 'Module not found: Can\'t resolve',
          pattern: 'module_resolution',
          frequency: 3,
          suggestedFix: 'Check import paths and module installation'
        }
      ]

      debugAssistant.recordErrorPatterns(commonPatterns)

      const patterns = debugAssistant.getCommonPatterns()
      expect(patterns.length).toBe(2)
      expect(patterns[0].pattern).toBe('null_reference')
      expect(patterns[0].frequency).toBe(5)
    })

    it('should suggest prevention strategies', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const preventionStrategies = debugAssistant.getPreventionStrategies('null_reference')

      expect(preventionStrategies).toBeDefined()
      expect(preventionStrategies.length).toBeGreaterThan(0)
      expect(preventionStrategies[0].strategy).toBeDefined()
      expect(preventionStrategies[0].implementation).toBeDefined()
    })
  })

  describe('Learning Integration', () => {
    it('should connect debug sessions to learning insights', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      const sessionId = await debugAssistant.startDebugSession({
        initialError: 'Async function not awaited',
        traceback: 'UnhandledPromiseRejectionWarning'
      })

      const learning = {
        technicalInsight: 'Always handle promise rejections',
        pattern: 'Async/await error handling',
        prevention: 'Use try-catch blocks or .catch() handlers'
      }

      debugAssistant.connectToLearning(sessionId, learning)

      const session = debugAssistant.getDebugSession(sessionId)
      expect(session?.pattern_recognition).toContain('Async/await')
    })

    it('should generate insights from multiple debug sessions', async () => {
      const { DebugAssistant } = await import('../lib/debug_assistant')
      const debugAssistant = new DebugAssistant(TEST_DB_PATH)

      // Create multiple similar debug sessions
      const sessions = []
      for (let i = 0; i < 3; i++) {
        const sessionId = await debugAssistant.startDebugSession({
          initialError: 'Memory leak detected',
          traceback: `Memory leak in iteration ${i}`
        })
        sessions.push(sessionId)
      }

      const insights = debugAssistant.generateInsights(sessions)

      expect(insights).toBeDefined()
      expect(insights.recurringPattern).toBe('Memory leak')
      expect(insights.frequency).toBe(3)
      expect(insights.recommendedArchitectureChange).toBeDefined()
    })
  })
})