'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  QuestionInput,
  MimiAvatar,
  GlassCard,
  GlassButton,
  Sparkles,
} from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { submitQuestion, saveSubmissionState } from '@/lib/client/api';

function Home() {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Detect mobile for performance optimization
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { 
    setCurrentPage, 
    setCurrentJobId, 
    isLoggedIn, 
    handleLoginClick 
  } = useNavigation();

  // Fetch stars on mount if logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/credits/balance')
        .then(res => res.json())
        .then(data => setStars(data.stars))
        .catch(console.error);
    }
  }, [isLoggedIn]);

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
              <MimiAvatar performanceMode={isMobile} />
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
        className="fixed bottom-24 md:bottom-8 left-0 right-0 z-40 bg-none transition-all duration-500 pb-[env(safe-area-inset-bottom)]"
      >
        <div
          data-testid="input-wrapper"
          className="w-full px-6 py-3 max-w-2xl mx-auto"
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
            stars === 0 ? (
              <div className="flex flex-col items-center space-y-4 py-2 animate-fade-in">
                <p className="text-white/60 text-sm font-medium">คุณไม่มี Star เหลือสำหรับการทำนาย</p>
                <GlassButton 
                  onClick={() => router.push('/package')}
                  className="w-full sm:w-auto px-10 py-4 text-lg font-semibold bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <span>เติม Star เพื่อรับคำทำนาย</span>
                  </div>
                </GlassButton>
              </div>
            ) : (
              <div className="relative">
                <QuestionInput
                  value={question}
                  onChange={setQuestion}
                  onSubmit={handleQuestionSubmit}
                  placeholder="What would you like to know about your future?"
                  textareaRef={textareaRef}
                  disabled={isSubmitting}
                  isSubmitting={isSubmitting}
                />
                {stars !== null && (
                  <div className="absolute -top-8 right-20 md:bottom-4 md:top-auto md:right-16 flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 pointer-events-none animate-fade-in">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-medium text-white/80">{stars}</span>
                  </div>
                )}
              </div>
            )
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