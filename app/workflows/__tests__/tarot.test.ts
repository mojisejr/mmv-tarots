import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { workflow } from '@vercel/sdk';
import { tarotWorkflow } from '../tarot';

// Mock the Vercel Workflow SDK
vi.mock('@vercel/sdk', () => ({
  workflow: {
    define: vi.fn(),
    schedule: vi.fn(),
  },
}));

// Mock database and AI agents
vi.mock('../../../lib/db', () => ({
  db: {
    prediction: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../lib/ai/agents/gatekeeper', () => ({
  gatekeeperAgent: vi.fn(),
}));

vi.mock('../../../lib/ai/agents/analyst', () => ({
  analystAgent: vi.fn(),
}));

vi.mock('../../../lib/ai/agents/mystic', () => ({
  mysticAgent: vi.fn(),
}));

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
};

describe('Tarot Vercel Workflow', () => {
  let mockWorkflow: any;
  let mockDb: any;
  let mockGatekeeperAgent: any;
  let mockAnalystAgent: any;
  let mockMysticAgent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkflow = require('@vercel/sdk').workflow;
    mockDb = require('../../../lib/db').db;
    mockGatekeeperAgent = require('../../../lib/ai/agents/gatekeeper').gatekeeperAgent;
    mockAnalystAgent = require('../../../lib/ai/agents/analyst').analystAgent;
    mockMysticAgent = require('../../../lib/ai/agents/mystic').mysticAgent;

    // Default successful mocks
    mockDb.prediction.updateMany.mockResolvedValue({ success: true });
    mockDb.prediction.findUnique.mockResolvedValue({
      jobId: 'job-test-123',
      question: 'Will I find love?',
      userIdentifier: 'user_123',
    });
    mockGatekeeperAgent.mockResolvedValue({
      approved: true,
      reason: null,
    });
    mockAnalystAgent.mockResolvedValue({
      context: 'love question',
      focus: 'relationships',
    });
    mockMysticAgent.mockResolvedValue({
      success: true,
      selectedCards: ['The Lovers', 'Two of Cups'],
      reading: 'Love is in the air',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined as a Vercel Workflow', () => {
    // Verify workflow was defined using Vercel SDK
    expect(mockWorkflow.define).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tarot-reading',
        run: expect.any(Function),
      })
    );
  });

  it('should process a successful tarot reading', async () => {
    // Simulate workflow execution
    const mockRun = mockWorkflow.define.mock.calls[0][1].run;

    // Act
    await mockRun({
      payload: {
        jobId: 'job-test-123',
        question: 'Will I find love?',
        userIdentifier: 'user_123',
      },
    });

    // Assert
    // 1. Should mark as PROCESSING
    expect(mockDb.prediction.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-test-123' },
      data: { status: 'PROCESSING' },
    });

    // 2. Should run gatekeeper agent
    expect(mockGatekeeperAgent).toHaveBeenCalledWith('Will I find love?');

    // 3. Should run analyst agent
    expect(mockAnalystAgent).toHaveBeenCalledWith('Will I find love?');

    // 4. Should save analysis result
    expect(mockDb.prediction.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-test-123' },
      data: {
        status: 'PROCESSING',
        analysisResult: {
          context: 'love question',
          focus: 'relationships',
        },
      },
    });

    // 5. Should run mystic agent
    expect(mockMysticAgent).toHaveBeenCalledWith('Will I find love?', {
      context: 'love question',
      focus: 'relationships',
    });

    // 6. Should mark as COMPLETED with final reading
    expect(mockDb.prediction.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-test-123' },
      data: {
        status: 'COMPLETED',
        selectedCards: ['The Lovers', 'Two of Cups'],
        finalReading: {
          success: true,
          selectedCards: ['The Lovers', 'Two of Cups'],
          reading: 'Love is in the air',
        },
        completedAt: expect.any(Date),
      },
    });
  });

  it('should handle gatekeeper rejection', async () => {
    // Arrange
    mockGatekeeperAgent.mockResolvedValue({
      approved: false,
      reason: 'Question violates terms of service',
    });

    const mockRun = mockWorkflow.define.mock.calls[0][1].run;

    // Act
    await mockRun({
      payload: {
        jobId: 'job-test-123',
        question: 'Harmful question',
        userIdentifier: 'user_123',
      },
    });

    // Assert
    // Should mark as FAILED immediately
    expect(mockDb.prediction.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-test-123' },
      data: {
        status: 'FAILED',
        completedAt: expect.any(Date),
      },
    });

    // Should not run other agents
    expect(mockAnalystAgent).not.toHaveBeenCalled();
    expect(mockMysticAgent).not.toHaveBeenCalled();
  });

  it('should handle agent failures with retry', async () => {
    // Arrange
    mockGatekeeperAgent
      .mockRejectedValueOnce(new Error('API timeout'))
      .mockResolvedValueOnce({ approved: true });

    const mockRun = mockWorkflow.define.mock.calls[0][1].run;

    // Act
    await mockRun({
      payload: {
        jobId: 'job-test-123',
        question: 'Will I find love?',
        userIdentifier: 'user_123',
      },
    });

    // Assert
    // Should retry gatekeeper agent
    expect(mockGatekeeperAgent).toHaveBeenCalledTimes(2);

    // Should still complete successfully
    expect(mockDb.prediction.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-test-123' },
      data: {
        status: 'COMPLETED',
        finalReading: expect.any(Object),
        completedAt: expect.any(Date),
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    mockDb.prediction.updateMany.mockRejectedValueOnce(new Error('Database connection failed'));

    const mockRun = mockWorkflow.define.mock.calls[0][1].run;

    // Act & Assert
    await expect(
      mockRun({
        payload: {
          jobId: 'job-test-123',
          question: 'Will I find love?',
          userIdentifier: 'user_123',
        },
      })
    ).rejects.toThrow('Database connection failed');

    expect(consoleSpy.error).toHaveBeenCalledWith(
      'Failed to update prediction status:',
      expect.any(Error)
    );
  });
});