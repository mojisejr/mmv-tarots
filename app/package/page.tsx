'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard, GlassButton, Sparkles, ErrorBoundary } from '@/components';
import { useSession } from '@/lib/client/auth-client';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/shared/utils';

interface PackagePrice {
  id: string;
  amount: number;
  currency: string;
  isPromo: boolean;
  promoLabel: string | null;
  active: boolean;
}

interface StarPackage {
  id: string;
  name: string;
  description: string | null;
  stars: number;
  active: boolean;
  prices: PackagePrice[];
}

function PackagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { setCurrentPage } = useNavigation();
  const [loading, setLoading] = useState<string | null>(null);
  const [packages, setPackages] = useState<StarPackage[]>([]);
  const [isEligible, setIsEligible] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPage('package');
    
    // Check for payment cancel
    const canceled = searchParams?.get('canceled');
    if (canceled === 'true') {
      toast.error('ยกเลิกการชำระเงิน', {
        description: 'คุณสามารถเลือกแพ็กเกจใหม่ได้ตลอดเวลา',
        duration: 5000,
      });
      // Clear the query param
      window.history.replaceState({}, '', '/package');
    }
  }, [setCurrentPage, searchParams]);

  useEffect(() => {
    fetch('/api/packages')
      .then((res) => res.json())
      .then((data) => setPackages(data))
      .catch((error) => console.error('Failed to load packages:', error));
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/user/promo-eligibility?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => setIsEligible(data.eligible))
        .catch((err) => console.error('Failed to check eligibility:', err));
    } else {
      // If not logged in, show promo prices (assume new user)
      setIsEligible(true);
    }
  }, [session]);

  const handleBuy = async (priceId: string) => {
    if (!session?.user) {
      toast.error('กรุณา Login ก่อนซื้อแพ็กเกจ');
      // Optional: Redirect to login
      return;
    }

    setLoading(priceId);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId, 
          userId: session.user.id 
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create checkout session');
      }

      const data = await res.json();
      
      // Redirect ไปยังหน้า Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน');
    } finally {
      setLoading(null);
    }
  };

  const getGradient = (index: number) => {
    const gradients = [
      'from-primary/40 to-primary-strong/40',
      'from-accent/40 to-amber-600/40',
      'from-primary-strong/40 to-accent/40',
    ];
    return gradients[index % gradients.length];
  };

  const getIconColor = (index: number) => {
    const colors = [
      'text-primary-strong',
      'text-accent',
      'text-primary',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="max-w-4xl mx-auto pt-10 px-4 pb-24">
      <div className="text-center mb-12 animate-fade-in-down">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
          เติม Star
        </h1>
        <p className="text-muted-foreground text-lg font-sans">
          เลือกแพ็กเกจที่เหมาะกับคุณเพื่อเปิดคำทำนาย
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {packages.map((pkg, index) => {
          const isPopular = index === 1; // สมมติว่าใบกลางคือยอดนิยม
          
          // Determine prices
          const regularPrice = pkg.prices.find(p => !p.isPromo);
          const promoPrice = pkg.prices.find(p => p.isPromo);
          
          // Logic: Show promo if eligible and exists
          const showPromo = isEligible && !!promoPrice;
          const activePrice = showPromo ? promoPrice! : regularPrice!;
          
          // Fallback if no price found (should not happen with seeded data)
          if (!activePrice) return null;

          return (
            <GlassCard
              key={pkg.id}
              className={cn(
                "relative overflow-hidden group transition-all duration-500 border-[0.5px] glass-mimi flex flex-col",
                isPopular ? "scale-105 shadow-glow-primary border-primary/50 z-10" : "hover:scale-102"
              )}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-xl z-20 shadow-sm">
                  POPULAR
                </div>
              )}
              
              {showPromo && promoPrice?.promoLabel && (
                <div className="absolute top-0 left-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-bold rounded-br-xl z-20 shadow-sm animate-pulse">
                  {promoPrice.promoLabel}
                </div>
              )}

              <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${getGradient(index)} group-hover:opacity-30 transition-opacity duration-500`} />
              
              <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-6 h-full">
                <div className={cn(
                  "w-20 h-20 rounded-full bg-surface-card flex items-center justify-center mb-2 shadow-warm border border-border-subtle group-hover:rotate-12 transition-transform duration-500",
                  getIconColor(index)
                )}>
                  <Sparkles className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-foreground">{pkg.name}</h3>
                  <p className="text-muted-foreground text-sm font-sans leading-relaxed min-h-[40px]">
                    {pkg.description || 'แพ็กเกจพิเศษสำหรับคุณ'}
                  </p>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-grow py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-foreground tracking-tighter">{pkg.stars}</span>
                    <span className="text-muted-foreground font-medium">Stars</span>
                  </div>
                  
                  <div className="mt-4 flex flex-col items-center gap-1">
                    {showPromo && regularPrice && (
                      <span className="text-sm text-muted-foreground line-through decoration-destructive/50">
                        ฿{regularPrice.amount.toFixed(0)}
                      </span>
                    )}
                    <div className={cn(
                      "px-4 py-1 rounded-full border",
                      showPromo 
                        ? "bg-accent/10 border-accent text-accent" 
                        : "bg-surface-subtle border-border-subtle text-foreground"
                    )}>
                      <p className="text-lg font-semibold">฿{activePrice.amount.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-4">
                  <GlassButton
                    onClick={() => handleBuy(activePrice.id)}
                    disabled={loading === activePrice.id}
                    variant={isPopular || showPromo ? "primary" : "outline"}
                    className="w-full py-4 font-bold text-lg shadow-warm"
                  >
                    {loading === activePrice.id ? 'กำลังเตรียมการ...' : `เลือกแพ็กเกจ`}
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

export default function PackagePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="max-w-4xl mx-auto pt-10 px-4 pb-24">
          <div className="text-center text-muted-foreground">กำลังโหลด...</div>
        </div>
      }>
        <PackagePageContent />
      </Suspense>
    </ErrorBoundary>
  );
}