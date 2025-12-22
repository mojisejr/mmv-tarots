import React from 'react';
import { GlassCard, HelpCircle } from '@/components/ui';
import type { NextQuestionsProps } from '@/types/reading';

export function NextQuestions({ questions, className = '' }: NextQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <HelpCircle data-testid="help-circle-icon" className="w-5 h-5 text-[var(--color-accent)]" />
        <h2 className="text-xl font-serif text-white">คำถามสำหรับความคิดต่อ</h2>
      </div>

      <p className="text-[#ffffffdd] mb-4">คำถามที่ควรพิจารณาต่อไป:</p>

      <ul className="space-y-2 mt-4" role="list">
        {questions.map((question, index) => (
          <li
            key={index}
            className="text-[#ffffffdd] italic leading-relaxed pl-6 border-l-2 border-[#ffffff33] hover:border-[var(--color-primary)] transition-colors"
            role="listitem"
          >
            {question}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}