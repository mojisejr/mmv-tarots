import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/predict/[jobId]/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    prediction: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/predict/[jobId] - Empty Reading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not include result.reading when finalReading is empty object', async () => {
    const mockFindUnique = vi.mocked(await import('@/lib/db')).db.prediction.findUnique;

    // Mock prediction with empty finalReading
    mockFindUnique.mockResolvedValue({
      id: 'test-id',
      jobId: 'job-1704067200000-abc123def',
      status: 'COMPLETED',
      question: 'Test question',
      finalReading: {}, // Empty object
      createdAt: new Date(),
      completedAt: new Date(),
    });

    const request = new Request('http://localhost/api/predict/job-1704067200000-abc123def');
    const params = { jobId: 'job-1704067200000-abc123def' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(data.result?.reading).toBeUndefined();
    expect(data.status).toBe('COMPLETED');
  });

  it('should include result.reading when finalReading has valid data', async () => {
    const mockFindUnique = vi.mocked(await import('@/lib/db')).db.prediction.findUnique;

    // Mock prediction with valid finalReading
    mockFindUnique.mockResolvedValue({
      id: 'test-id',
      jobId: 'job-1704067200000-abc123def',
      status: 'COMPLETED',
      question: 'Test question',
      finalReading: {
        header: 'Test Reading',
        reading: 'Test content',
      },
      createdAt: new Date(),
      completedAt: new Date(),
    });

    const request = new Request('http://localhost/api/predict/job-1704067200000-abc123def');
    const params = { jobId: 'job-1704067200000-abc123def' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(data.result?.reading).toBeDefined();
    expect(data.result?.reading.header).toBe('Test Reading');
  });

  it('should not include result when prediction is not completed', async () => {
    const mockFindUnique = vi.mocked(await import('@/lib/db')).db.prediction.findUnique;

    // Mock prediction with PENDING status
    mockFindUnique.mockResolvedValue({
      id: 'test-id',
      jobId: 'job-1704067200000-abc123def',
      status: 'PENDING',
      question: 'Test question',
      createdAt: new Date(),
    });

    const request = new Request('http://localhost/api/predict/job-1704067200000-abc123def');
    const params = { jobId: 'job-1704067200000-abc123def' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(data.result).toBeUndefined();
    expect(data.status).toBe('PENDING');
  });
});