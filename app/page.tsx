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
import { submitQuestion, saveSubmissionState, RateLimitError } from '@/lib/client/api';

function Home() {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
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
    stars,
    lastPredictionAt,
    handleLoginClick 
  } = useNavigation();

  // Cooldown Timer Logic
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Calculate initial cooldown if lastPredictionAt exists
  useEffect(() => {
    if (isLoggedIn && lastPredictionAt) {
      const lastTime = new Date(lastPredictionAt).getTime();
      const now = new Date().getTime();
      const diffSeconds = Math.floor((now - lastTime) / 1000);
      const cooldownSeconds = 120; // 2 minutes
      
      if (diffSeconds < cooldownSeconds) {
        setCooldownRemaining(cooldownSeconds - diffSeconds);
      }
    }
  }, [isLoggedIn, lastPredictionAt]);

  // Auto focus on mount
  useEffect(() => {
    if (textareaRef.current && cooldownRemaining === 0) {
      textareaRef.current.focus();
    }
  }, [cooldownRemaining]);

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
      
      if (err instanceof RateLimitError) {
        setCooldownRemaining(err.retryAfter);
        setError(null); // Clear error as we show timer instead
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit question. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100dvh-80px)] flex flex-col relative overflow-hidden">
      {/* Main Content Area (The Sacred Space) */}
      <div
        data-testid="main-content"
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 w-full max-w-4xl mx-auto z-10 pb-40"
      >
        {/* Hero Section with Mimi Avatar */}
        <section className="w-full flex flex-col items-center justify-center space-y-6 md:space-y-10 animate-fade-in-up relative">
          {/* Mimi Avatar as Background */}
          <MimiAvatar performanceMode={isMobile} />

          {/* Heading - Text Balance for perfect wrapping */}
          <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl font-serif text-center text-foreground leading-tight tracking-tight text-balance pt-10 md:pt-0">
            <span className="text-text-main">What guidance</span>
            <br />
            <span className="text-primary-strong font-medium">do you seek?</span>
          </h1>
        </section>
      </div>

      {/* Input Section (The Offering) - Sticky Bottom */}
      <div
        data-testid="bottom-input-container"
        className="fixed bottom-[90px] md:sticky md:bottom-0 left-0 right-0 z-40 w-full pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-background via-background/80 to-transparent pt-6"
      >
        <div
          data-testid="input-wrapper"
          className="w-full px-4 sm:px-6 py-4 max-w-2xl mx-auto"
        >
          {/* Error display */}
          {error && (
            <div className="mb-4 animate-fade-in">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-destructive text-sm text-center">{error}</p>
              </div>
            </div>
          )}

          {isLoggedIn ? (
            stars === 0 ? (
              <div className="flex flex-col items-center space-y-4 animate-fade-in pb-4">
                <p className="text-muted-foreground text-sm font-medium">คุณไม่มี Star เหลือสำหรับการทำนาย</p>
                <GlassButton 
                  onClick={() => router.push('/package')}
                  className="w-full sm:w-auto px-8 py-3 text-base font-semibold bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg glass-celestial"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
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
                    placeholder={cooldownRemaining > 0 ? `Mimi is resting... (${Math.floor(cooldownRemaining / 60)}:${(cooldownRemaining % 60).toString().padStart(2, '0')})` : "Ask the stars..."}
                    textareaRef={textareaRef}
                    disabled={isSubmitting || cooldownRemaining > 0}
                    isSubmitting={isSubmitting}
                    cooldownRemaining={cooldownRemaining}
                  />
                  {stars !== null && (
                    <div className="absolute -top-10 right-0 flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20 pointer-events-none animate-fade-in shadow-warm">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs font-medium text-foreground">{stars} Stars</span>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center space-y-4 animate-fade-in pb-4">
              <p className="text-muted-foreground text-sm font-medium">เข้าสู่ระบบเพื่อเริ่มการทำนาย</p>
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
