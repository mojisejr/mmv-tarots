// API utilities for Tarot application
// Phase 2: GREEN - Minimal implementation to make tests pass

import { z } from 'zod';

// Schemas for type safety
const PostPredictRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  userIdentifier: z.string().optional(),
});

const PostPredictResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  message: z.string(),
});

const GetPredictResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  question: z.string(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
  result: z.object({
    selectedCards: z.any(),
    analysis: z.any(),
    reading: z.any(),
  }).optional(),
});

// Types
export type PostPredictRequest = z.infer<typeof PostPredictRequestSchema>;
export type PostPredictResponse = z.infer<typeof PostPredictResponseSchema>;
export type GetPredictResponse = z.infer<typeof GetPredictResponseSchema>;

// API base URL
const API_BASE = '/api';

/**
 * Submit a tarot question for prediction
 */
export async function submitQuestion(question: string): Promise<PostPredictResponse> {
  const payload: PostPredictRequest = {
    question: question.trim(),
  };

  // Validate payload
  PostPredictRequestSchema.parse(payload);

  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return PostPredictResponseSchema.parse(data);
}

/**
 * Check the status of a prediction by job ID
 */
export async function checkJobStatus(jobId: string): Promise<GetPredictResponse> {
  if (!jobId || jobId.trim() === '') {
    throw new Error('Job ID is required');
  }

  const response = await fetch(`${API_BASE}/predict/${encodeURIComponent(jobId.trim())}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return GetPredictResponseSchema.parse(data);
}

/**
 * Fetch predictions for the current user
 */
export async function fetchUserPredictions(): Promise<{
  predictions: Array<{
    id: string;
    jobId: string;
    question: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
    completedAt?: string;
    finalReading?: any;
  }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const response = await fetch(`${API_BASE}/predictions/me`);

  if (!response.ok) {
    // If endpoint doesn't exist yet, return empty array
    if (response.status === 404) {
      return {
        predictions: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }

    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Save submission state to sessionStorage
 */
export function saveSubmissionState(jobId: string): void {
  try {
    sessionStorage.setItem('currentJobId', jobId);
    sessionStorage.setItem('submissionTime', Date.now().toString());
  } catch (error) {
    console.warn('Could not save submission state:', error);
  }
}

/**
 * Get submission state from sessionStorage
 */
export function getSubmissionState(): { jobId?: string; submissionTime?: number } {
  try {
    const jobId = sessionStorage.getItem('currentJobId');
    const submissionTime = sessionStorage.getItem('submissionTime');

    return {
      jobId: jobId || undefined,
      submissionTime: submissionTime ? parseInt(submissionTime, 10) : undefined,
    };
  } catch (error) {
    console.warn('Could not get submission state:', error);
    return {};
  }
}

/**
 * Clear submission state from sessionStorage
 */
export function clearSubmissionState(): void {
  try {
    sessionStorage.removeItem('currentJobId');
    sessionStorage.removeItem('submissionTime');
  } catch (error) {
    console.warn('Could not clear submission state:', error);
  }
}