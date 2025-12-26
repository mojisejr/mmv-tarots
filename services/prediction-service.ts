import { db } from '@/lib/server/db';
import { generateJobId } from '@/lib/server/job-id';

export interface CreatePredictionParams {
  userId: string;
  question: string;
}

export const PredictionService = {
  /**
   * Create a new prediction record
   */
  async createPrediction({ userId, question }: CreatePredictionParams) {
    const jobId = generateJobId();
    
    return await db.prediction.create({
      data: {
        jobId,
        userIdentifier: userId,
        question,
        status: 'PENDING',
      },
    });
  },

  /**
   * Update prediction status and results
   */
  async updatePrediction(jobId: string, updates: any) {
    return await db.prediction.updateMany({
      where: { jobId },
      data: updates,
    });
  },

  /**
   * Get prediction by jobId
   */
  async getByJobId(jobId: string) {
    return await db.prediction.findFirst({
      where: { jobId },
      include: {
        user: true,
      },
    });
  },

  /**
   * Get predictions for a user
   * @param userId - The user ID
   * @param limit - Optional limit for number of predictions to return
   */
  async getByUserId(userId: string, limit?: number) {
    return await db.prediction.findMany({
      where: { userIdentifier: userId },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
  }
};
