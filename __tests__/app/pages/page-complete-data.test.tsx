import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PredictionDetailPage from '../page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    id: 'test-job-123',
  }),
}));

vi.mock('../lib/api', () => ({
  checkJobStatus: vi.fn(),
}));

vi.mock('../../../components/card', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('../../../components/button', () => ({
  GlassButton: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className} data-testid="glass-button">
      {children}
    </button>
  ),
}));

vi.mock('../../../components/features/tarot/tarot-card-image', () => ({
  TarotCardImage: ({ card, className }: any) => (
    <div className={className} data-testid="tarot-card-image">
      {card.displayName}
    </div>
  ),
}));

// Mock all reading components
vi.mock('../../../components/reading/reading-header', () => ({
  ReadingHeader: ({ header }: any) =>
    header ? <h2 data-testid="reading-header">{header}</h2> : null
}));

vi.mock('../../../components/reading/card-details', () => ({
  CardDetails: ({ card }: any) => (
    <div data-testid="card-details">
      <span data-testid="card-name">{card.name_th}</span>
      <span data-testid="card-interpretation">{card.interpretation}</span>
    </div>
  ),
}));

vi.mock('../../../components/reading/suggestions-list', () => ({
  SuggestionsList: ({ suggestions }: any) =>
    suggestions ? <div data-testid="suggestions-list">{suggestions.join(', ')}</div> : null
}));

vi.mock('../../../components/reading/next-questions', () => ({
  NextQuestions: ({ questions }: any) =>
    questions ? <div data-testid="next-questions">{questions.join(', ')}</div> : null
}));

vi.mock('../../../components/reading/final-summary', () => ({
  FinalSummary: ({ summary }: any) =>
    summary ? <div data-testid="final-summary">{summary}</div> : null
}));

vi.mock('../../../components/reading/disclaimer', () => ({
  Disclaimer: ({ text }: any) =>
    text ? <div data-testid="disclaimer">{text}</div> : null
}));

import { checkJobStatus } from '../lib/api';
import { GetPredictResponse } from '../../../types/api';

const mockCheckJobStatus = vi.mocked(checkJobStatus);

describe('PredictionDetailPage - Complete Data Display', () => {
  const mockCompleteResponse: GetPredictResponse = {
    jobId: 'test-job-123',
    status: 'COMPLETED',
    question: 'จะมีความรักที่แท้จริงในปีนี้หรือไม่?',
    result: {
      selectedCards: [0, 15, 32],
      analysis: {
        mood: 'hopeful',
        topic: 'love',
        period: 'near future',
      },
      reading: {
        header: 'การทำนายไพ่ 3 ใบเกี่ยวกับความรัก',
        cards_reading: [
          {
            position: 0,
            name_th: 'ความรัก',
            name_en: 'The Lovers',
            arcana: 'Major Arcana',
            keywords: ['ความรัก', 'ความสัมพันธ์', 'การเลือก'],
            interpretation: 'คุณกำลังอยู่ในช่วงเวลาของการตัดสินใจเกี่ยวกับความรัก',
            image: 'https://example.com/lovers.jpg',
          },
          {
            position: 1,
            name_th: 'ดาบแห่งความสุข',
            name_en: 'Six of Swords',
            arcana: 'Swords',
            keywords: ['การเดินทาง', 'การเปลี่ยนแปลง', 'การฟื้นฟู'],
            interpretation: 'กำลังจะเดินทางข้ามผ่านความยากลำบากไปสู่สถานะที่ดีขึ้น',
            image: 'https://example.com/six-swords.jpg',
          },
          {
            position: 2,
            name_th: 'ดวงดาว',
            name_en: 'The Star',
            arcana: 'Major Arcana',
            keywords: ['ความหวัง', 'การหายใจ', 'แรงบันดาลใจ'],
            interpretation: 'อนาคตสดใสและเต็มไปด้วยความหวัง',
            image: 'https://example.com/star.jpg',
          },
        ],
        reading: 'จากการทำนายไพ่ 3 ใบพบว่าคุณมีโอกาสพบเจอความรักที่แท้จริงในปีนี้',
        suggestions: [
          'เปิดใจยอมรับความรักที่เข้ามา',
          'สร้างความสัมพันธ์ที่ดีกับคนรอบข้าง',
          'ให้เวลากับตัวเองในการฟื้นตัว',
        ],
        next_questions: [
          'ฉันพร้อมสำหรับความรักใหม่หรือไม่?',
          'สิ่งที่ฉันมองหาในความสัมพันธ์คืออะไร?',
        ],
        final_summary: 'โดยรวมแล้ว ปีนี้เป็นปีแห่งการเปลี่ยนแปลงด้านความรักที่จะนำมาซึ่งความสุข',
        disclaimer: 'การทำนายไพ่เป็นเพียงคำแนะนำเชิงสัญลักษณ์เท่านั้น',
      },
    },
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:05:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reading header when provided', async () => {
    mockCheckJobStatus.mockResolvedValue(mockCompleteResponse);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('reading-header')).toBeInTheDocument();
      expect(screen.getByTestId('reading-header')).toHaveTextContent(mockCompleteResponse.result?.reading?.header);
    });
  });

  it('displays all card details with interpretation', async () => {
    mockCheckJobStatus.mockResolvedValue(mockCompleteResponse);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      const cardDetails = screen.getAllByTestId('card-details');
      expect(cardDetails).toHaveLength(3);
    });

    // Check first card details
    expect(screen.getByText('ความรัก')).toBeInTheDocument();
    expect(screen.getByText('คุณกำลังอยู่ในช่วงเวลาของการตัดสินใจเกี่ยวกับความรัก')).toBeInTheDocument();
  });

  it('shows suggestions section when available', async () => {
    mockCheckJobStatus.mockResolvedValue(mockCompleteResponse);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('suggestions-list')).toBeInTheDocument();
      expect(screen.getByTestId('suggestions-list')).toHaveTextContent('เปิดใจยอมรับความรักที่เข้ามา');
    });
  });

  it('displays next questions for contemplation', async () => {
    mockCheckJobStatus.mockResolvedValue(mockCompleteResponse);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('next-questions')).toBeInTheDocument();
      expect(screen.getByTestId('next-questions')).toHaveTextContent('ฉันพร้อมสำหรับความรักใหม่หรือไม่?');
    });
  });

  it('shows final summary prominently', async () => {
    mockCheckJobStatus.mockResolvedValue(mockCompleteResponse);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('final-summary')).toBeInTheDocument();
      expect(screen.getByTestId('final-summary')).toHaveTextContent('โดยรวมแล้ว ปีนี้เป็นปีแห่งการเปลี่ยนแปลงด้านความรัก');
    });
  });

  it('includes disclaimer at the bottom', async () => {
    mockCheckJobStatus.mockResolvedValue(mockCompleteResponse);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('disclaimer')).toBeInTheDocument();
      expect(screen.getByTestId('disclaimer')).toHaveTextContent('การทำนายไพ่เป็นเพียงความแนะนำเชิงสัญลักษณ์เท่านั้น');
    });
  });

  it('maintains proper heading hierarchy', async () => {
    mockCheckJobStatus.mockResolvedValue(mockCompleteResponse);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      // h1 for question
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent(mockCompleteResponse.question);

      // h2 for sections
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);

      // h3 for card names
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBeGreaterThan(0);
    });
  });

  it('handles missing reading data gracefully', async () => {
    const responseWithoutReading = {
      ...mockCompleteResponse,
      result: {
        ...mockCompleteResponse.result!,
        reading: undefined,
      },
    };
    mockCheckJobStatus.mockResolvedValue(responseWithoutReading);

    render(<PredictionDetailPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('reading-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('suggestions-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('next-questions')).not.toBeInTheDocument();
      expect(screen.queryByTestId('final-summary')).not.toBeInTheDocument();
    });
  });
});