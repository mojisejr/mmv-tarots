'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '../../../components/card';
import { GlassButton } from '../../../components/button';
import { ChevronLeft, Loader2, AlertCircle } from '../../../components/icons';
import {
  ReadingHeader,
  CardDetails,
  SuggestionsList,
  NextQuestions,
  FinalSummary,
  Disclaimer
} from '../../../components/reading';
import { checkJobStatus } from '../../../lib/api';
import { GetPredictResponse } from '../../../lib/api';
import { mapReadingData } from '../../../lib/reading-utils';

export default function PredictionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [prediction, setPrediction] = useState<GetPredictResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    try {
      const data = await checkJobStatus(jobId);
      setPrediction(data);
      setError(null);

      // If still processing/ pending, set up polling
      if (data.status === 'PENDING' || data.status === 'PROCESSING') {
        const interval = setInterval(async () => {
          try {
            const updatedData = await checkJobStatus(jobId);
            setPrediction(updatedData);

            // Stop polling when complete
            if (updatedData.status === 'COMPLETED' || updatedData.status === 'FAILED') {
              clearInterval(interval);
            }
          } catch (err) {
            console.error('Failed to refresh prediction:', err);
          }
        }, 5000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
      }
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
      setError('ไม่พบข้อมูลการทำนาย');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [jobId]);

  const handleBack = () => {
    router.push('/history');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'buddhist',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col justify-center pb-20">
        <GlassCard className="text-center p-8">
          <Loader2 data-testid="loader-icon" className="w-8 h-8 animate-spin mx-auto mb-4 text-white/60" />
          <p className="text-white/60">กำลังโหลด...</p>
        </GlassCard>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col justify-center pb-20">
        <GlassCard className="text-center p-8">
          <AlertCircle data-testid="alert-icon" className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <h2 className="text-2xl font-serif text-white mb-3">ไม่พบข้อมูลการทำนาย</h2>
          <p className="text-white/60 mb-6">Job ID นี้ไม่ถูกต้องหรือไม่มีในระบบ</p>
          <GlassButton onClick={handleBack} className="mx-auto">
            กลับไปหน้าประวัติ
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (prediction.status === 'PENDING' || prediction.status === 'PROCESSING') {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col justify-center pb-20">
        <GlassCard className="text-center p-8">
          <Loader2 data-testid="loader-icon" className="w-8 h-8 animate-spin mx-auto mb-4 text-white/60" />
          <h2 className="text-2xl font-serif text-white mb-3">
            {prediction.status === 'PENDING' ? 'รอคิว...' : 'กำลังทำนาย...'}
          </h2>
          <p className="text-white/60">การทำนายของคุณอยู่ระหว่างดำเนินการ</p>
          <p className="text-xs text-white/40 mt-4">Job ID: #{jobId}</p>
        </GlassCard>
      </div>
    );
  }

  if (prediction.status === 'FAILED') {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col justify-center pb-20">
        <GlassCard className="text-center p-8">
          <AlertCircle data-testid="alert-icon" className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <h2 className="text-2xl font-serif text-white mb-3">การทำนายล้มเหลว</h2>
          <p className="text-white/60">
            {prediction.error?.message || 'เกิดข้อผิดพลาดในระหว่างการทำนาย'}
          </p>
          <GlassButton onClick={handleBack} className="mt-6">
            กลับไปหน้าประวัติ
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  // COMPLETED state - Map reading data for new components
  const mappedData = prediction.result?.reading
    ? mapReadingData(prediction.result.reading)
    : null;

  // Handle case where reading might exist but be incomplete
  if (!mappedData?.cards || mappedData.cards.length === 0) {
    // Fall back to old card display logic if new reading data is not available
    const cards = prediction.result?.selectedCards || [];

    return (
      <div className="max-w-4xl mx-auto px-4 h-full pb-20">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center text-[#ffffff99] hover:text-[#ffffff] transition-colors"
          aria-label="กลับไปหน้าประวัติ"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          กลับไปหน้าประวัติ
        </button>

        {/* Main content */}
        <div className="space-y-6">
          {/* Question and metadata */}
          <GlassCard>
            <div className="p-6">
              <h1 className="text-2xl font-serif text-[#ffffff] mb-4">
                {prediction.question}
              </h1>
              <div className="flex items-center gap-4 text-sm text-[#ffffff99]">
                <span>Job ID: #{jobId}</span>
                {prediction.completedAt && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#ffffff40]"></span>
                    <span>{formatDate(prediction.completedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Reading Header */}
          {mappedData?.header && (
            <ReadingHeader header={mappedData.header} />
          )}

          {/* Cards Display - Legacy */}
          {cards.length > 0 && (
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-serif text-[#ffffff] mb-6">ไพ่ที่ได้รับ</h2>
                <div className="text-center text-[#ffffff99]">
                  <p>การแสดงข้อมูลไพ่แบบเดิม</p>
                  <p className="text-sm mt-2">Card IDs: {cards.join(', ')}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Main Reading Text */}
          {mappedData?.reading && (
            <GlassCard className="p-8 bg-gradient-to-br from-[#ffffff0f] to-[#ffffff05]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-[var(--color-primary)] to-transparent"></div>
                <h2 className="text-2xl font-serif text-[#ffffff]">คำทำนาย</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#ffffffcc] leading-relaxed whitespace-pre-wrap text-lg font-serif">
                  {mappedData.reading}
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 h-full pb-20">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="mb-6 flex items-center text-[#ffffff99] hover:text-[#ffffff] transition-colors"
        aria-label="กลับไปหน้าประวัติ"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        กลับไปหน้าประวัติ
      </button>

      {/* Main content */}
      <div className="space-y-6">
        {/* Question and metadata */}
        <GlassCard>
          <div className="p-6">
            <h1 className="text-2xl font-serif text-[#ffffff] mb-4">
              {prediction.question}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#ffffff99]">
              <span>Job ID: #{jobId}</span>
              {prediction.completedAt && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#ffffff40]"></span>
                  <span>{formatDate(prediction.completedAt)}</span>
                </>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Reading Header */}
        {mappedData?.header && (
          <ReadingHeader header={mappedData.header} />
        )}

        {/* Cards Details - using new component */}
        {mappedData?.cards && (
          <div className="space-y-6">
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-serif text-[#ffffff] mb-6">ไพ่ที่ได้รับ</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mappedData.cards.map((card, index) => (
                    <CardDetails key={index} card={card} />
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Main Reading Text */}
        {mappedData?.reading && (
          <GlassCard className="p-8 bg-gradient-to-br from-[#ffffff0f] to-[#ffffff05]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[var(--color-primary)] to-transparent"></div>
              <h2 className="text-2xl font-serif text-[#ffffff]">คำทำนาย</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-[#ffffffcc] leading-relaxed whitespace-pre-wrap text-lg font-serif">
                {mappedData.reading}
              </p>
            </div>
          </GlassCard>
        )}

        {/* Suggestions */}
        {mappedData?.suggestions && mappedData.suggestions.length > 0 && (
          <SuggestionsList suggestions={mappedData.suggestions} />
        )}

        {/* Next Questions */}
        {mappedData?.nextQuestions && mappedData.nextQuestions.length > 0 && (
          <NextQuestions questions={mappedData.nextQuestions} />
        )}

        {/* Final Summary */}
        {mappedData?.finalSummary && (
          <FinalSummary summary={mappedData.finalSummary} />
        )}

        {/* Disclaimer */}
        {mappedData?.disclaimer && (
          <Disclaimer text={mappedData.disclaimer} />
        )}
      </div>
    </div>
  );
}

// Named export for testing
export { PredictionDetailPage };