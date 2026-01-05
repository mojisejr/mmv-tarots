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
      <GlassCard className="p-6 h-full border-primary/10 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-500">
        <div className="text-center">
          {/* <p className="text-sm text-primary font-serif mb-3 uppercase tracking-widest opacity-80">
            {getPositionName(card.position)}
          </p> */}
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
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
          <h3 className="text-xl font-serif text-foreground mb-1 group-hover:text-accent transition-colors duration-300">
            {card.name_th}
          </h3>
          <p className="text-sm text-foreground/60 italic mb-3 group-hover:text-foreground/80 transition-colors">
            {card.name_en}
          </p>
          
          {isInteractive && (
            <p className="mt-4 text-[10px] text-foreground/40 uppercase tracking-tighter group-hover:text-accent/60 transition-colors">
              คลิกเพื่อดูความหมาย
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
