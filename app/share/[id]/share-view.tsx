'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassButton, Modal, ArrowRight, Sparkles, Gift } from '@/components';
import {
  ReadingHeader,
  CardSpread,
  SuggestionsList,
  NextQuestions,
  FinalSummary,
  Disclaimer
} from '@/components/reading';
import { TarotCardImage } from '@/components/features/tarot';
import type { MappedReadingData, CardReading } from '@/types/reading';
import { motion } from 'framer-motion';

interface ShareViewProps {
  data: MappedReadingData;
  predictionId: string; // Keep for reference if needed
  referrerName?: string | null;
}

export function ShareView({ data, predictionId, referrerName }: ShareViewProps) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<CardReading | null>(null);

  const handleStartOwnReading = () => {
    router.push('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 h-full pb-20 pt-8">
      {/* Referral Welcome Banner */}
      {referrerName && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <GlassCard className="p-4 border-accent/30 bg-accent/5 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
              <Gift className="w-24 h-24 text-accent" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 border border-accent/20">
                <Gift className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground">คุณได้รับของขวัญจาก {referrerName}!</h4>
                <p className="text-xs text-muted-foreground">
                  เพื่อนส่งคำทำนายนี้ให้คุณ พร้อมสิทธิ์รับ <span className="text-accent font-bold">1 Star ฟรี</span> เมื่อสมัครสมาชิกครั้งแรก
                </p>
              </div>
              <GlassButton 
                onClick={() => router.push('/')}
                className="!px-3 !py-1.5 text-xs bg-accent/20 border-accent/20 hover:bg-accent/30 whitespace-nowrap"
              >
                รับสิทธิ์เลย
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Header / Intro */}
      <div className="text-center mb-8">
        <GlassCard className="inline-block px-4 py-1 mb-4 rounded-full border-primary/20 bg-primary/10">
          <span className="text-xs font-serif uppercase tracking-widest text-primary-300 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Shared Prediction
          </span>
        </GlassCard>
      </div>

      <div className="space-y-8">
        {/* Reading Header */}
        {data.header && (
          <ReadingHeader header={data.header} />
        )}

        {/* Cards Details */}
        {data.cards && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2 justify-center md:justify-start">
              <div className="w-1 h-6 bg-primary/60 rounded-full hidden md:block"></div>
              <h2 className="text-xl font-serif text-foreground text-center md:text-left w-full md:w-auto">
                ไพ่ที่ได้รับ
              </h2>
            </div>
            
            <CardSpread 
              cards={data.cards} 
              onCardClick={setSelectedCard} 
            />
          </div>
        )}

        {/* Main Reading Text */}
        {data.reading && (
          <GlassCard className="p-8 bg-glass-mimi">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent"></div>
              <h2 className="text-2xl font-serif text-foreground">คำทำนาย</h2>
            </div>
            <div className="prose max-w-none">
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-lg font-serif">
                {data.reading}
              </p>
            </div>
          </GlassCard>
        )}

        {/* Suggestions */}
        {data.suggestions && data.suggestions.length > 0 && (
          <SuggestionsList suggestions={data.suggestions} />
        )}

        {/* Next Questions */}
        {data.nextQuestions && data.nextQuestions.length > 0 && (
          <NextQuestions questions={data.nextQuestions} />
        )}

        {/* Final Summary */}
        {data.finalSummary && (
          <FinalSummary summary={data.finalSummary} />
        )}

        {/* Conversion / Call to Action Card */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-8 relative overflow-hidden group border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-2xl font-serif text-foreground">
                 ตาคุณแล้ว...
              </h3>
              <p className="text-muted-foreground max-w-md">
                คำทำนายนี้เป็นเพียงส่วนหนึ่งของเรื่องราว ค้นพบคำตอบสำหรับคำถามของคุณเองได้ที่ MimiVibe
              </p>
              
              <GlassButton 
                className="mt-4 min-w-[200px] border-primary/30 hover:bg-primary/20 text-foreground py-4 text-lg"
                onClick={handleStartOwnReading}
              >
                <span className="flex items-center gap-2">
                  เริ่มทำนายฟรี
                  <ArrowRight className="w-4 h-4" />
                </span>
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Disclaimer */}
        {data.disclaimer && (
          <Disclaimer text={data.disclaimer} />
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
