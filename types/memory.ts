/**
 * Development Learning Journal System Types
 *
 * TypeScript interfaces for the Second Brain system
 * that captures learning and development insights.
 */

export interface DevSession {
  /** Primary key */
  id: string
  /** Session timestamp */
  timestamp: Date
  /** Command type that triggered the session */
  command_type: '/impl' | '/debug' | '/experiment' | '/commit'
  /** Type of work being done */
  session_type: 'feature' | 'bug-fix' | 'debug-chain' | 'refactor' | 'learning'
  /** Current session status */
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  /** Initial input/requirement from user */
  initial_input: string
  /** Expected deliverables from the session */
  deliverables: string[]
  /** Duration in minutes (null if session is active) */
  duration_minutes: number | null
}

export interface DevRetrospective {
  /** Primary key */
  id: string
  /** Reference to the parent session */
  session_id: string
  /** Approaches and methodologies used */
  approaches_used: string[]
  /** Design patterns applied during session */
  design_patterns: string[]
  /** Main problems and challenges encountered */
  problems_encountered: string
  /** Knowledge user contributed to AI */
  user_taught_ai: string
  /** Technical insights AI provided to user */
  ai_taught_user: string
  /** Key lessons and takeaways from session */
  lessons_learned: string
  /** Implementation quality score (1-5) */
  quality_score: number
  /** Learning value score (1-5) */
  learning_score: number
  /** Session embedding for vector search (optional) */
  session_embedding?: number[]
}

export interface DebugSession {
  /** Primary key */
  id: string
  /** Parent development session ID */
  parent_session_id?: string
  /** Level in debug chain (1 = main problem) */
  chain_level: number
  /** Error message that triggered debugging */
  initial_error: string
  /** Full error traceback if available */
  error_traceback?: string
  /** Steps to reproduce the error */
  reproduction_steps: string
  /** AI's analysis of the problem */
  ai_analysis: string
  /** AI's suggested solution plan */
  ai_plan: string
  /** Actual code changes made (JSON) */
  ai_changes: Record<string, any>
  /** Final solution that worked */
  final_solution?: string
  /** Why initial approach failed */
  why_failed?: string
  /** Recognized error pattern */
  pattern_recognition?: string
  /** Vector embedding for problem (for semantic search) */
  problem_embedding?: number[]
  /** Vector embedding for solution */
  solution_embedding?: number[]
}

export interface DebugChain {
  /** Parent debug session ID */
  parent_debug_id: string
  /** Child debug session ID */
  child_debug_id: string
  /** Order in the chain */
  chain_order: number
  /** Sequence of errors encountered */
  error_sequence: string[]
  /** Chain completion status */
  chain_status: 'active' | 'solved' | 'abandoned'
}

export interface LearningStats {
  /** Total number of sessions */
  total_sessions: number
  /** Number of completed sessions */
  completed_sessions: number
  /** Total learning time in hours */
  total_learning_hours: number
  /** Average quality score across sessions */
  average_quality_score: number
  /** Average learning score across sessions */
  average_learning_score: number
  /** Most used approaches */
  common_approaches: string[]
  /** Common problems encountered */
  common_problems: string[]
}

export interface SearchResult {
  /** Matching session */
  session: DevSession
  /** Relevance score (0-1) */
  relevance_score: number
  /** Matching retrospective if available */
  retrospective?: DevRetrospective
}

/** Database connection configuration */
export interface MemoryConfig {
  /** Path to SQLite database file */
  db_path?: string
  /** Whether to enable vector search (requires embeddings) */
  enable_vector_search?: boolean
  /** Embedding model for vector search */
  embedding_model?: 'openai' | 'local'
  /** Maximum sessions to keep in memory */
  max_cached_sessions?: number
}

/** Command context for tracking */
export interface CommandContext {
  /** Command type */
  command: string
  /** Arguments passed to command */
  args: string[]
  /** Start timestamp */
  start_time: Date
  /** Current phase (for TDD workflow) */
  current_phase?: 'analysis' | 'red' | 'green' | 'refactor' | 'qa'
  /** Session ID for tracking */
  session_id?: string
}