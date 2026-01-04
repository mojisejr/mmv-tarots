'use client';

import { useEffect, useState, Suspense } from 'react';
import { ErrorBoundary, GlassCard, Copy, CheckCircle2 } from '@/components';
import { useRouter, useSearchParams } from 'next/navigation';
import { MimiLoadingAvatar } from '../../components/features/avatar/mimi-loading-avatar';
import { WAITING_STEPS, FUN_FACTS } from '../../constants/waiting-steps';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { checkJobStatus, getSubmissionState } from '@/lib/client/api';

function SubmittedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentPage } = useNavigation();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for performance optimization
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get jobId from URL search params or fallback to sessionStorage
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    const urlJobId = searchParams?.get('jobId');
    if (urlJobId) {
      setJobId(urlJobId);
    } else {
      const { jobId: savedJobId } = getSubmissionState();
      if (savedJobId) {
        setJobId(savedJobId);
      }
    }
  }, [searchParams]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = () => {
    // Defer navigation to prevent setState during render
    setTimeout(() => {
      router.push('/history');
    }, 0);
  };

  const skipRedirect = () => {
    handleComplete();
  };

  const copyJobId = () => {
    alert(`Copied Ticket ID: ${jobId}`);
  };

  useEffect(() => {
    // Set current page in navigation context
    setCurrentPage('submitted');

    // If no jobId after checking both URL and sessionStorage, redirect to home
    if (!jobId) {
      const timeout = setTimeout(() => {
        if (!jobId) {
          setError('No job ID provided');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      }, 500); // Small delay to allow state to sync
      return () => clearTimeout(timeout);
    }

    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < WAITING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 3500);

    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 5000);

    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 5) {
          setShowSkipOption(true);
        }
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Poll for job status every 5 seconds
    const statusInterval = setInterval(async () => {
      try {
        const status = await checkJobStatus(jobId);
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          clearInterval(statusInterval);
          handleComplete();
        }
      } catch (err) {
        console.error('Failed to check job status:', err);
      }
    }, 5000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(quoteInterval);
      clearInterval(countdownInterval);
      clearInterval(statusInterval);
    };
  }, [jobId, router, setCurrentPage]);

  // Show error state if no jobId
  if (error || !jobId) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 h-full flex flex-col justify-center pb-20">
        <GlassCard className="text-center p-8 glass-mimi">
          <h2 className="text-2xl font-serif text-foreground mb-3">
            {error || 'Ticket Not Found'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || 'The ticket ID you provided is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary/10 hover:bg-primary/20 text-foreground px-6 py-3 rounded-full transition-colors border border-primary/20"
          >
            Go Home
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full px-4 h-full flex flex-col justify-center pb-20">
      <GlassCard className="text-center p-0 overflow-hidden glass-mimi">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/10">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-linear shadow-glow-primary"
            style={{ width: `${((currentStepIndex + 1) / WAITING_STEPS.length) * 100}%` }}
          ></div>
        </div>

        <div className="pt-12 pb-8 px-6">
          <div className="relative w-48 h-48 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <MimiLoadingAvatar performanceMode={isMobile} />
            </div>
            <div className="absolute inset-0 bg-primary opacity-30 blur-[60px] rounded-full animate-pulse"></div>
          </div>

          <h2 className="text-2xl font-serif text-foreground mb-3">Connecting...</h2>

          {/* Countdown display */}
          <div className="text-sm text-muted-foreground mb-3">
            Redirecting in {timeLeft} seconds...
          </div>

          <div
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-10 bg-primary/5 hover:bg-primary/10 py-2 px-5 rounded-full w-fit mx-auto cursor-pointer transition-colors font-mono border border-primary/10"
            onClick={copyJobId}
          >
            <span>#{jobId}</span>
            <Copy className="w-3 h-3" />
          </div>

          {/* Skip button */}
          {showSkipOption && (
            <button
              onClick={skipRedirect}
              className="text-muted-foreground hover:text-foreground text-sm underline mb-6 transition-colors"
            >
              Skip waiting
            </button>
          )}

          <div className="space-y-4 text-left w-full max-w-xs mx-auto font-sans">
            {WAITING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 border ${
                  index === currentStepIndex
                    ? 'bg-primary/10 border-primary/20 text-foreground scale-105 shadow-warm backdrop-blur-sm'
                    : index < currentStepIndex
                    ? 'border-transparent text-muted-foreground/40'
                    : 'border-transparent text-muted-foreground/10'
                }`}
              >
                <div className={`p-2 rounded-full ${index <= currentStepIndex ? 'bg-primary/10 text-accent' : 'bg-black/5'}`}>
                  {index < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : <step.Icon className="w-5 h-5" />}
                </div>
                <span className="font-medium text-sm tracking-wide">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 p-5 border-t border-primary/10 mt-4 min-h-[90px] flex items-center justify-center backdrop-blur-sm">
          <p className="text-sm text-muted-foreground italic animate-fade-in font-serif px-4 leading-relaxed">
            "{FUN_FACTS[quoteIndex]}"
          </p>
        </div>
      </GlassCard>

      <p className="text-center text-[10px] text-muted-foreground/30 mt-8 font-sans uppercase tracking-widest">
        You can close this window.
      </p>
    </div>
  );
}

export default function SubmittedPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <SubmittedPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}