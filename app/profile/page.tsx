'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/client/auth-client';
import { GlassCard, GlassButton, HistoryCard, Modal } from '@/components';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { fetchUserPredictions } from '@/lib/client/api';
import { TransactionHistoryList } from '@/components/features/transaction-history-list';
import { User, Gift, QrCode, LogOut, Sparkles, History, Copy, Check, Info, HelpCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { REFERRAL_REWARDS } from '@/constants/referral';
import { ReferralUtils } from '@/lib/referral-utils';

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
  
  // Support System State
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setIsSendingSupport(true);
    try {
      const context = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        resolution: `${window.innerWidth}x${window.innerHeight}`,
      };

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: supportMessage,
          context,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      toast.success('ส่งข้อความเรียบร้อยแล้ว', {
        description: 'ทีมงานจะรีบตรวจสอบและดำเนินการแก้ไขให้เร็วที่สุดครับ',
      });
      setSupportMessage('');
      setSupportOpen(false);
    } catch (error) {
      toast.error('ส่งข้อความไม่สำเร็จ', {
        description: error instanceof Error ? error.message : 'กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsSendingSupport(false);
    }
  };

  useEffect(() => {
    setCurrentPage('profile');
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
    }
  }, [session, isPending, router]);

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

  const handleCopyUserId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success('คัดลอก User ID แล้ว');
    } catch (err) {
      console.error('Failed to copy User ID:', err);
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralCode) return;
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const referralLink = ReferralUtils.generateLink(baseUrl, referralCode);
    const shareText = ReferralUtils.shareText.invite();
    
    try {
      // Try to use native share if available (mobile friendly)
      if (navigator.share) {
         await navigator.share({
            title: 'MimiVibe Free Reading',
            text: shareText,
            url: referralLink
         });
      } else {
         await navigator.clipboard.writeText(referralLink);
         setCopied(true);
         toast.success('คัดลอกลิงก์แล้ว!', {
           description: `แชร์ให้เพื่อนเพื่อรับ ${REFERRAL_REWARDS.REFERRER} Stars`,
         });
         setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy/share:', err);
      // Fallback to clipboard if share fails (e.g. user cancelled)
      try {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success('คัดลอกลิงก์แล้ว!');
      } catch (clipboardErr) {
        toast.error('ไม่สามารถคัดลอกได้');
      }
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
        <div className="text-muted-foreground">Loading...</div>
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
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-2 border-white/20">
              <User className="w-12 h-12 text-foreground" />
            </div>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{user.name || 'Cosmic Traveler'}</h1>
          <button 
            onClick={handleCopyUserId}
            className="group flex items-center gap-1.5 mx-auto px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
            title="Click to copy User ID"
          >
            <span className="text-[10px] font-mono text-foreground/30 group-hover:text-foreground/50 transition-colors">
              ID: {user.id.slice(0, 8)}...{user.id.slice(-8)}
            </span>
            <Copy className="w-3 h-3 text-foreground/20 group-hover:text-accent transition-colors" />
          </button>
        </div>
      </div>

      {/* Stars Wallet Card */}
      <GlassCard className="mb-6 glass-mimi border-primary/20">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-foreground/40 text-[10px] uppercase tracking-widest">Your Balance</p>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-3xl font-bold text-foreground">{stars}</span>
              <span className="text-foreground/60 text-sm">Stars</span>
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
        <GlassCard className="mb-6 glass-mimi border-accent/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/10">
              <Gift className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-foreground mb-1">ชวนเพื่อนเปิดไพ่</h4>
              <p className="text-xs text-foreground/60 leading-relaxed mb-3">
                เพื่อนรับสิทธิ์ <span className="text-foreground font-semibold">เปิดไพ่ฟรี 3 ครั้ง</span> ทันที!<br />
                คุณรับ <span className="text-foreground font-semibold">{REFERRAL_REWARDS.REFERRER} Stars</span> เมื่อเพื่อนอ่านไพ่จบครั้งแรก
              </p>

              {/* How it works steps */}
              <div className="bg-primary/5 rounded-lg p-3 text-[10px] space-y-2 border border-primary/5">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold border border-primary/10">1</div>
                   <span className="text-foreground/70">ส่งลิงก์ให้เพื่อนสมัครสมาชิก</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold border border-primary/10">2</div>
                   <span className="text-foreground/70">เพื่อนได้โบนัสทันที (อ่านฟรี 3 ครั้ง)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[8px] font-bold border border-accent/20">3</div>
                   <span className="text-foreground/80 font-medium">เพื่อนอ่านไพ่จบ = คุณได้รางวัล! ✨</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-primary/5 rounded-lg px-3 py-2.5 text-xs font-mono text-foreground/80 truncate border border-primary/10">
              {typeof window !== 'undefined' ? ReferralUtils.generateLink(window.location.origin, referralCode) : ''}
            </div>
            <GlassButton 
              onClick={handleCopyReferralLink}
              className="!px-4 !py-2.5 bg-accent/10 border-accent/20 hover:bg-accent/20"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Tabs Control */}
      <div className="flex p-1 bg-primary/10 backdrop-blur-md rounded-2xl mb-6 border border-primary/20">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
            activeTab === 'predictions' ? 'bg-white/70 text-foreground shadow-warm' : 'text-foreground/40'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">Predictions</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
            activeTab === 'transactions' ? 'bg-white/70 text-foreground shadow-warm' : 'text-foreground/40'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span className="text-sm font-medium">Transactions</span>
        </button>
      </div>

      {activeTab === 'predictions' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest">Recent Predictions</h3>
            <GlassButton 
              onClick={() => router.push('/history')}
              className="text-[10px] px-3 py-1 uppercase tracking-tighter"
            >
              View All
            </GlassButton>
          </div>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground/40">Loading predictions...</div>
          ) : predictions.length > 0 ? (
            predictions.map((prediction) => (
              <HistoryCard
                key={prediction.id}
                prediction={prediction}
                onClick={() => handlePredictionClick(prediction.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground/40">No predictions yet</div>
          )}
        </div>
      ) : (
        <TransactionHistoryList />
      )}

      <GlassCard className="mt-8 border-primary/10 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">ข้อมูลทางกฎหมายและนโยบาย</h4>
            <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
              ตรวจสอบรายละเอียดการใช้งาน การคืนเงิน และความเป็นส่วนตัวได้ที่นี่
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Link
                href="/policy/refund"
                className="rounded-full border border-white/15 bg-white/60 px-3 py-1.5 text-foreground/80 transition-colors hover:text-foreground"
              >
                Refund Policy
              </Link>
              <Link
                href="/policy/terms"
                className="rounded-full border border-white/15 bg-white/60 px-3 py-1.5 text-foreground/80 transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="/policy/privacy"
                className="rounded-full border border-white/15 bg-white/60 px-3 py-1.5 text-foreground/80 transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Support Section */}
      <div className="mt-8 mb-4">
        <GlassButton
          onClick={() => setSupportOpen(true)}
          className="w-full bg-accent/5 border-accent/20 hover:bg-accent/10 text-accent group py-3"
        >
          <HelpCircle className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          แจ้งปัญหา / ติดต่อ Support
        </GlassButton>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-destructive/60 hover:text-destructive transition-colors text-sm font-medium uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <Modal
        isOpen={supportOpen}
        onClose={() => !isSendingSupport && setSupportOpen(false)}
        title="แจ้งปัญหา / ติดต่อทีมงาน"
      >
        <div className="p-1">
          <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
            พบปัญหาการใช้งาน เติมเงินไม่เข้า หรือมีข้อเสนอแนะ? <br/>
            แจ้งให้เรารู้ได้เลยครับ (ระบบจะบันทึกข้อมูลเครื่องอัตโนมัติ)
          </p>
          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <textarea
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="รายละเอียดปัญหา หรือสิ่งที่ต้องการแจ้ง..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/40 resize-none transition-colors"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                className="px-4 py-2 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
                disabled={isSendingSupport}
              >
                ยกเลิก
              </button>
              <GlassButton
                type="submit"
                className="bg-accent text-white hover:bg-accent/90 min-w-[110px] justify-center"
                disabled={isSendingSupport || !supportMessage.trim()}
              >
                {isSendingSupport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ส่งข้อมูล
                  </>
                )}
              </GlassButton>
            </div>
          </form>
        </div>
      </Modal>
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
