'use client';

import { useState } from 'react';
import {
  QuestionInput,
  MimiAvatar,
  GlassCard,
} from '@/components';

export default function Home() {
  const [question, setQuestion] = useState('');

  const handleQuestionSubmit = (value: string) => {
    console.log('Question submitted:', value);
    // In a real app, this would trigger the tarot reading flow
  };

  return (
    <div className="p-4 md:p-6 overflow-y-auto no-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 pb-20">

          {/* Hero Section with Mimi Avatar */}
          <section className="text-center space-y-6 py-12">
            <div className="relative w-72 h-72 md:w-[28rem] md:h-[28rem] mx-auto flex items-center justify-center">
              <MimiAvatar />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight tracking-tight drop-shadow-lg animate-fade-in-up">
              What guidance
              <br />
              do you seek?
            </h1>
          </section>

          {/* Question Input Demo */}
          <section className="w-full max-w-3xl mx-auto">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-serif text-white mb-6 text-center">
                Ask Mimi Your Question
              </h2>
              <QuestionInput
                value={question}
                onChange={setQuestion}
                onSubmit={handleQuestionSubmit}
                placeholder="What would you like to know about your future?"
              />
            </GlassCard>
          </section> 
        </div>
    </div>
  );
}