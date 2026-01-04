'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassButton, HistoryCard, HistoryControls } from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { fetchUserPredictions, checkJobStatus } from '@/lib/client/api';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

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

  const filteredPredictions = useMemo(() => {
    let result = [...predictions];

    // Filter by Status
    if (statusFilter !== 'ALL') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.question.toLowerCase().includes(query) || 
        p.id.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [predictions, statusFilter, searchQuery, sortBy]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pt-10 px-4 h-full flex flex-col pb-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-foreground mb-2">Your Journey</h2>
          <p className="text-muted-foreground text-sm">Loading your visions...</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto pt-10 px-4 h-full flex flex-col pb-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-foreground mb-2">Your Journey</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-destructive mb-4">{error}</div>
            <GlassButton onClick={handleRetry}>
              Retry
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-10 px-4 h-full flex flex-col pb-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-foreground mb-2">Your Journey</h2>
        <p className="text-muted-foreground text-sm">The path you have walked, revealed in the cards.</p>
      </div>

      <HistoryControls 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="flex-1 overflow-y-auto -mx-4 px-4 custom-scrollbar">
        {filteredPredictions.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 bg-primary/5 rounded-3xl border border-primary/10 backdrop-blur-sm">
            <p className="text-lg font-serif mb-2">No visions found</p>
            <p className="text-sm text-muted-foreground/60">
              {searchQuery || statusFilter !== 'ALL' 
                ? "Try adjusting your filters to see more results."
                : "Submit your first question to begin your journey."}
            </p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 pb-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredPredictions.map((prediction) => (
                <motion.div
                  key={prediction.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <HistoryCard
                    prediction={prediction}
                    onClick={handlePredictionClick}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
