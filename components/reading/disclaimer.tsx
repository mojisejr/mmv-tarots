import React from 'react';
import { Info } from '@/components/ui';
import type { DisclaimerProps } from '@/types/reading';

export function Disclaimer({ text, className = '' }: DisclaimerProps) {
  if (!text) return null;

  return (
    <div
      data-testid="disclaimer-container"
      className={`flex items-start gap-2 mt-8 ${className}`}
      role="note"
    >
      <Info data-testid="info-icon" className="w-4 h-4 text-muted-foreground mt-0.5" />
      <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
        {text}
      </p>
    </div>
  );
}