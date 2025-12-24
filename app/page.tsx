'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  QuestionInput,
  MimiAvatar,
  GlassCard,
  GlassButton,
} from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { submitQuestion, saveSubmissionState } from '@/lib/client/api';

function Home() {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { 
    setCurrentPage, 
    setCurrentJobId, 
    isLoggedIn, 
    handleLoginClick 
  } = useNavigation();

  // Auto focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleQuestionSubmit = async (value: string) => {
    // Validate input
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setError('Please enter a question');
      return;
    }

    if (trimmedValue.length > 1000) {
      setError('Question must be less than 1000 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit question to API
      const response = await submitQuestion(trimmedValue);

      // Save submission state
      saveSubmissionState(response.jobId);

      // Update navigation state
      setCurrentJobId(response.jobId);
      setCurrentPage('submitted');

      // Navigate to submitted page with jobId
      router.push(`/submitted?jobId=${response.jobId}`);
    } catch (err) {
      console.error('Failed to submit question:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-none backdrop-blur-xl  shadow-2xl transition-all duration-300"
      >
        <div
          data-testid="input-wrapper"
          className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 max-w-4xl mx-auto"
        >
          {/* Error display */}
          {error && (
            <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mb-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {isLoggedIn ? (
            <QuestionInput
              value={question}
              onChange={setQuestion}
              onSubmit={handleQuestionSubmit}
              placeholder="What would you like to know about your future?"
              textareaRef={textareaRef}
              disabled={isSubmitting}
            />
          ) : (
            <div className="flex flex-col items-center space-y-4 py-2 animate-fade-in">
              <p className="text-white/60 text-sm font-medium">เข้าสู่ระบบเพื่อเริ่มการทำนาย</p>
              <GlassButton 
                onClick={handleLoginClick}
                className="w-full sm:w-auto px-10 py-4 text-lg font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg"
              >
                เข้าสู่ระบบด้วย LINE
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Home;