'use client';

import { useState, useEffect, useRef } from 'react';
import {
  QuestionInput,
  MimiAvatar,
  GlassCard,
} from '@/components';

function Home() {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleQuestionSubmit = (value: string) => {
    console.log('Question submitted:', value);
    // In a real app, this would trigger the tarot reading flow
  };

  return (
    <>
      {/* Main Content */}
      <div
        data-testid="main-content"
        className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 overflow-y-auto no-scrollbar pb-20 sm:pb-24 md:pb-28"
      >
        <div className="max-w-6xl mx-auto space-y-8">
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
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div
        data-testid="bottom-input-container"
        className="fixed bottom-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-t border-white/10 shadow-2xl transition-all duration-300"
      >
        <div
          data-testid="input-wrapper"
          className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 max-w-4xl mx-auto"
        >
          <QuestionInput
            value={question}
            onChange={setQuestion}
            onSubmit={handleQuestionSubmit}
            placeholder="What would you like to know about your future?"
            textareaRef={textareaRef}
          />
        </div>
      </div>
    </>
  );
}

export default Home;