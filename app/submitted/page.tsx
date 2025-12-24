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
        <GlassCard className="text-center p-8 !bg-white/5 !border-white/10">
          <h2 className="text-2xl font-serif text-white mb-3 drop-shadow-md">
            {error || 'Ticket Not Found'}
          </h2>
          <p className="text-white/60 mb-6">
            {error || 'The ticket ID you provided is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full transition-colors"
          >
            Go Home
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full px-4 h-full flex flex-col justify-center pb-20">
      <GlassCard className="text-center p-0 overflow-hidden !bg-white/5 !border-white/10">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-1000 ease-linear shadow-[0_0_10px_var(--primary)]"
            style={{ width: `${((currentStepIndex + 1) / WAITING_STEPS.length) * 100}%` }}
          ></div>
        </div>

        <div className="pt-12 pb-8 px-6">
          <div className="relative w-48 h-48 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <MimiLoadingAvatar />
            </div>
            <div className="absolute inset-0 bg-[var(--primary)] opacity-30 blur-[60px] rounded-full animate-pulse"></div>
          </div>

          <h2 className="text-2xl font-serif text-white mb-3 drop-shadow-md">Connecting...</h2>

          {/* Countdown display */}
          <div className="text-sm text-white/60 mb-3">
            Redirecting in {timeLeft} seconds...
          </div>

          <div
            className="flex items-center justify-center gap-2 text-xs text-white/60 mb-10 bg-white/5 hover:bg-white/10 py-2 px-5 rounded-full w-fit mx-auto cursor-pointer transition-colors font-mono border border-white/10"
            onClick={copyJobId}
          >
            <span>#{jobId}</span>
            <Copy className="w-3 h-3" />
          </div>

          {/* Skip button */}
          {showSkipOption && (
            <button
              onClick={skipRedirect}
              className="text-white/60 hover:text-white text-sm underline mb-6 transition-colors"
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
                    ? 'bg-white/10 border-white/20 text-white scale-105 shadow-lg backdrop-blur-sm'
                    : index < currentStepIndex
                    ? 'border-transparent text-white/40'
                    : 'border-transparent text-white/10'
                }`}
              >
                <div className={`p-2 rounded-full ${index <= currentStepIndex ? 'bg-white/10 text-[var(--primary)]' : 'bg-white/5'}`}>
                  {index < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : <step.Icon className="w-5 h-5" />}
                </div>
                <span className="font-medium text-sm tracking-wide">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 p-5 border-t border-white/5 mt-4 min-h-[90px] flex items-center justify-center backdrop-blur-sm">
          <p className="text-sm text-white/70 italic animate-fade-in font-serif px-4 leading-relaxed">
            "{FUN_FACTS[quoteIndex]}"
          </p>
        </div>
      </GlassCard>

      <p className="text-center text-[10px] text-white/30 mt-8 font-sans uppercase tracking-widest">
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