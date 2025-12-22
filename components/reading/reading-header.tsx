import React from 'react';
import { GlassCard } from '@/components/ui';
import type { ReadingHeaderProps } from '@/types/reading';

export function ReadingHeader({ header, className = '' }: ReadingHeaderProps) {
  if (!header) return null;

  return (
    <GlassCard className={`text-center p-6 ${className}`}>
      <h2 className="text-2xl font-serif text-white mb-2">
        {header}
      </h2>
      <div className="w-16 h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full mx-auto"></div>
    </GlassCard>
  );
}