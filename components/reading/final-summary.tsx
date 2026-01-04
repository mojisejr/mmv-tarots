import React from 'react';
import { GlassCard, Star } from '@/components/ui';
import type { FinalSummaryProps } from '@/types/reading';

export function FinalSummary({ summary, className = '' }: FinalSummaryProps) {
  if (!summary) return null;

  return (
    <GlassCard className={`p-6 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Star data-testid="star-icon" className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-serif text-foreground">สรุปผลการทำนาย</h2>
      </div>

      <div className="prose max-w-none">
        <p className="text-lg leading-relaxed font-serif italic text-foreground whitespace-pre-wrap">
          {summary}
        </p>
      </div>
    </GlassCard>
  );
}