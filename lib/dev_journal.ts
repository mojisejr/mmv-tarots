/**
 * Development Journal Integration Layer
 *
 * Provides integration hooks for existing commands
 * to capture learning data and insights.
 */

import { MemoryManager } from './memory_manager'
import { CommandContext, DevSession, DevRetrospective } from '../types/memory'

export class DevJournal {
  private memoryManager: MemoryManager
  private currentSessionId: string | null = null
  private sessionStartTime: Date | null = null

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager
  }

  /**
   * Start tracking a new development session
   */
  async startSession(context: CommandContext): Promise<string> {
    const session = await this.memoryManager.createSession({
      command_type: context.command as DevSession['command_type'],
      session_type: this.inferSessionType(context.args),
      status: 'active',
      initial_input: context.args.join(' '),
      deliverables: this.extractDeliverables(context.args),
      duration_minutes: null
    })

    this.currentSessionId = session
    this.sessionStartTime = context.start_time

    return session
  }

  /**
   * End the current session with retrospective data
   */
  async endSession(retrospective?: Partial<DevRetrospective>): Promise<void> {
    if (!this.currentSessionId || !this.sessionStartTime) {
      throw new Error('No active session to end')
    }

    // Calculate duration
    const endTime = new Date()
    const durationMinutes = Math.round(
      (endTime.getTime() - this.sessionStartTime.getTime()) / 60000
    )

    // Update session status
    await this.memoryManager.updateSessionStatus(
      this.currentSessionId,
      'completed',
      durationMinutes
    )

    // Create retrospective if provided
    if (retrospective) {
      await this.memoryManager.createRetrospective({
        session_id: this.currentSessionId,
        approaches_used: retrospective.approaches_used || [],
        design_patterns: retrospective.design_patterns || [],
        problems_encountered: retrospective.problems_encountered || '',
        user_taught_ai: retrospective.user_taught_ai || '',
        ai_taught_user: retrospective.ai_taught_user || '',
        lessons_learned: retrospective.lessons_learned || '',
        quality_score: retrospective.quality_score || 3,
        learning_score: retrospective.learning_score || 3
      })
    }

    this.currentSessionId = null
    this.sessionStartTime = null
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  /**
   * Prompt for retrospective questions
   */
  getRetrospectiveQuestions(): string[] {
    return [
      'สิ่งที่ได้เรียนรู้สำคัญที่สุดใน session นี้คืออะไร?',
      'มีปัญหาน่าสนใจที่เจอหรือไม่? แก้ไขอย่างไร?',
      'อยากจดจำ pattern หรือ approach อะไรไว้มากที่สุด?',
      'มีสิ่งที่คุณสอน AI หรือเปล่า? มีสิ่งที่ AI สอนคุณหรือเปล่า?',
      'ความพึงพอใจในผลลัพธ์นี้ (1-5)?',
      'ความรู้ที่ได้เพิ่มเติม (1-5)?'
    ]
  }

  /**
   * Infer session type from command arguments
   */
  private inferSessionType(args: string[]): DevSession['session_type'] {
    const argsStr = args.join(' ').toLowerCase()

    if (argsStr.includes('bug') || argsStr.includes('fix') || argsStr.includes('error')) {
      return 'bug-fix'
    }

    if (argsStr.includes('refactor') || argsStr.includes('cleanup')) {
      return 'refactor'
    }

    if (argsStr.includes('learn') || argsStr.includes('understand')) {
      return 'learning'
    }

    return 'feature'
  }

  /**
   * Extract potential deliverables from command arguments
   */
  private extractDeliverables(args: string[]): string[] {
    const deliverables: string[] = []
    const argsStr = args.join(' ')

    // Common patterns for deliverables
    const patterns = [
      /implement (.+?)(?:\s|$)/i,
      /create (.+?)(?:\s|$)/i,
      /add (.+?)(?:\s|$)/i,
      /fix (.+?)(?:\s|$)/i,
      /build (.+?)(?:\s|$)/i
    ]

    for (const pattern of patterns) {
      const match = argsStr.match(pattern)
      if (match) {
        deliverables.push(match[1].trim())
      }
    }

    // Fallback: use the entire input as a deliverable
    if (deliverables.length === 0) {
      deliverables.push(argsStr.trim())
    }

    return deliverables
  }
}

// Singleton instance for easy access
let devJournalInstance: DevJournal | null = null

export function getDevJournal(): DevJournal {
  if (!devJournalInstance) {
    const memoryManager = new MemoryManager()
    devJournalInstance = new DevJournal(memoryManager)
  }
  return devJournalInstance
}