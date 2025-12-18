// Development Learning Journal - Memory Manager
// 🟢 GREEN Phase: Minimal implementation to make tests pass

import Database from 'better-sqlite3'
import { createMemoryDatabase } from './memory/db-schema'
import type {
  DevSession,
  DevRetrospective,
  RetrospectiveData,
  MemorySearchQuery,
  LearningInsight
} from './types/memory'

interface StartSessionParams {
  commandType: DevSession['command_type']
  sessionType: DevSession['session_type']
  initialInput: string
  deliverables: string[]
}

export class MemoryManager {
  private db: Database.Database

  constructor(dbPath: string) {
    try {
      this.db = createMemoryDatabase(dbPath)
    } catch (error) {
      // Create a temporary in-memory database for graceful fallback
      this.db = createMemoryDatabase(':memory:')
    }
  }

  startSession(params: StartSessionParams): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.db.prepare(`
      INSERT INTO dev_sessions (id, command_type, session_type, status, initial_input, deliverables, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      sessionId,
      params.commandType,
      params.sessionType,
      'active',
      params.initialInput,
      JSON.stringify(params.deliverables)
    )

    return sessionId
  }

  endSession(sessionId: string, status: DevSession['status'], durationMinutes?: number): void {
    this.db.prepare(`
      UPDATE dev_sessions
      SET status = ?, completed_at = datetime('now'), duration_minutes = ?
      WHERE id = ?
    `).run(status, durationMinutes, sessionId)
  }

  getSession(sessionId: string): DevSession | undefined {
    const row = this.db.prepare('SELECT * FROM dev_sessions WHERE id = ?').get(sessionId) as any

    if (!row) return undefined

    return {
      id: row.id,
      command_type: row.command_type,
      session_type: row.session_type,
      status: row.status,
      initial_input: row.initial_input,
      deliverables: JSON.parse(row.deliverables || '[]'),
      duration_minutes: row.duration_minutes,
      created_at: row.created_at,
      completed_at: row.completed_at
    }
  }

  getSessionsByCommandType(commandType: DevSession['command_type']): DevSession[] {
    const rows = this.db.prepare('SELECT * FROM dev_sessions WHERE command_type = ? ORDER BY created_at DESC').all(commandType) as any[]

    return rows.map(row => ({
      id: row.id,
      command_type: row.command_type,
      session_type: row.session_type,
      status: row.status,
      initial_input: row.initial_input,
      deliverables: JSON.parse(row.deliverables || '[]'),
      duration_minutes: row.duration_minutes,
      created_at: row.created_at,
      completed_at: row.completed_at
    }))
  }

  getActiveSessions(): DevSession[] {
    const rows = this.db.prepare('SELECT * FROM dev_sessions WHERE status = ? ORDER BY created_at DESC').all('active') as any[]

    return rows.map(row => ({
      id: row.id,
      command_type: row.command_type,
      session_type: row.session_type,
      status: row.status,
      initial_input: row.initial_input,
      deliverables: JSON.parse(row.deliverables || '[]'),
      duration_minutes: row.duration_minutes,
      created_at: row.created_at,
      completed_at: row.completed_at
    }))
  }

  captureRetrospective(sessionId: string, data: RetrospectiveData): string {
    const retrospectiveId = `retro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.db.prepare(`
      INSERT INTO dev_retrospectives
      (id, session_id, approaches_used, design_patterns, problems_encountered, user_taught_ai, ai_taught_user, lessons_learned, quality_score, learning_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      retrospectiveId,
      sessionId,
      JSON.stringify(data.approaches),
      JSON.stringify(data.patterns),
      data.problems,
      data.userInsights,
      data.aiInsights,
      data.lessons,
      data.qualityScore,
      data.learningScore
    )

    return retrospectiveId
  }

  getRetrospective(retrospectiveId: string): DevRetrospective | undefined {
    const row = this.db.prepare('SELECT * FROM dev_retrospectives WHERE id = ?').get(retrospectiveId) as any

    if (!row) return undefined

    return {
      id: row.id,
      session_id: row.session_id,
      approaches_used: JSON.parse(row.approaches_used || '[]'),
      design_patterns: JSON.parse(row.design_patterns || '[]'),
      problems_encountered: row.problems_encountered,
      user_taught_ai: row.user_taught_ai,
      ai_taught_user: row.ai_taught_user,
      lessons_learned: row.lessons_learned,
      quality_score: row.quality_score,
      learning_score: row.learning_score,
      created_at: row.created_at
    }
  }

  captureUserInsights(sessionId: string, insights: any): void {
    // For minimal implementation, store as a note in the session
    this.db.prepare(`
      UPDATE dev_sessions
      SET initial_input = initial_input || ' [User Insights: ' || ? || ']'
      WHERE id = ?
    `).run(JSON.stringify(insights), sessionId)
  }

  captureAIInsights(sessionId: string, insights: any): void {
    // For minimal implementation, store as a note in the session
    this.db.prepare(`
      UPDATE dev_sessions
      SET initial_input = initial_input || ' [AI Insights: ' || ? || ']'
      WHERE id = ?
    `).run(JSON.stringify(insights), sessionId)
  }

  async generateEmbeddings(sessionId: string, content: string): Promise<number[]> {
    // Minimal implementation: generate a simple hash-based embedding
    const embedding: number[] = []
    for (let i = 0; i < 384; i++) {
      const char = content.charCodeAt(i % content.length) || 0
      embedding.push((char / 255) * Math.sin(i))
    }

    // Store in database for future use
    this.db.prepare(`
      UPDATE dev_retrospectives
      SET session_embedding = ?
      WHERE session_id = ?
    `).run(Buffer.from(new Float32Array(embedding).buffer), sessionId)

    return embedding
  }

  findLessonsLearned(query: MemorySearchQuery): LearningInsight[] {
    // Minimal implementation: simple keyword matching
    const sessions = this.db.prepare(`
      SELECT ds.*, dr.lessons_learned, dr.ai_taught_user, dr.user_taught_ai
      FROM dev_sessions ds
      LEFT JOIN dev_retrospectives dr ON ds.id = dr.session_id
      WHERE dr.lessons_learned IS NOT NULL OR ds.initial_input LIKE ?
      ORDER BY ds.created_at DESC
      LIMIT ?
    `).all(`%${query.query}%`, query.limit || 10) as any[]

    const insights: LearningInsight[] = []
    const queryWords = query.query.toLowerCase().split(' ')

    sessions.forEach(session => {
      const lessonText = (session.lessons_learned || '').toLowerCase()
      const inputText = (session.initial_input || '').toLowerCase()
      const searchText = lessonText + ' ' + inputText

      // Check if any query word matches
      const hasMatch = queryWords.some(word => searchText.includes(word))

      if (hasMatch) {
        insights.push({
          sessionId: session.id,
          type: 'technical' as const,
          title: 'Lesson from ' + session.command_type,
          description: session.lessons_learned || 'Learning from: ' + session.initial_input,
          context: session.initial_input,
          applicable: true,
          confidence: 0.8
        })
      }
    })

    return insights
  }

  searchSessions(query: MemorySearchQuery): DevSession[] {
    let sql = 'SELECT * FROM dev_sessions WHERE 1=1'
    const params: any[] = []

    if (query.query) {
      sql += ' AND initial_input LIKE ?'
      params.push(`%${query.query}%`)
    }

    sql += ' ORDER BY created_at DESC'

    if (query.limit) {
      sql += ' LIMIT ?'
      params.push(query.limit)
    }

    const rows = this.db.prepare(sql).all(...params) as any[]

    return rows.map(row => ({
      id: row.id,
      command_type: row.command_type,
      session_type: row.session_type,
      status: row.status,
      initial_input: row.initial_input,
      deliverables: JSON.parse(row.deliverables || '[]'),
      duration_minutes: row.duration_minutes,
      created_at: row.created_at,
      completed_at: row.completed_at
    }))
  }

  close(): void {
    this.db.close()
  }
}