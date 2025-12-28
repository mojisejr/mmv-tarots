'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  QuestionInput,
  MimiAvatar,
  GlassButton,
  Sparkles,
} from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { submitQuestion, saveSubmissionState, fetchBalance } from '@/lib/client/api';

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
      fetchBalance()
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
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden pb-32 md:pb-0">
      {/* Main Content Area (The Sacred Space) */}
      <div
        data-testid="main-content"
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 w-full max-w-4xl mx-auto z-10"
      >
        {/* Hero Section with Mimi Avatar */}
        <section className="w-full flex flex-col items-center justify-center space-y-6 md:space-y-10 animate-fade-in-up relative">
          {/* Mimi Avatar as Background */}
          <MimiAvatar performanceMode={isMobile} />

          {/* Heading - Text Balance for perfect wrapping */}
          <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl font-serif text-center text-white leading-tight tracking-tight drop-shadow-lg text-balance pt-20 md:pt-0">
            <span className="text-white/90">What guidance</span>
            <br />
            <span className="text-gradient-gold font-medium">do you seek?</span>
          </h1>
        </section>
      </div>

      {/* Input Section (The Offering) - Sticky Bottom */}
      <div
        data-testid="bottom-input-container"
        className="fixed bottom-[90px] md:sticky md:bottom-0 left-0 right-0 z-40 w-full pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-background via-background/80 to-transparent pt-12"
      >
        <div
          data-testid="input-wrapper"
          className="w-full px-4 sm:px-6 py-4 max-w-2xl mx-auto"
        >
          {/* Error display */}
          {error && (
            <div className="mb-4 animate-fade-in">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            </div>
          )}

          {isLoggedIn ? (
            stars === 0 ? (
              <div className="flex flex-col items-center space-y-4 animate-fade-in pb-4">
                <p className="text-white/60 text-sm font-medium">คุณไม่มี Star เหลือสำหรับการทำนาย</p>
                <GlassButton 
                  onClick={() => router.push('/package')}
                  className="w-full sm:w-auto px-8 py-3 text-base font-semibold bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg glass-celestial"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>เติม Star เพื่อรับคำทำนาย</span>
                  </div>
                </GlassButton>
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative">
                  <QuestionInput
                    value={question}
                    onChange={setQuestion}
                    onSubmit={handleQuestionSubmit}
                    placeholder="Ask the stars..."
                    textareaRef={textareaRef}
                    disabled={isSubmitting}
                    isSubmitting={isSubmitting}
                  />
                  {stars !== null && (
                    <div className="absolute -top-10 right-0 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-none animate-fade-in shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-medium text-white/90">{stars} Stars</span>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center space-y-4 animate-fade-in pb-4">
              <p className="text-white/60 text-sm font-medium">เข้าสู่ระบบเพื่อเริ่มการทำนาย</p>
              <GlassButton 
                onClick={handleLoginClick}
                className="w-full sm:w-auto px-8 py-3 text-base font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg glass-celestial"
              >
                เข้าสู่ระบบด้วย LINE
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
