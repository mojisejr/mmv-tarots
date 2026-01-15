// API Route for GET /api/suggested-questions
// Phase 2: Caching Strategy (ISR-like)

import { NextResponse } from 'next/server';
import { SuggestedQuestionService } from '@/lib/server/services/suggested-question-service';

// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    // Check if we need to seed defaults (First run safe-guard)
    // Ref: Oracle Protocol - Ensure robust initialization
    await SuggestedQuestionService.seedDefaults();

    // Fetch all active questions
    // This data will be cached by Next.js based on the 'revalidate' export
    const questions = await SuggestedQuestionService.getActiveQuestions();
    
    return NextResponse.json({
      data: questions,
      meta: {
        count: questions.length,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('API Error: Failed to fetch suggested questions', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggested questions' },
      { status: 500 }
    );
  }
}
