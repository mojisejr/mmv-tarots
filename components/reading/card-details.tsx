import React from 'react';
import { GlassCard } from '../card';
import { TarotCardImage } from '../features/tarot/tarot-card-image';
import type { CardDetailsProps } from '@/types/reading';

export function CardDetails({ card, className = '' }: CardDetailsProps) {
  const getPositionName = (position: number): string => {
    switch (position) {
      case 0: return 'อดีต';
      case 1: return 'ปัจจุบัน';
      case 2: return 'อนาคต';
      default: return `ตำแหน่ง ${position + 1}`;
    }
  };

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="text-center mb-4">
        <p className="text-lg text-[var(--color-primary)] font-serif mb-3">
          {getPositionName(card.position)}
        </p>
        <div className="mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-xl blur-xl"></div>
          <TarotCardImage
            card={{
              id: card.name_en,
              name: card.name_en,
              displayName: card.name_th,
              imageUrl: card.image,
              keywords: card.keywords,
            }}
            width={150}
            height={225}
            className="mx-auto relative"
          />
        </div>
        <h3 className="text-xl font-serif text-white mb-1">{card.name_th}</h3>
        <p className="text-sm text-[#ffffff99] italic">{card.name_en}</p>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-[#ffffff0d] border border-[#ffffff20]">
          <span className="text-xs text-[#ffffffdd]">{card.arcana}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#ffffff99] font-mono uppercase tracking-wider mb-2">Keywords</p>
          <div className="flex flex-wrap gap-2">
            {card.keywords.map((keyword, index) => (
              <span
                key={index}
                data-testid="keyword-chip"
                className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-[#ffffff1a] to-[#ffffff0d] border border-[#ffffff20] text-[#ffffffdd] hover:from-[#ffffff2a] hover:to-[#ffffff1d] transition-all duration-300"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#ffffff0d] rounded-xl p-4 border border-[#ffffff10]">
          <p className="text-sm text-[var(--color-primary)] font-serif mb-2">คำทำนาย</p>
          <p className="text-sm text-[#ffffffcc] leading-relaxed">{card.interpretation}</p>
        </div>
      </div>
    </GlassCard>
  );
}