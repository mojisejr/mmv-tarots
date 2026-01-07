'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export function HistoryDetailView({ id: jobId }: { id: string }) {
  const router = useRouter();
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
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full flex flex-col pb-20">
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
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
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
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
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
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
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

  const mappedData = prediction.result?.reading
    ? (() => {
        try {
          return mapReadingData(prediction.result.reading);
        } catch (error) {
          console.error('Error mapping reading data:', error, { jobId });
          return null;
        }
      })()
    : null;

  if (!mappedData) {
    return (
      <div className="max-w-4xl mx-auto px-4 h-full pb-20">
        <div className="md:hidden pt-4 pb-2">
          <button onClick={handleBack} className="group flex items-center gap-2 text-foreground/60 hover:text-accent transition-all">
            <ChevronLeft className="w-4 h-4" />
            <span>กลับ</span>
          </button>
        </div>
        <GlassCard className="p-8 text-center">
          <h2 className="text-xl font-serif text-foreground mb-4">ข้อมูลการทำนายไม่สมบูรณ์</h2>
          <GlassButton onClick={handleBack} className="mx-auto">กลับไปหน้าประวัติ</GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (mappedData.cards.length === 0) {
    const cards = prediction.result?.selectedCards || [];
    return (
      <div className="max-w-4xl mx-auto px-4 h-full pb-20">
        <div className="space-y-6">
          <GlassCard className="p-6">
              <h1 className="text-2xl font-serif mb-4">{prediction.question}</h1>
              <div className="text-sm text-foreground/50">Job ID: #{jobId}</div>
          </GlassCard>
          {mappedData?.header && <ReadingHeader header={mappedData.header} />}
          {mappedData?.reading && (
            <GlassCard className="p-8 bg-glass-mimi">
               <h2 className="text-2xl font-serif mb-6">คำทำนาย</h2>
               <p className="whitespace-pre-wrap text-lg font-serif">{mappedData.reading}</p>
            </GlassCard>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 h-full pb-20">
      <div className="md:hidden pt-4 pb-2">
        <button onClick={handleBack} className="flex items-center gap-2 text-foreground/60"><ChevronLeft /> กลับ</button>
      </div>

      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-serif text-foreground mb-4">{prediction.question}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Job ID: #{jobId}</span>
                {prediction.completedAt && <span>{formatDate(prediction.completedAt)}</span>}
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
        </GlassCard>

        {mappedData?.header && <ReadingHeader header={mappedData.header} />}

        {mappedData?.cards && (
          <div className="space-y-8">
            <h2 className="text-xl font-serif text-foreground px-2">ไพ่ที่ได้รับ</h2>
            <CardSpread cards={mappedData.cards} onCardClick={setSelectedCard} />
          </div>
        )}

        {mappedData?.reading && (
          <GlassCard className="p-8 bg-glass-mimi">
            <h2 className="text-2xl font-serif mb-6">คำทำนาย</h2>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-lg font-serif">
              {mappedData.reading}
            </p>
          </GlassCard>
        )}

        {mappedData?.suggestions && <SuggestionsList suggestions={mappedData.suggestions} />}
        {mappedData?.nextQuestions && <NextQuestions questions={mappedData.nextQuestions} />}
        {mappedData?.finalSummary && <FinalSummary summary={mappedData.finalSummary} />}
        
        {mappedData?.cards && (
            <ShareActions 
                predictionId={jobId}
                cardName={mappedData.cards[0]?.name_th || 'คำทำนาย'}
                variant="card"
            />
        )}

        {mappedData?.disclaimer && <Disclaimer text={mappedData.disclaimer} />}
      </div>

      <Modal isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} title={selectedCard?.name_th}>
        {selectedCard && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
              <TarotCardImage
                card={{
                  id: selectedCard.name_en,
                  name: selectedCard.name_en,
                  displayName: selectedCard.name_th,
                  imageUrl: selectedCard.image,
                  keywords: selectedCard.keywords,
                }}
                width={250}
                height={375}
                className="rounded-xl shadow-2xl"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs text-accent font-serif uppercase tracking-widest">{selectedCard.arcana}</p>
                  <h3 className="text-2xl font-serif text-foreground">{selectedCard.name_th}</h3>
                  <p className="text-muted-foreground italic">{selectedCard.name_en}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {selectedCard.keywords.map((k, i) => (
                    <span key={i} className="px-3 py-1 text-xs rounded-full bg-accent/5 border border-accent/10">{k}</span>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                  <p className="text-foreground leading-relaxed">{selectedCard.interpretation}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
