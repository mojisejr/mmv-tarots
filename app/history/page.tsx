'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../components/card';
import { GlassButton } from '../../components/button';
import { ChevronRight } from '../../components/icons';
import { HistoryCard } from '../../components/history-card';
import { useNavigation } from '../../lib/providers/navigation-provider';
import { fetchUserPredictions, checkJobStatus } from '../../lib/api';

interface Prediction {
  id: string;
  question: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  selectedCards?: any[];
}

export default function HistoryPage() {
  const router = useRouter();
  const { setCurrentPage } = useNavigation();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkAndUpdatePrediction = useCallback(async (jobId: string) => {
    try {
      const status = await checkJobStatus(jobId);

      setPredictions(prev => {
        const index = prev.findIndex(p => p.id === jobId);
        if (index === -1) return prev;

        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: status.status,
          completedAt: status.completedAt || updated[index].completedAt,
          selectedCards: status.result?.selectedCards || updated[index].selectedCards,
        };

        return updated;
      });
    } catch (err) {
      console.error(`Failed to check status for ${jobId}:`, err);
    }
  }, []);

  const loadPredictions = useCallback(async () => {
    try {
      const data = await fetchUserPredictions();

      const transformedPredictions: Prediction[] = data.predictions.map(p => ({
        id: p.jobId,
        question: p.question,
        status: p.status,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
        selectedCards: p.finalReading ? (p.finalReading as any).selectedCards : undefined,
      }));

      setPredictions(transformedPredictions);

      // Set up polling for pending/processing predictions
      const pendingOrProcessing = transformedPredictions.filter(
        p => p.status === 'PENDING' || p.status === 'PROCESSING'
      );

      if (pendingOrProcessing.length > 0) {
        // Clear any existing interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        // Poll every 3 seconds
        pollingIntervalRef.current = setInterval(async () => {
          for (const prediction of pendingOrProcessing) {
            await checkAndUpdatePrediction(prediction.id);
          }
        }, 3000);
      } else {
        // Clear polling if no pending predictions
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to load predictions:', err);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [checkAndUpdatePrediction]);

  useEffect(() => {
    setCurrentPage('history');
    loadPredictions();

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [setCurrentPage, loadPredictions]);

  const handlePredictionClick = useCallback((predictionId: string) => {
    router.push(`/history/${predictionId}`);
  }, [router]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    loadPredictions();
  }, [loadPredictions]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-10 px-4 h-full flex flex-col pb-24">
        <h2 className="text-3xl font-serif text-white mb-8 text-center drop-shadow-md">Your Journey</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white/60">Loading your predictions...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-md mx-auto pt-10 px-4 h-full flex flex-col pb-24">
        <h2 className="text-3xl font-serif text-white mb-8 text-center drop-shadow-md">Your Journey</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-300 mb-4">{error}</div>
            <GlassButton onClick={handleRetry}>
              Retry
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-10 px-4 h-full flex flex-col pb-24">
      <h2 className="text-3xl font-serif text-white mb-8 text-center drop-shadow-md">Your Journey</h2>

      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 font-sans px-2">Recent Visions</h3>
        <div className="space-y-3 pb-4">
          {predictions.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p>No predictions found</p>
              <p className="text-sm mt-2">Submit your first question to see it here</p>
            </div>
          ) : (
            predictions.map((prediction) => (
              <HistoryCard
                key={prediction.id}
                prediction={prediction}
                onClick={handlePredictionClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}