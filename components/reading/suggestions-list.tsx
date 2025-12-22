import React from 'react';
import { GlassCard, Lightbulb } from '@/components/ui';
import type { SuggestionsListProps } from '@/types/reading';

export function SuggestionsList({ suggestions, className = '' }: SuggestionsListProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb data-testid="lightbulb-icon" className="w-5 h-5 text-[var(--color-primary)]" />
        <h2 className="text-xl font-serif text-white">คำแนะนำ</h2>
      </div>

      <ul className="space-y-3" role="list">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-[#ffffffcc] leading-relaxed"
            role="listitem"
          >
            <span
              data-testid="suggestion-bullet"
              className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0"
            />
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}