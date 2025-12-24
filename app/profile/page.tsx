'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/client/auth-client';
import { GlassCard, GlassButton, HistoryCard } from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { fetchUserPredictions } from '@/lib/client/api';
import { TransactionHistoryList } from '@/components/features/transaction-history-list';
import { User, Gift, QrCode, LogOut, Sparkles, History } from 'lucide-react';

interface Prediction {
  id: string;
  question: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  selectedCards?: any[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { setCurrentPage } = useNavigation();
  const { data: session, isPending } = useSession();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [activeTab, setActiveTab] = useState<'predictions' | 'transactions'>('predictions');

  useEffect(() => {
    setCurrentPage('profile');
  }, [setCurrentPage]);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isPending && !session) {
      router.push('/');
      return;
    }

    // Load predictions when user is authenticated
    if (session?.user?.id) {
      loadPredictions();
      // In a real app, we should fetch stars from API
      // For now, we'll assume session update or separate fetch
      // But since we don't have a dedicated user/me endpoint that returns stars yet,
      // let's fetch it via a new helper or just rely on what we have.
      // Actually, let's add a quick fetch for stars
      fetchUserStars();
    }
  }, [session, isPending, router]);

  const fetchUserStars = async () => {
    try {
      const res = await fetch('/api/credits/balance');
      if (res.ok) {
        const data = await res.json();
        setStars(data.stars);
      }
    } catch (err) {
      console.error('Failed to fetch stars:', err);
    }
  };

  const loadPredictions = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error('Failed to load predictions:', err);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionClick = (predictionId: string) => {
    router.push(`/history/${predictionId}`);
  };

  const handleSignOut = async () => {
    const { signOut } = await import('@/lib/client/auth-client');
    await signOut();
    router.push('/');
  };

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="max-w-md mx-auto pt-10 px-4 h-full flex items-center justify-center pb-24">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div className="max-w-2xl mx-auto pt-6 px-4 pb-32">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8 space-y-4">
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-24 h-24 rounded-full border-2 border-primary/50 shadow-glow-primary"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/20">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{user.name || 'Cosmic Traveler'}</h1>
          <p className="text-white/40 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Stars Wallet Card */}
      <GlassCard className="mb-8 !bg-gradient-to-br from-white/10 to-white/5 border-primary/20">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-white/60 text-xs uppercase tracking-widest">Your Balance</p>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-3xl font-bold text-white">{stars}</span>
              <span className="text-white/60 text-sm">Stars</span>
            </div>
          </div>
          <GlassButton 
            onClick={() => router.push('/package')}
            className="px-6 py-2 text-sm bg-primary/20 border-primary/30"
          >
            + Top Up
          </GlassButton>
        </div>
      </GlassCard>

      {/* Tabs Control */}
      <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-2xl mb-6 border border-white/5">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
            activeTab === 'predictions' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">Predictions</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
            activeTab === 'transactions' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span className="text-sm font-medium">Transactions</span>
        </button>
      </div>

      {activeTab === 'predictions' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-white/40">Loading predictions...</div>
          ) : predictions.length > 0 ? (
            predictions.map((prediction) => (
              <HistoryCard
                key={prediction.id}
                prediction={prediction}
                onClick={() => handlePredictionClick(prediction.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-white/40">No predictions yet</div>
          )}
        </div>
      ) : (
        <TransactionHistoryList />
      )}

      <div className="mt-12 flex justify-center">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-red-400/60 hover:text-red-400 transition-colors text-sm font-medium uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
