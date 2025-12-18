// Development Learning Journal - Database Schema
// 🟢 GREEN Phase: Minimal implementation to make tests pass

import Database from 'better-sqlite3'
import { promises as fs } from 'fs'
import path from 'path'

export function createMemoryDatabase(dbPath: string): Database.Database {
  // Ensure directory exists
  const dir = path.dirname(dbPath)
  fs.mkdir(dir, { recursive: true }).catch(() => {})

  const db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create dev_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dev_sessions (
      id TEXT PRIMARY KEY,
      command_type TEXT NOT NULL CHECK(command_type IN ('/impl', '/debug', '/experiment', '/aha', '/learn', '/commit', '/run-test')),
      session_type TEXT NOT NULL CHECK(session_type IN ('feature', 'bug-fix', 'debug-chain', 'learning', 'planning')),
      status TEXT NOT NULL CHECK(status IN ('active', 'solved', 'paused', 'completed', 'failed')),
      initial_input TEXT NOT NULL,
      deliverables TEXT NOT NULL DEFAULT '[]',
      duration_minutes INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )
  `)

  // Create dev_retrospectives table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dev_retrospectives (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      approaches_used TEXT NOT NULL DEFAULT '[]',
      design_patterns TEXT NOT NULL DEFAULT '[]',
      problems_encountered TEXT,
      user_taught_ai TEXT,
      ai_taught_user TEXT,
      lessons_learned TEXT,
      quality_score INTEGER CHECK(quality_score >= 1 AND quality_score <= 5),
      learning_score INTEGER CHECK(learning_score >= 1 AND learning_score <= 5),
      session_embedding BLOB,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES dev_sessions(id) ON DELETE CASCADE
    )
  `)

  // Create debug_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS debug_sessions (
      id TEXT PRIMARY KEY,
      parent_session_id TEXT,
      chain_level INTEGER NOT NULL DEFAULT 1,
      initial_error TEXT NOT NULL,
      error_traceback TEXT,
      reproduction_steps TEXT,
      ai_analysis TEXT,
      ai_plan TEXT,
      ai_changes TEXT,
      final_solution TEXT,
      why_failed TEXT,
      pattern_recognition TEXT,
      problem_embedding BLOB,
      solution_embedding BLOB,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (parent_session_id) REFERENCES debug_sessions(id) ON DELETE CASCADE
    )
  `)

  // Create debug_chains table
  db.exec(`
    CREATE TABLE IF NOT EXISTS debug_chains (
      parent_debug_id TEXT NOT NULL,
      child_debug_id TEXT NOT NULL,
      chain_order INTEGER NOT NULL,
      error_sequence TEXT NOT NULL DEFAULT '{}',
      chain_status TEXT NOT NULL CHECK(chain_status IN ('active', 'solved', 'abandoned')),
      PRIMARY KEY (parent_debug_id, child_debug_id),
      FOREIGN KEY (parent_debug_id) REFERENCES debug_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (child_debug_id) REFERENCES debug_sessions(id) ON DELETE CASCADE
    )
  `)

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_dev_sessions_command_type ON dev_sessions(command_type);
    CREATE INDEX IF NOT EXISTS idx_dev_sessions_status ON dev_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_dev_sessions_created_at ON dev_sessions(created_at);
    CREATE INDEX IF NOT EXISTS idx_dev_retrospectives_session_id ON dev_retrospectives(session_id);
    CREATE INDEX IF NOT EXISTS idx_debug_sessions_parent_session_id ON debug_sessions(parent_session_id);
    CREATE INDEX IF NOT EXISTS idx_debug_chains_parent_debug_id ON debug_chains(parent_debug_id);
  `)

  return db
}