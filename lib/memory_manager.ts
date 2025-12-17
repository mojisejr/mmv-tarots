/**
 * Memory Manager for Development Learning Journal System
 *
 * Manages SQLite database for tracking development sessions,
 * retrospectives, and learning insights.
 */

import Database from 'better-sqlite3'
import { promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import {
  DevSession,
  DevRetrospective,
  LearningStats,
  SearchResult,
  MemoryConfig,
  CommandContext
} from '../types/memory'

export class MemoryManager {
  private db: Database.Database
  private config: MemoryConfig
  private isInitialized = false

  constructor(dbPath: string = '.claude/memory/dev_memory.db', config: MemoryConfig = {}) {
    this.config = { db_path: dbPath, ...config }

    try {
      this.db = new Database(dbPath)
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('foreign_keys = ON')
    } catch (error) {
      throw new Error(`Failed to initialize database at ${dbPath}: ${error}`)
    }
  }

  /**
   * Initialize database with required tables
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Ensure directory exists
      const dbDir = join(process.cwd(), '.claude/memory')
      await fs.mkdir(dbDir, { recursive: true })

    // Create development sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dev_sessions (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        command_type TEXT NOT NULL CHECK(command_type IN ('/impl', '/debug', '/experiment', '/commit')),
        session_type TEXT NOT NULL CHECK(session_type IN ('feature', 'bug-fix', 'debug-chain', 'refactor', 'learning')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused', 'abandoned')),
        initial_input TEXT NOT NULL,
        deliverables TEXT NOT NULL, -- JSON array
        duration_minutes INTEGER
      )
    `)

    // Create retrospectives table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dev_retrospectives (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        approaches_used TEXT NOT NULL, -- JSON array
        design_patterns TEXT NOT NULL, -- JSON array
        problems_encountered TEXT,
        user_taught_ai TEXT,
        ai_taught_user TEXT,
        lessons_learned TEXT,
        quality_score INTEGER CHECK(quality_score BETWEEN 1 AND 5),
        learning_score INTEGER CHECK(learning_score BETWEEN 1 AND 5),
        FOREIGN KEY (session_id) REFERENCES dev_sessions(id) ON DELETE CASCADE
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON dev_sessions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON dev_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_type ON dev_sessions(session_type);
      CREATE INDEX IF NOT EXISTS idx_retrospectives_session ON dev_retrospectives(session_id);
    `)

      this.isInitialized = true
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error}`)
    }
  }

  /**
   * Create a new development session
   */
  async createSession(session: Omit<DevSession, 'id' | 'timestamp'>): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    // Validate input
    if (!session.initial_input || session.initial_input.trim().length === 0) {
      throw new Error('Initial input is required')
    }

    if (!Array.isArray(session.deliverables)) {
      throw new Error('Deliverables must be an array')
    }

    const id = uuidv4()
    const timestamp = new Date().toISOString()

    try {
      const stmt = this.db.prepare(`
        INSERT INTO dev_sessions (
          id, timestamp, command_type, session_type, status,
          initial_input, deliverables, duration_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        id,
        timestamp,
        session.command_type,
        session.session_type,
        session.status,
        session.initial_input.trim(),
        JSON.stringify(session.deliverables),
        session.duration_minutes
      )

      return id
    } catch (error) {
      throw new Error(`Failed to create session: ${error}`)
    }
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<DevSession | null> {
    const stmt = this.db.prepare('SELECT * FROM dev_sessions WHERE id = ?')
    const row = stmt.get(sessionId) as any

    if (!row) return null

    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      command_type: row.command_type,
      session_type: row.session_type,
      status: row.status,
      initial_input: row.initial_input,
      deliverables: JSON.parse(row.deliverables),
      duration_minutes: row.duration_minutes
    }
  }

  /**
   * Update session status and duration
   */
  async updateSessionStatus(
    sessionId: string,
    status: DevSession['status'],
    durationMinutes?: number | null
  ): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE dev_sessions
      SET status = ?, duration_minutes = ?
      WHERE id = ?
    `)

    const result = stmt.run(status, durationMinutes, sessionId)
    return result.changes > 0
  }

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit: number = 10): Promise<DevSession[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM dev_sessions
      ORDER BY timestamp DESC
      LIMIT ?
    `)

    const rows = stmt.all(limit) as any[]

    return rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      command_type: row.command_type,
      session_type: row.session_type,
      status: row.status,
      initial_input: row.initial_input,
      deliverables: JSON.parse(row.deliverables),
      duration_minutes: row.duration_minutes
    }))
  }

  /**
   * Create a retrospective for a session
   */
  async createRetrospective(retrospective: Omit<DevRetrospective, 'id'>): Promise<string> {
    const id = uuidv4()

    const stmt = this.db.prepare(`
      INSERT INTO dev_retrospectives (
        id, session_id, approaches_used, design_patterns,
        problems_encountered, user_taught_ai, ai_taught_user,
        lessons_learned, quality_score, learning_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      retrospective.session_id,
      JSON.stringify(retrospective.approaches_used),
      JSON.stringify(retrospective.design_patterns),
      retrospective.problems_encountered,
      retrospective.user_taught_ai,
      retrospective.ai_taught_user,
      retrospective.lessons_learned,
      retrospective.quality_score,
      retrospective.learning_score
    )

    return id
  }

  /**
   * Get retrospective by session ID
   */
  async getRetrospectiveBySession(sessionId: string): Promise<DevRetrospective | null> {
    const stmt = this.db.prepare('SELECT * FROM dev_retrospectives WHERE session_id = ?')
    const row = stmt.get(sessionId) as any

    if (!row) return null

    return {
      id: row.id,
      session_id: row.session_id,
      approaches_used: JSON.parse(row.approaches_used),
      design_patterns: JSON.parse(row.design_patterns),
      problems_encountered: row.problems_encountered,
      user_taught_ai: row.user_taught_ai,
      ai_taught_user: row.ai_taught_user,
      lessons_learned: row.lessons_learned,
      quality_score: row.quality_score,
      learning_score: row.learning_score
    }
  }

  /**
   * Search sessions by keyword
   */
  async searchSessions(keyword: string): Promise<DevSession[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM dev_sessions
      WHERE initial_input LIKE ?
      ORDER BY timestamp DESC
    `)

    const rows = stmt.all(`%${keyword}%`) as any[]

    return rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      command_type: row.command_type,
      session_type: row.session_type,
      status: row.status,
      initial_input: row.initial_input,
      deliverables: JSON.parse(row.deliverables),
      duration_minutes: row.duration_minutes
    }))
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<LearningStats> {
    // Get session stats
    const sessionStats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN duration_minutes IS NOT NULL THEN duration_minutes ELSE 0 END) as total_minutes
      FROM dev_sessions
    `).get() as any

    // Get average scores
    const avgScores = this.db.prepare(`
      SELECT
        AVG(quality_score) as avg_quality,
        AVG(learning_score) as avg_learning
      FROM dev_retrospectives
    `).get() as any

    // Get common approaches and problems
    const approaches = this.db.prepare(`
      SELECT approaches_used FROM dev_retrospectives
    `).all() as any[]

    const problems = this.db.prepare(`
      SELECT problems_encountered FROM dev_retrospectives
    `).all() as any[]

    const commonApproaches = this.extractCommonItems(
      approaches.flatMap(r => JSON.parse(r.approaches_used))
    ).slice(0, 5)

    const commonProblems = this.extractCommonItems(
      problems.map(p => p.problems_encountered).filter(Boolean)
    ).slice(0, 5)

    return {
      total_sessions: sessionStats.total,
      completed_sessions: sessionStats.completed,
      total_learning_hours: (sessionStats.total_minutes || 0) / 60,
      average_quality_score: avgScores?.avg_quality || 0,
      average_learning_score: avgScores?.avg_learning || 0,
      common_approaches: commonApproaches,
      common_problems: commonProblems
    }
  }

  /**
   * Helper to extract most common items from array
   */
  private extractCommonItems(items: string[]): string[] {
    const frequency: Record<string, number> = {}

    for (const item of items) {
      frequency[item] = (frequency[item] || 0) + 1
    }

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([item]) => item)
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close()
  }
}