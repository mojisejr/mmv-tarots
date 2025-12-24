'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/client/auth-client';
import { GlassCard, GlassButton, HistoryCard } from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { fetchUserPredictions } from '@/lib/client/api';
import { User, Gift, QrCode, LogOut, Sparkles } from 'lucide-react';

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
    <div className="max-w-md mx-auto pt-10 px-4 h-full flex flex-col pb-24">
      <h2 className="text-3xl font-serif text-white mb-8 text-center drop-shadow-md">
        โปรไฟล์
      </h2>

      {/* User Info Card */}
      <GlassCard className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-20 h-20 rounded-full border-2 border-white/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/20">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-1">
              {user.name || 'ผู้ใช้งาน'}
            </h3>
            {user.email && (
              <p className="text-sm text-white/60">{user.email}</p>
            )}
          </div>
        </div>

        {/* Points and Referral Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/60">Stars</p>
              <p className="text-lg font-bold text-white">{stars}</p>
            </div>
            <button 
              onClick={() => router.push('/package')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded-lg transition-colors"
            >
              เติม
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/60">Referral</p>
              <p className="text-xs font-mono text-white truncate">
                {user.id?.slice(-8) || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors border border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </GlassCard>

      {/* Predictions History */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 font-sans px-2">
          ประวัติการทำนาย
        </h3>

        {loading ? (
          <div className="text-center text-white/60 py-8">
            Loading your predictions...
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-300 mb-4">{error}</div>
            <GlassButton onClick={loadPredictions}>Retry</GlassButton>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            <p>ยังไม่มีการทำนาย</p>
            <p className="text-sm mt-2">เริ่มต้นด้วยการถามคำถามแรกของคุณ</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {predictions.slice(0, 10).map((prediction) => (
              <HistoryCard
                key={prediction.id}
                prediction={prediction}
                onClick={handlePredictionClick}
              />
            ))}
            {predictions.length > 10 && (
              <button
                onClick={() => router.push('/history')}
                className="w-full text-center text-sm text-white/60 hover:text-white/80 transition-colors py-2"
              >
                ดูทั้งหมด ({predictions.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
