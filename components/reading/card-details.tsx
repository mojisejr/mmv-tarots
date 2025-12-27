import React from 'react';
import { GlassCard } from '@/components/ui';
import { TarotCardImage } from '@/components/features/tarot';
import type { CardDetailsProps } from '@/types/reading';

interface ExtendedCardDetailsProps extends CardDetailsProps {
  onClick?: () => void;
  isInteractive?: boolean;
}

export function CardDetails({ card, className = '', onClick, isInteractive = true }: ExtendedCardDetailsProps) {
  const getPositionName = (position: number): string => {
    switch (position) {
      case 0: return 'อดีต';
      case 1: return 'ปัจจุบัน';
      case 2: return 'อนาคต';
      default: return `ตำแหน่ง ${position + 1}`;
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`group transition-all duration-500 ${isInteractive ? 'cursor-pointer hover:scale-[1.02]' : ''} ${className}`}
    >
      <GlassCard className="p-6 h-full border-white/10 group-hover:border-white/30 group-hover:bg-white/10 transition-all duration-500">
        <div className="text-center">
          <p className="text-sm text-[var(--color-primary)] font-serif mb-3 uppercase tracking-widest opacity-80">
            {getPositionName(card.position)}
          </p>
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
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
              className="mx-auto relative rounded-lg shadow-lg group-hover:shadow-2xl transition-all duration-500"
            />
          </div>
          <h3 className="text-xl font-serif text-foreground mb-1 group-hover:text-[var(--color-primary)] transition-colors">
            {card.name_th}
          </h3>
          <p className="text-sm text-muted-foreground italic mb-3">{card.name_en}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
            <span className="text-xs text-white/60 group-hover:text-white/90">{card.arcana}</span>
          </div>
          
          {isInteractive && (
            <p className="mt-4 text-[10px] text-white/30 uppercase tracking-tighter group-hover:text-white/60 transition-colors">
              คลิกเพื่อดูความหมาย
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
