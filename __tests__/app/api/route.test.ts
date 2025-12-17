import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../../../app/api/predict/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('../lib/db', () => ({
  db: {
    prediction: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../lib/validations', () => ({
  validatePostPredictRequest: vi.fn(),
}));

vi.mock('../lib/job-id', () => ({
  generateJobId: vi.fn(),
}));

vi.mock('../lib/errors', () => ({
  ApiError: class MockApiError extends Error {
    constructor({ code, message }: any) {
      super(message);
      this.code = code;
    }
  },
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  },
  createErrorResponse: (error: any, status: number) =>
    new Response(JSON.stringify({ error: error.message }), { status }),
}));

// Mock the actual Vercel Workflow trigger
vi.mock('../../../app/workflows/tarot', () => ({
  startTarotWorkflow: vi.fn(),
}));

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
};

describe('POST /api/predict (with Vercel Workflow)', () => {
  let mockDb: any;
  let mockValidate: any;
  let mockGenerateJobId: any;
  let mockStartWorkflow: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const dbMock = require('../lib/db').db;
    const validationMock = require('../lib/validations');
    const jobIdMock = require('../lib/job-id');
    const workflowMock = require('../../../app/workflows/tarot');

    mockDb = dbMock;
    mockValidate = validationMock.validatePostPredictRequest;
    mockGenerateJobId = jobIdMock.generateJobId;
    mockStartWorkflow = workflowMock.startTarotWorkflow;

    // Default successful mocks
    mockValidate.mockReturnValue([]);
    mockGenerateJobId.mockReturnValue('job-test-123');
    mockDb.prediction.create.mockResolvedValue({
      id: 'pred-1',
      jobId: 'job-test-123',
      status: 'PENDING',
    });
    mockStartWorkflow.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 with job ID when workflow is triggered successfully', async () => {
    // Arrange
    const requestBody = JSON.stringify({
      question: 'Will I find love?',
      userIdentifier: 'user_123',
    });
    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: requestBody,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      jobId: 'job-test-123',
      status: 'PENDING',
      message: 'Processing your tarot reading. Job ID: job-test-123',
    });

    // Verify workflow was triggered
    expect(mockStartWorkflow).toHaveBeenCalledWith({
      jobId: 'job-test-123',
      question: 'Will I find love?',
      userIdentifier: 'user_123',
    });

    // Verify prediction was created
    expect(mockDb.prediction.create).toHaveBeenCalledWith({
      data: {
        jobId: 'job-test-123',
        userIdentifier: 'user_123',
        question: 'Will I find love?',
        status: 'PENDING',
      },
    });
  });

  it('should handle workflow trigger failure gracefully', async () => {
    // Arrange
    mockStartWorkflow.mockRejectedValue(new Error('Workflow service unavailable'));

    const requestBody = JSON.stringify({
      question: 'Will I find love?',
      userIdentifier: 'user_123',
    });
    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: requestBody,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to start tarot reading workflow');

    // Verify prediction was marked as failed
    expect(mockDb.prediction.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-test-123' },
      data: {
        status: 'FAILED',
        completedAt: expect.any(Date),
      },
    });
  });

  it('should handle database creation failure', async () => {
    // Arrange
    mockDb.prediction.create.mockRejectedValue(new Error('Database connection failed'));

    const requestBody = JSON.stringify({
      question: 'Will I find love?',
      userIdentifier: 'user_123',
    });
    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: requestBody,
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(500);
    expect(mockStartWorkflow).not.toHaveBeenCalled();
  });

  it('should validate request body', async () => {
    // Arrange
    mockValidate.mockReturnValue(['Question is required']);

    const requestBody = JSON.stringify({
      question: '',
      userIdentifier: 'user_123',
    });
    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: requestBody,
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(400);
    expect(mockDb.prediction.create).not.toHaveBeenCalled();
    expect(mockStartWorkflow).not.toHaveBeenCalled();
  });

  it('should handle empty request body', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: '',
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(400);
    expect(mockDb.prediction.create).not.toHaveBeenCalled();
    expect(mockStartWorkflow).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/predict', {
      method: 'POST',
      body: 'invalid json',
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(400);
    expect(mockDb.prediction.create).not.toHaveBeenCalled();
    expect(mockStartWorkflow).not.toHaveBeenCalled();
  });
});