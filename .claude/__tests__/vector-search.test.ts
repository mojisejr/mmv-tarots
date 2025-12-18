// Development Learning Journal - Vector Search Tests
// 🔴 RED Phase: These tests MUST fail before implementation

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { VectorSearchResult, MemorySearchQuery } from '../lib/types/memory'

describe('Vector Search', () => {
  const TEST_DB_PATH = '.claude/memory/test_vector_search.db'

  beforeEach(async () => {
    // Mock embedding generation
    vi.mock('../lib/embeddings', () => ({
      generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5])
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Semantic Search', () => {
    it('should find similar past problems by semantic meaning', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Index some sample problems
      await vectorSearch.indexSession('session-1', 'Database connection pool exhausted', {
        type: 'problem',
        solution: 'Implement connection pooling with proper cleanup',
        effectiveness: 4
      })

      await vectorSearch.indexSession('session-2', 'API rate limiting issues', {
        type: 'problem',
        solution: 'Add exponential backoff retry logic',
        effectiveness: 5
      })

      await vectorSearch.indexSession('session-3', 'Memory leak in WebSocket connections', {
        type: 'problem',
        solution: 'Implement proper connection cleanup on disconnect',
        effectiveness: 5
      })

      // Search for similar problem
      const query = 'database performance issues with too many connections'
      const results = await vectorSearch.semanticSearch(query, { limit: 3, type: 'problem' })

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('session-1') // Should match database connection issues
      expect(results[0].similarity_score).toBeGreaterThan(0.5)
      expect(results[0].metadata.type).toBe('problem')
    })

    it('should rank solutions by effectiveness score', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Index solutions with different effectiveness scores
      await vectorSearch.indexSession('solution-1', 'Quick fix with patch', {
        type: 'solution',
        effectiveness: 2,
        problem: 'Database timeout'
      })

      await vectorSearch.indexSession('solution-2', 'Proper connection pooling implementation', {
        type: 'solution',
        effectiveness: 5,
        problem: 'Database timeout'
      })

      await vectorSearch.indexSession('solution-3', 'Database query optimization', {
        type: 'solution',
        effectiveness: 4,
        problem: 'Database timeout'
      })

      const query = 'database timeout solutions'
      const results = await vectorSearch.semanticSearch(query, { type: 'solution' })

      expect(results).toBeDefined()
      expect(results.length).toBe(3)

      // Should rank by both similarity and effectiveness
      expect(results[0].metadata.effectiveness).toBe(5) // Most effective first
      expect(results[1].metadata.effectiveness).toBe(4)
      expect(results[2].metadata.effectiveness).toBe(2)
    })

    it('should retrieve debug patterns for error types', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Index debug patterns
      await vectorSearch.indexSession('pattern-1', 'null reference errors when accessing object properties', {
        type: 'pattern',
        errorType: 'TypeError',
        prevention: 'Add null checks before property access',
        frequency: 15
      })

      await vectorSearch.indexSession('pattern-2', 'async function promise rejection unhandled', {
        type: 'pattern',
        errorType: 'UnhandledPromiseRejectionWarning',
        prevention: 'Use try-catch blocks with async/await',
        frequency: 8
      })

      const query = 'TypeError undefined property access'
      const patterns = await vectorSearch.findDebugPatterns(query)

      expect(patterns).toBeDefined()
      expect(patterns.length).toBeGreaterThan(0)
      expect(patterns[0].metadata.errorType).toBe('TypeError')
      expect(patterns[0].metadata.prevention).toContain('null checks')
    })

    it('should suggest prevention strategies based on history', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Index prevention strategies
      await vectorSearch.indexSession('prevention-1', 'Connection pool management for databases', {
        type: 'prevention',
        problemCategory: 'database',
        strategy: 'Always use connection pooling',
        implementation: 'Configure max pool size and timeout'
      })

      await vectorSearch.indexSession('prevention-2', 'Error handling for API calls', {
        type: 'prevention',
        problemCategory: 'network',
        strategy: 'Implement comprehensive error handling',
        implementation: 'Use try-catch with proper error types'
      })

      const query = 'database connection issues prevention'
      const strategies = await vectorSearch.findPreventionStrategies(query)

      expect(strategies).toBeDefined()
      expect(strategies.length).toBeGreaterThan(0)
      expect(strategies[0].metadata.problemCategory).toBe('database')
      expect(strategies[0].metadata.strategy).toContain('connection pooling')
    })
  })

  describe('Embedding Generation', () => {
    it('should generate embeddings for session content', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      const content = 'Fixed memory leak by implementing proper cleanup in useEffect'
      const embedding = await vectorSearch.generateEmbedding(content)

      expect(embedding).toBeDefined()
      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBeGreaterThan(0)
      expect(typeof embedding[0]).toBe('number')
    })

    it('should handle long content by chunking', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      const longContent = 'A'.repeat(10000) // Very long content
      const embeddings = await vectorSearch.generateEmbedding(longContent)

      expect(embeddings).toBeDefined()
      expect(Array.isArray(embeddings)).toBe(true)
      // Should handle long content gracefully
    })

    it('should cache embeddings for identical content', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      const content = 'Database connection pooling implementation'

      const { generateEmbedding } = await import('../lib/embeddings')
      const mockGenerate = vi.mocked(generateEmbedding)

      // First call
      await vectorSearch.generateEmbedding(content)
      // Second call with same content
      await vectorSearch.generateEmbedding(content)

      // Should only call generation once due to caching
      expect(mockGenerate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Vector Database Operations', () => {
    it('should create and populate vector tables', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      await vectorSearch.initializeDatabase()

      // Should create vector search tables
      const tableInfo = vectorSearch.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='vss_sessions'
      `).all()

      expect(tableInfo).toHaveLength(1)
      expect(tableInfo[0].name).toBe('vss_sessions')
    })

    it('should insert and retrieve vectors efficiently', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      const sessionId = 'test-session-1'
      const embedding = [0.1, 0.2, 0.3, 0.4, 0.5]

      await vectorSearch.insertVector(sessionId, embedding, {
        type: 'test',
        content: 'test content'
      })

      const retrieved = vectorSearch.getVector(sessionId)
      expect(retrieved).toEqual(embedding)
    })

    it('should perform similarity search with vector math', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Insert test vectors
      await vectorSearch.insertVector('item-1', [1, 0, 0], { type: 'similar' })
      await vectorSearch.insertVector('item-2', [0, 1, 0], { type: 'different' })
      await vectorSearch.insertVector('item-3', [0.9, 0.1, 0], { type: 'similar' })

      // Search for similar to [1, 0, 0]
      const queryVector = [1, 0, 0]
      const results = await vectorSearch.similaritySearch(queryVector, 2)

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('item-1') // Perfect match
      expect(results[0].similarity_score).toBeCloseTo(1.0, 2)
      expect(results[1].id).toBe('item-3') // Similar but not perfect
      expect(results[1].similarity_score).toBeGreaterThan(0.8)
    })
  })

  describe('Learning Integration', () => {
    it('should index session retrospectives for learning', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      const retrospective = {
        sessionId: 'session-123',
        lessonsLearned: [
          'Always implement proper error handling',
          'Use connection pooling for database operations',
          'Test edge cases before deployment'
        ],
        patterns: ['Error handling pattern', 'Resource management pattern'],
        effectivenessScore: 4
      }

      await vectorSearch.indexRetrospective(retrospective)

      const searchQuery = 'database error handling best practices'
      const results = await vectorSearch.semanticSearch(searchQuery, { type: 'learning' })

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].metadata.sessionId).toBe('session-123')
    })

    it('should find related learning across different sessions', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Index multiple retrospectives with related content
      await vectorSearch.indexRetrospective({
        sessionId: 'session-1',
        lessonsLearned: ['Use async/await for better error handling'],
        patterns: ['Async pattern'],
        effectivenessScore: 5
      })

      await vectorSearch.indexRetrospective({
        sessionId: 'session-2',
        lessonsLearned: ['Implement promise rejection handling'],
        patterns: ['Promise pattern'],
        effectivenessScore: 4
      })

      await vectorSearch.indexRetrospective({
        sessionId: 'session-3',
        lessonsLearned: ['Database query optimization techniques'],
        patterns: ['Performance pattern'],
        effectivenessScore: 3
      })

      const query = 'async programming error handling'
      const relatedLearning = await vectorSearch.findRelatedLearning(query, 2)

      expect(relatedLearning).toHaveLength(2)
      expect(relatedLearning.map(r => r.sessionId)).toContain('session-1')
      expect(relatedLearning.map(r => r.sessionId)).toContain('session-2')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large number of vectors efficiently', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Insert 1000 test vectors
      const insertPromises = []
      for (let i = 0; i < 1000; i++) {
        const embedding = Array.from({ length: 10 }, () => Math.random())
        insertPromises.push(
          vectorSearch.insertVector(`item-${i}`, embedding, { type: 'test', index: i })
        )
      }

      const startTime = Date.now()
      await Promise.all(insertPromises)
      const insertTime = Date.now() - startTime

      expect(insertTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Test search performance
      const searchStartTime = Date.now()
      const results = await vectorSearch.similaritySearch([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 10)
      const searchTime = Date.now() - searchStartTime

      expect(searchTime).toBeLessThan(1000) // Search should complete within 1 second
      expect(results).toHaveLength(10)
    })

    it('should maintain search accuracy at scale', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Create clusters of similar vectors
      const cluster1Embedding = [1, 0, 0, 0, 0]
      const cluster2Embedding = [0, 1, 0, 0, 0]

      // Insert cluster 1
      for (let i = 0; i < 100; i++) {
        const variation = cluster1Embedding.map(v => v + (Math.random() - 0.5) * 0.1)
        await vectorSearch.insertVector(`cluster1-${i}`, variation, { cluster: 1 })
      }

      // Insert cluster 2
      for (let i = 0; i < 100; i++) {
        const variation = cluster2Embedding.map(v => v + (Math.random() - 0.5) * 0.1)
        await vectorSearch.insertVector(`cluster2-${i}`, variation, { cluster: 2 })
      }

      // Search for cluster 1 pattern
      const results = await vectorSearch.similaritySearch(cluster1Embedding, 10)

      expect(results).toHaveLength(10)
      // Most results should be from cluster 1
      const cluster1Results = results.filter(r => r.metadata.cluster === 1)
      expect(cluster1Results.length).toBeGreaterThan(7) // At least 70% should be from correct cluster
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid vector dimensions', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      expect(async () => {
        await vectorSearch.insertVector('invalid-1', [1, 2], { type: 'test' })
      }).rejects.toThrow('Invalid vector dimension')

      expect(async () => {
        await vectorSearch.similaritySearch([1], 1)
      }).rejects.toThrow('Invalid query vector dimension')
    })

    it('should handle empty search results gracefully', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      const results = await vectorSearch.semanticSearch('nonexistent content', { limit: 5 })
      expect(results).toHaveLength(0)
    })

    it('should maintain database consistency on errors', async () => {
      const { VectorSearch } = await import('../lib/vector_search')
      const vectorSearch = new VectorSearch(TEST_DB_PATH)

      // Insert some valid data
      await vectorSearch.insertVector('valid-1', [1, 2, 3], { type: 'test' })

      // Try to insert invalid data
      try {
        await vectorSearch.insertVector('invalid-1', [], { type: 'test' })
      } catch {
        // Expected to fail
      }

      // Original data should still be intact
      const vector = vectorSearch.getVector('valid-1')
      expect(vector).toEqual([1, 2, 3])
    })
  })
})