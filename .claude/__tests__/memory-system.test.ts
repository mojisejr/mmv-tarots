// Development Learning Journal - Database Schema Tests
// 🔴 RED Phase: These tests MUST fail before implementation

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'

describe('Development Memory Database', () => {
  const TEST_DB_PATH = '.claude/memory/test_dev_memory.db'

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

  describe('Database Initialization', () => {
    it('should create database with all required tables', async () => {
      // This should fail because we haven't implemented the database yet
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')

      expect(() => {
        createMemoryDatabase(TEST_DB_PATH)
      }).not.toThrow()
    })

    it('should create dev_sessions table with correct columns', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Check table exists
      const tableInfo = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='dev_sessions'
      `).all()

      expect(tableInfo).toHaveLength(1)
      expect(tableInfo[0].name).toBe('dev_sessions')

      // Check columns
      const columns = db.prepare(`PRAGMA table_info(dev_sessions)`).all()
      const columnNames = columns.map((col: any) => col.name)

      expect(columnNames).toContain('id')
      expect(columnNames).toContain('command_type')
      expect(columnNames).toContain('session_type')
      expect(columnNames).toContain('status')
      expect(columnNames).toContain('initial_input')
      expect(columnNames).toContain('deliverables')
      expect(columnNames).toContain('duration_minutes')
      expect(columnNames).toContain('created_at')
      expect(columnNames).toContain('completed_at')
    })

    it('should create dev_retrospectives table with learning insights', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Check table exists
      const tableInfo = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='dev_retrospectives'
      `).all()

      expect(tableInfo).toHaveLength(1)

      // Check columns
      const columns = db.prepare(`PRAGMA table_info(dev_retrospectives)`).all()
      const columnNames = columns.map((col: any) => col.name)

      expect(columnNames).toContain('id')
      expect(columnNames).toContain('session_id')
      expect(columnNames).toContain('approaches_used')
      expect(columnNames).toContain('design_patterns')
      expect(columnNames).toContain('problems_encountered')
      expect(columnNames).toContain('user_taught_ai')
      expect(columnNames).toContain('ai_taught_user')
      expect(columnNames).toContain('lessons_learned')
      expect(columnNames).toContain('quality_score')
      expect(columnNames).toContain('learning_score')
      expect(columnNames).toContain('session_embedding')
    })

    it('should create debug_sessions table with cascading error tracking', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Check table exists
      const tableInfo = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='debug_sessions'
      `).all()

      expect(tableInfo).toHaveLength(1)

      // Check columns
      const columns = db.prepare(`PRAGMA table_info(debug_sessions)`).all()
      const columnNames = columns.map((col: any) => col.name)

      expect(columnNames).toContain('id')
      expect(columnNames).toContain('parent_session_id')
      expect(columnNames).toContain('chain_level')
      expect(columnNames).toContain('initial_error')
      expect(columnNames).toContain('error_traceback')
      expect(columnNames).toContain('reproduction_steps')
      expect(columnNames).toContain('ai_analysis')
      expect(columnNames).toContain('ai_plan')
      expect(columnNames).toContain('ai_changes')
      expect(columnNames).toContain('final_solution')
      expect(columnNames).toContain('why_failed')
      expect(columnNames).toContain('pattern_recognition')
      expect(columnNames).toContain('problem_embedding')
      expect(columnNames).toContain('solution_embedding')
    })

    it('should create debug_chains table for parent-child relationships', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Check table exists
      const tableInfo = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='debug_chains'
      `).all()

      expect(tableInfo).toHaveLength(1)

      // Check columns
      const columns = db.prepare(`PRAGMA table_info(debug_chains)`).all()
      const columnNames = columns.map((col: any) => col.name)

      expect(columnNames).toContain('parent_debug_id')
      expect(columnNames).toContain('child_debug_id')
      expect(columnNames).toContain('chain_order')
      expect(columnNames).toContain('error_sequence')
      expect(columnNames).toContain('chain_status')
    })
  })

  describe('Foreign Key Constraints', () => {
    it('should enforce foreign key constraint between dev_retrospectives and dev_sessions', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Enable foreign key constraints
      db.pragma('foreign_keys = ON')

      // Try to insert retrospective with non-existent session ID (should fail)
      expect(() => {
        db.prepare(`
          INSERT INTO dev_retrospectives (id, session_id, approaches_used, design_patterns, problems_encountered, user_taught_ai, ai_taught_user, lessons_learned, quality_score, learning_score, created_at)
          VALUES ('retro-1', 'non-existent-session', '[]', '[]', 'test', 'test', 'test', 'test', 5, 5, datetime('now'))
        `).run()
      }).toThrow()
    })

    it('should enforce foreign key constraint between debug_chains and debug_sessions', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Enable foreign key constraints
      db.pragma('foreign_keys = ON')

      // Try to insert debug chain with non-existent debug ID (should fail)
      expect(() => {
        db.prepare(`
          INSERT INTO debug_chains (parent_debug_id, child_debug_id, chain_order, error_sequence, chain_status)
          VALUES ('non-existent-parent', 'non-existent-child', 1, '{}', 'active')
        `).run()
      }).toThrow()
    })
  })

  describe('Database Performance', () => {
    it('should have indexes on frequently queried columns', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Check indexes exist
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `).all()

      expect(indexes.length).toBeGreaterThan(0)

      // Should have indexes on important columns
      const indexNames = indexes.map((idx: any) => idx.name)

      // At minimum, should index session relationships
      expect(indexNames.some((name: string) =>
        name.includes('session_id') || name.includes('parent_session_id')
      )).toBe(true)
    })
  })

  describe('Data Validation', () => {
    it('should validate command_type enum values', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Valid command types should work
      const validCommandTypes = ['/impl', '/debug', '/experiment', '/aha', '/learn', '/commit', '/run-test']

      validCommandTypes.forEach((commandType, index) => {
        expect(() => {
          db.prepare(`
            INSERT INTO dev_sessions (id, command_type, session_type, status, initial_input, deliverables, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(
            `session-${Date.now()}-${index}-${Math.random()}`,
            commandType,
            'feature',
            'active',
            'test input',
            '[]'
          )
        }).not.toThrow()
      })
    })

    it('should validate status enum values', async () => {
      const { createMemoryDatabase } = await import('../lib/memory/db-schema')
      const Database = require('better-sqlite3')

      const db = createMemoryDatabase(TEST_DB_PATH)

      // Valid statuses should work
      const validStatuses = ['active', 'solved', 'paused', 'completed', 'failed']

      validStatuses.forEach((status, index) => {
        expect(() => {
          db.prepare(`
            INSERT INTO dev_sessions (id, command_type, session_type, status, initial_input, deliverables, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(
            `session-${Date.now()}-${status}-${index}-${Math.random()}`,
            '/impl',
            'feature',
            status,
            'test input',
            '[]'
          )
        }).not.toThrow()
      })
    })
  })
})