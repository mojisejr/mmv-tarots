'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/client/auth-client';
import { GlassCard, GlassButton, HistoryCard } from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { fetchUserPredictions } from '@/lib/client/api';
import { TransactionHistoryList } from '@/components/features/transaction-history-list';
import { User, Gift, QrCode, LogOut, Sparkles, History, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Prediction {
  id: string;
  question: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  selectedCards?: any[];
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentPage } = useNavigation();
  const { data: session, isPending } = useSession();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [activeTab, setActiveTab] = useState<'predictions' | 'transactions'>('predictions');
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentPage('profile');
    
    // Check for payment status
    const success = searchParams?.get('success');
    if (success === 'true') {
      toast.success('เติม Star สำเร็จ!', {
        description: 'ยอด Star ของคุณได้รับการอัปเดตแล้ว',
        duration: 5000,
      });
      // Clear the query param
      window.history.replaceState({}, '', '/profile');
    }
  }, [setCurrentPage, searchParams]);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isPending && !session) {
      router.push('/');
      return;
    }

    // Load predictions when user is authenticated
    if (session?.user?.id) {
      loadPredictions();
      fetchUserStars();
      fetchUserProfile();
      // Check for referral rewards on first load
      checkReferralReward();
    }
  }, [session, isPending, router]);

  const checkReferralReward = async () => {
    try {
      await fetch('/api/auth/referral-check', { method: 'POST' });
    } catch (err) {
      // Silent fail - not critical
      console.error('Failed to check referral:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        if (data.referralCode) {
          setReferralCode(data.referralCode);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

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

  const handleCopyReferralLink = async () => {
    if (!referralCode) return;
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const referralLink = `${baseUrl}/?ref=${referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('คัดลอกลิงก์แล้ว!', {
        description: 'แชร์ให้เพื่อนเพื่อรับ 2 Stars',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  const loadPredictions = async () => {
    try {
      setLoading(true);
      // Fetch only recent 3 predictions for profile page
      const data = await fetchUserPredictions(3);
      
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
      <GlassCard className="mb-6 !bg-gradient-to-br from-white/10 to-white/5 border-primary/20">
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

      {/* Referral Program Card */}
      {referralCode && (
        <GlassCard className="mb-6 !bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Gift className="w-5 h-5 text-purple-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white mb-1">ชวนเพื่อนรับ Stars</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                เพื่อนคุณจะได้ <span className="text-white font-semibold">1 Star ฟรี</span><br />
                คุณจะได้ <span className="text-white font-semibold">2 Stars</span> เมื่อเพื่อนสมัครสมาชิก
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-black/30 rounded-lg px-3 py-2.5 text-xs font-mono text-white/80 truncate border border-white/5">
              {typeof window !== 'undefined' ? window.location.origin : ''}/?ref={referralCode}
            </div>
            <GlassButton 
              onClick={handleCopyReferralLink}
              className="!px-4 !py-2.5 bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </GlassButton>
          </div>
        </GlassCard>
      )}

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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Recent Predictions</h3>
            <GlassButton 
              onClick={() => router.push('/history')}
              className="text-xs px-3 py-1"
            >
              View All
            </GlassButton>
          </div>
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto pt-10 px-4 h-full flex items-center justify-center pb-24">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
