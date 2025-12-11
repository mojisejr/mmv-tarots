// Job ID generation utilities

import { JOB_ID_REGEX } from '@/types/api'

/**
 * Generate a unique job ID for tracking prediction requests
 * Format: job-{timestamp}-{randomString}
 * Example: job-1704067200000-abc123def
 */
export function generateJobId(): string {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substr(2, 9)
  return `job-${timestamp}-${randomPart}`
}

/**
 * Validate if a job ID matches the expected format
 */
export function isValidJobId(jobId: string): boolean {
  return JOB_ID_REGEX.test(jobId)
}

/**
 * Extract timestamp from job ID
 */
export function extractTimestampFromJobId(jobId: string): number | null {
  const match = jobId.match(/^job-(\d+)-/)
  return match ? parseInt(match[1], 10) : null
}