'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard, GlassButton, ChevronLeft, Loader2, AlertCircle, Modal } from '@/components';
import {
  ReadingHeader,
  CardSpread,
  SuggestionsList,
  NextQuestions,
  FinalSummary,
  Disclaimer,
  ShareActions
} from '@/components/reading';
import { TarotCardImage } from '@/components/features/tarot';
import { checkJobStatus } from '@/lib/client/api';
import { GetPredictResponse } from '@/lib/client/api';
import { mapReadingData } from '@/lib/client/reading-utils';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import type { CardReading } from '@/types/reading';

export default function PredictionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const { setCurrentPage } = useNavigation();

  const [prediction, setPrediction] = useState<GetPredictResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardReading | null>(null);

  useEffect(() => {
    setCurrentPage('result');
  }, [setCurrentPage]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

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
          interval = setInterval(async () => {
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
        }
      } catch (err) {
        console.error('Failed to fetch prediction:', err);
        setError('ไม่พบข้อมูลการทำนาย');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();

    return () => {
      if (interval) clearInterval(interval);
    };
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
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col pb-20">
        {/* Mobile Back Button */}
        <div className="md:hidden pt-4 pb-2">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-foreground/60 hover:text-accent transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-accent/5 border border-accent/10 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif uppercase tracking-widest">กลับ</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <GlassCard className="text-center p-8 glass-mimi">
            <Loader2 data-testid="loader-icon" className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col pb-20">
        {/* Mobile Back Button */}
        <div className="md:hidden pt-4 pb-2">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-foreground/60 hover:text-accent transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-accent/5 border border-accent/10 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif uppercase tracking-widest">กลับ</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <GlassCard className="text-center p-8 glass-mimi">
            <AlertCircle data-testid="alert-icon" className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-serif text-foreground mb-3">ไม่พบข้อมูลการทำนาย</h2>
            <p className="text-muted-foreground mb-6">Job ID นี้ไม่ถูกต้องหรือไม่มีในระบบ</p>
            <GlassButton onClick={handleBack} className="mx-auto">
              กลับไปหน้าประวัติ
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (prediction.status === 'PENDING' || prediction.status === 'PROCESSING') {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col pb-20">
        {/* Mobile Back Button */}
        <div className="md:hidden pt-4 pb-2">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-foreground/60 hover:text-accent transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-accent/5 border border-accent/10 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif uppercase tracking-widest">กลับ</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <GlassCard className="text-center p-8 glass-mimi">
            <Loader2 data-testid="loader-icon" className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-serif text-foreground mb-3">
              {prediction.status === 'PENDING' ? 'รอคิว...' : 'กำลังทำนาย...'}
            </h2>
            <p className="text-muted-foreground">การทำนายของคุณอยู่ระหว่างดำเนินการ</p>
            <p className="text-xs text-muted-foreground/40 mt-4">Job ID: #{jobId}</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (prediction.status === 'FAILED') {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col pb-20">
        {/* Mobile Back Button */}
        <div className="md:hidden pt-4 pb-2">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-foreground/60 hover:text-accent transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-accent/5 border border-accent/10 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif uppercase tracking-widest">กลับ</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <GlassCard className="text-center p-8 glass-mimi">
            <AlertCircle data-testid="alert-icon" className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-serif text-foreground mb-3">การทำนายล้มเหลว</h2>
            <p className="text-muted-foreground">
              {prediction.error?.message || 'เกิดข้อผิดพลาดในระหว่างการทำนาย'}
            </p>
            <GlassButton onClick={handleBack} className="mt-6">
              กลับไปหน้าประวัติ
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  // COMPLETED state - Map reading data for new components
  const mappedData = prediction.result?.reading
    ? (() => {
        try {
          const result = mapReadingData(prediction.result.reading);
          if (!result) {
            console.error('Failed to map reading data - invalid format', {
              jobId,
              readingKeys: Object.keys(prediction.result.reading || {}),
              hasCards: !!prediction.result.reading?.cards_reading
            });
          }
          return result;
        } catch (error) {
          console.error('Error mapping reading data:', error, { jobId });
          return null;
        }
      })()
    : null;

  // Handle case where reading mapping failed or is incomplete
  if (!mappedData) {
    // Show error message when reading data cannot be processed
    return (
      <div className="max-w-4xl mx-auto px-4 h-full pb-20">
        {/* Mobile Back Button */}
        <div className="md:hidden pt-4 pb-2">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-foreground/60 hover:text-accent transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-accent/5 border border-accent/10 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-serif uppercase tracking-widest">กลับ</span>
          </button>
        </div>

        {/* Error message */}
        <GlassCard className="p-8 text-center">
          <h2 className="text-xl font-serif text-foreground mb-4">
            ข้อมูลการทำนายไม่สมบูรณ์
          </h2>
          <p className="text-muted-foreground mb-4">
            ไม่สามารถแสดงผลการทำนายได้เนื่องจากข้อมูลมีความเสียหายหรืออยู่ในรูปแบบที่ไม่รองรับ
          </p>
          <GlassButton onClick={handleBack} className="mx-auto">
            กลับไปหน้าประวัติ
          </GlassButton>
          <p className="text-sm text-foreground/20 mt-4">
            Job ID: #{jobId}
          </p>
        </GlassCard>
      </div>
    );
  }

  // Handle case where reading exists but has no cards
  if (mappedData.cards.length === 0) {
    // Fall back to old card display logic if new reading data is not available
    const cards = prediction.result?.selectedCards || [];

    return (
      <div className="max-w-4xl mx-auto px-4 h-full pb-20">
        {/* Main content */}
        <div className="space-y-6">
          {/* Question and metadata */}
          <GlassCard>
            <div className="p-6">
              <h1 className="text-2xl font-serif text-foreground mb-4">
                {prediction.question}
              </h1>
              <div className="flex items-center gap-4 text-sm text-foreground/50">
                <span>Job ID: #{jobId}</span>
                {prediction.completedAt && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-foreground/20"></span>
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
                <h2 className="text-xl font-serif text-foreground mb-6">ไพ่ที่ได้รับ</h2>
                <div className="text-center text-muted-foreground">
                  <p>การแสดงข้อมูลไพ่แบบเดิม</p>
                  <p className="text-sm mt-2">Card IDs: {cards.join(', ')}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Main Reading Text */}
          {mappedData?.reading && (
            <GlassCard className="p-8 bg-gradient-to-br from-white/5 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent"></div>
                <h2 className="text-2xl font-serif text-foreground">คำทำนาย</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-lg font-serif">
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
      {/* Mobile Back Button */}
      <div className="md:hidden pt-4 pb-2">
        <button 
          onClick={handleBack}
          className="group flex items-center gap-2 text-foreground/60 hover:text-accent transition-all duration-300"
        >
          <div className="p-2 rounded-full bg-accent/5 border border-accent/10 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-serif uppercase tracking-widest">กลับ</span>
        </button>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {/* Question and metadata */}
        <GlassCard>
          <div className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-serif text-foreground mb-4">
                  {prediction.question}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Job ID: #{jobId}</span>
                  {prediction.completedAt && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/40"></span>
                      <span>{formatDate(prediction.completedAt)}</span>
                    </>
                  )}
                </div>
              </div>
              {mappedData?.cards && (
                <ShareActions 
                  predictionId={jobId} 
                  cardName={mappedData.cards[0]?.name_th || 'คำทำนาย'} 
                  variant="minimal"
                />
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
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1 h-6 bg-primary/60 rounded-full"></div>
              <h2 className="text-xl font-serif text-foreground">ไพ่ที่ได้รับ</h2>
            </div>
            
            <CardSpread 
              cards={mappedData.cards} 
              onCardClick={setSelectedCard} 
            />
          </div>
        )}

        {/* Main Reading Text */}


        {mappedData?.reading && (
          <GlassCard className="p-8 bg-glass-mimi">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent"></div>
              <h2 className="text-2xl font-serif text-foreground">คำทำนาย</h2>
            </div>
            <div className="prose max-w-none">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-lg font-serif">
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

        {/* Share CTA */}
        {mappedData?.cards && (
            <ShareActions 
                predictionId={jobId}
                cardName={mappedData.cards[0]?.name_th || 'คำทำนาย'}
                variant="card"
            />
        )}

        {/* Disclaimer */}
        {mappedData?.disclaimer && (
          <Disclaimer text={mappedData.disclaimer} />
        )}
      </div>

      {/* Card Detail Modal */}
      <Modal
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title={selectedCard?.name_th}
      >
        {selectedCard && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
              <div className="w-[160px] xs:w-[200px] sm:w-[250px] md:w-1/3 flex-shrink-0">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all duration-500"></div>
                  <TarotCardImage
                    card={{
                      id: selectedCard.name_en,
                      name: selectedCard.name_en,
                      displayName: selectedCard.name_th,
                      imageUrl: selectedCard.image,
                      keywords: selectedCard.keywords,
                    }}
                    width={300}
                    height={450}
                    className="w-full h-auto relative rounded-xl shadow-2xl"
                  />
                </div>
              </div>

              
              <div className="flex-1 space-y-5 sm:space-y-6 text-center md:text-left">
                <div>
                  <p className="text-xs sm:text-sm text-accent font-serif uppercase tracking-widest mb-1">
                    {selectedCard.arcana}
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-serif text-foreground mb-1 sm:mb-2">
                    {selectedCard.name_th}
                  </h3>
                  <p className="text-base sm:text-lg text-foreground/60 italic">
                    {selectedCard.name_en}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs text-foreground/40 font-mono uppercase tracking-wider mb-2 sm:mb-3">Keywords</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center md:justify-start">
                    {selectedCard.keywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full bg-accent/5 border border-accent/10 text-foreground/80"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-accent/5 border border-accent/10 text-left">
                  <p className="text-base sm:text-lg text-accent font-serif mb-3 sm:mb-4">ความหมายของไพ่</p>
                  <p className="text-foreground leading-relaxed text-base sm:text-lg">
                    {selectedCard.interpretation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}


// Named export for testing
export { PredictionDetailPage };