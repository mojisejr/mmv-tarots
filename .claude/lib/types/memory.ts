// Development Learning Journal - TypeScript Interfaces
// Issue 23: Complete Implementation Plan

export interface DevSession {
  id: string
  command_type: '/impl' | '/debug' | '/experiment' | '/aha' | '/learn' | '/commit' | '/run-test'
  session_type: 'feature' | 'bug-fix' | 'debug-chain' | 'learning' | 'planning'
  status: 'active' | 'solved' | 'paused' | 'completed' | 'failed'
  initial_input: string
  deliverables: string[]
  duration_minutes?: number
  created_at: string
  completed_at?: string
}

export interface DevRetrospective {
  id: string
  session_id: string

  // What & How
  approaches_used: string[]
  design_patterns: string[]
  problems_encountered: string

  // Learning Moments
  user_taught_ai: string
  ai_taught_user: string
  lessons_learned: string

  // Success metrics
  quality_score: number  // 1-5 implementation quality
  learning_score: number // 1-5 knowledge gained

  // Semantic search
  session_embedding?: number[]

  created_at: string
}

export interface DebugSession {
  id: string
  parent_session_id?: string
  chain_level: number

  // Problem Discovery
  initial_error: string
  error_traceback?: string
  reproduction_steps?: string

  // AI Analysis & Solutions
  ai_analysis: string
  ai_plan: string
  ai_changes: Record<string, any>

  // Resolution
  final_solution?: string
  why_failed?: string
  pattern_recognition?: string

  // For future search
  problem_embedding?: number[]
  solution_embedding?: number[]

  created_at: string
  completed_at?: string
}

export interface DebugChain {
  parent_debug_id: string
  child_debug_id: string
  chain_order: number
  error_sequence: Record<string, any>
  chain_status: 'active' | 'solved' | 'abandoned'
}

export interface PastSolution {
  session_id: string
  problem_description: string
  solution_summary: string
  effectiveness_score: number
  similarity_score: number
  session: DevSession
  debug_session?: DebugSession
}

export interface DebugAnalysis {
  probableCause: string
  suggestedAction: string
  confidence: number
  relatedFiles?: string[]
  estimatedTime?: number
}

export interface DebugPlan {
  rootCause: string
  actionSteps: string[]
  suggestedExperiment: string
  riskLevel: 'low' | 'medium' | 'high'
  estimatedTime: number
}

export interface RetrospectiveData {
  approaches: string[]
  patterns: string[]
  problems: string
  userInsights: string
  aiInsights: string
  lessons: string
  qualityScore: number
  learningScore: number
}

export interface LearningInsight {
  sessionId: string
  type: 'technical' | 'process' | 'pattern' | 'prevention'
  title: string
  description: string
  context: string
  applicable: boolean
  confidence: number
}

export interface CommandResult {
  success: boolean
  message: string
  data?: any
  nextCommand?: string
  error?: string
}

export interface MemorySearchQuery {
  query: string
  type?: 'problem' | 'solution' | 'pattern' | 'session'
  limit?: number
  minSimilarity?: number
  sessionType?: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface VectorSearchResult {
  id: string
  content: string
  similarity_score: number
  metadata: Record<string, any>
}

// Database Schema Types
export interface DatabaseSchema {
  dev_sessions: DevSession
  dev_retrospectives: DevRetrospective
  debug_sessions: DebugSession
  debug_chains: DebugChain
}

// Command Types
export type CommandType = DevSession['command_type']
export type SessionStatus = DevSession['status']
export type SessionType = DevSession['session_type']

// Memory Manager Configuration
export interface MemoryManagerConfig {
  dbPath: string
  enableVectorSearch: boolean
  autoBackup: boolean
  maxSessionsPerDay: number
  retentionDays: number
}