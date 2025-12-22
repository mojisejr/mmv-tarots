import React from 'react';
import { GlassCard, Star } from '@/components/ui';
import type { FinalSummaryProps } from '@/types/reading';

export function FinalSummary({ summary, className = '' }: FinalSummaryProps) {
  if (!summary) return null;

  return (
    <GlassCard className={`p-6 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 border border-[var(--color-primary)]/30 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Star data-testid="star-icon" className="w-5 h-5 text-[var(--color-primary)]" />
        <h2 className="text-xl font-serif text-white">สรุปผลการทำนาย</h2>
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-lg leading-relaxed font-serif italic text-[#ffffff] whitespace-pre-wrap">
          {summary}
        </p>
      </div>
    </GlassCard>
  );
}