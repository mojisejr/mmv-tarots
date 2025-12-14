'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../components/card';
import { GlassButton } from '../../components/button';
import { Search, ChevronRight } from '../../components/icons';
import { useNavigation } from '../../lib/providers/navigation-provider';
import { fetchUserPredictions, checkJobStatus } from '../../lib/api';

interface Prediction {
  id: string;
  date: string;
  query: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'pending' | 'processing' | 'completed' | 'failed';
}

export default function HistoryPage() {
  const router = useRouter();
  const { setCurrentPage } = useNavigation();
  const [inputJobId, setInputJobId] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set current page in navigation context
    setCurrentPage('history');

    // Fetch user predictions
    const loadPredictions = async () => {
      try {
        // Fetch predictions for the current user
        const data = await fetchUserPredictions();

        // Transform API data to component format
        const transformedPredictions = data.predictions.map(p => ({
          id: p.jobId,
          date: formatDate(p.createdAt),
          query: p.question,
          status: p.status.toLowerCase() as 'pending' | 'processing' | 'completed' | 'failed',
        }));

        setPredictions(transformedPredictions);
      } catch (err) {
        console.error('Failed to load predictions:', err);
        setError('Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, [setCurrentPage]);

  const handleSearch = () => {
    if (inputJobId.trim()) {
      // Navigate to submitted page with the jobId
      router.push(`/submitted?jobId=${inputJobId.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePredictionClick = (predictionId: string) => {
    // Navigate to submitted page to check status
    router.push(`/submitted?jobId=${predictionId}`);
  };

  // Filter predictions based on search
  const filteredPredictions = predictions.filter(prediction =>
    prediction.id.toLowerCase().includes(inputJobId.toLowerCase()) ||
    prediction.query.toLowerCase().includes(inputJobId.toLowerCase())
  );

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
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-10 px-4 h-full flex flex-col pb-24">
      <h2 className="text-3xl font-serif text-white mb-8 text-center drop-shadow-md">Your Journey</h2>

      <GlassCard className="mb-8 p-6">
        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 font-sans">Find Ticket</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputJobId}
            onChange={(e) => setInputJobId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="#12345"
            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono text-lg placeholder-white/20 transition-all"
          />
          <GlassButton variant="icon" onClick={handleSearch} disabled={!inputJobId.trim()}>
            <Search className="w-5 h-5" />
          </GlassButton>
        </div>
      </GlassCard>

      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 font-sans px-2">Recent Visions</h3>
        <div className="space-y-3 pb-4">
          {filteredPredictions.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p>No predictions found</p>
              <p className="text-sm mt-2">Submit your first question to see it here</p>
            </div>
          ) : (
            filteredPredictions.map((item) => (
              <div
                key={item.id}
                className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all duration-300"
                onClick={() => handlePredictionClick(item.id)}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-white font-medium truncate text-base mb-1 font-sans group-hover:text-[var(--primary)] transition-colors">
                  {item.query}
                </div>
                <div className="text-xs text-white/40 font-mono flex items-center gap-2">
                  <span>#{item.id}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span>{item.date}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}