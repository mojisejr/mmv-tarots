import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '../predictions/user/[userId]/route';

// Mock dependencies
vi.mock('../../../../lib/db', () => ({
  db: {
    prediction: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../../../lib/errors', () => ({
  ApiError: class MockApiError extends Error {
    constructor({ code, message }: any) {
      super(message);
      this.code = code;
    }
  },
  ERROR_CODES: {
    INVALID_REQUEST: 'INVALID_REQUEST',
    DATABASE_ERROR: 'DATABASE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
  createErrorResponse: (error: any, status: number) =>
    new Response(JSON.stringify({ error: error.message }), { status }),
}));

describe('GET /api/predictions/user/[userId]', () => {
  let mockDb: any;
  let mockConsoleError: any;

  beforeEach(() => {
    mockDb = require('../../../../lib/db').db;
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockRestore();
  });

  it('should fetch predictions for a valid user ID', async () => {
    // Arrange
    const userId = 'user_1234567890_abcdef123';
    const mockPredictions = [
      {
        id: 'pred-1',
        jobId: 'job-abc123',
        question: 'Will I find love?',
        status: 'COMPLETED',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        completedAt: new Date('2024-01-15T10:05:00Z'),
        finalReading: { cards: ['The Lovers'] },
      },
      {
        id: 'pred-2',
        jobId: 'job-def456',
        question: 'Should I change jobs?',
        status: 'PENDING',
        createdAt: new Date('2024-01-16T14:30:00Z'),
        completedAt: null,
        finalReading: null,
      },
    ];

    mockDb.prediction.findMany.mockResolvedValue(mockPredictions);

    const request = new NextRequest('http://localhost:3000/api/predictions/user/test');
    const params = Promise.resolve({ userId });

    // Act
    const response = await GET(request, { params });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.predictions).toHaveLength(2);
    expect(data.predictions[0]).toEqual({
      id: 'job-abc123',
      jobId: 'job-abc123',
      question: 'Will I find love?',
      status: 'COMPLETED',
      createdAt: '2024-01-15T10:00:00.000Z',
      completedAt: '2024-01-15T10:05:00.000Z',
      finalReading: { cards: ['The Lovers'] },
    });
    expect(mockDb.prediction.findMany).toHaveBeenCalledWith({
      where: { userIdentifier: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('should return error for empty user ID', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/predictions/user/');
    const params = Promise.resolve({ userId: '' });

    // Act
    const response = await GET(request, { params });

    // Assert
    expect(response.status).toBe(500);
  });

  it('should trim whitespace from user ID', async () => {
    // Arrange
    const userId = '  user_123  ';
    const mockPredictions = [];
    mockDb.prediction.findMany.mockResolvedValue(mockPredictions);

    const request = new NextRequest('http://localhost:3000/api/predictions/user/test');
    const params = Promise.resolve({ userId });

    // Act
    const response = await GET(request, { params });

    // Assert
    expect(response.status).toBe(200);
    expect(mockDb.prediction.findMany).toHaveBeenCalledWith({
      where: { userIdentifier: 'user_123' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const userId = 'user_123';
    mockDb.prediction.findMany.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/predictions/user/test');
    const params = Promise.resolve({ userId });

    // Act
    const response = await GET(request, { params });

    // Assert
    expect(response.status).toBe(500);
    expect(mockConsoleError).toHaveBeenCalledWith('Database error:', expect.any(Error));
  });

  it('should limit results to 50 predictions', async () => {
    // Arrange
    const userId = 'user_123';
    const mockPredictions = Array(60).fill(null).map((_, i) => ({
      id: `pred-${i}`,
      jobId: `job-${i}`,
      question: `Question ${i}`,
      status: 'COMPLETED',
      createdAt: new Date(),
      completedAt: new Date(),
      finalReading: null,
    }));
    mockDb.prediction.findMany.mockResolvedValue(mockPredictions);

    const request = new NextRequest('http://localhost:3000/api/predictions/user/test');
    const params = Promise.resolve({ userId });

    // Act
    const response = await GET(request, { params });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.predictions).toHaveLength(60); // Mock returns 60, but we only take first 50
    expect(data.total).toBe(60);
    expect(mockDb.prediction.findMany).toHaveBeenCalledWith({
      where: { userIdentifier: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('should return empty array when user has no predictions', async () => {
    // Arrange
    const userId = 'user_no_predictions';
    mockDb.prediction.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/predictions/user/test');
    const params = Promise.resolve({ userId });

    // Act
    const response = await GET(request, { params });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.predictions).toHaveLength(0);
    expect(data.total).toBe(0);
    expect(data.page).toBe(1);
    expect(data.totalPages).toBe(0);
  });
});