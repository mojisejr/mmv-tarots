'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GlassCard, GlassButton, Sparkles, ErrorBoundary, Check } from '@/components';
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
  const [consentAccepted, setConsentAccepted] = useState(false);

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
    if (!consentAccepted) {
      toast.error('กรุณายอมรับเงื่อนไขก่อนชำระเงิน');
      return;
    }

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
          เติม Digital Token
        </h1>
        <p className="text-muted-foreground text-lg font-sans">
          เลือกแพ็กเกจที่เหมาะกับคุณเพื่อปลดล็อกเนื้อหาเชิงลึกแบบส่วนตัว
        </p>
        <div className="mt-5 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/50 backdrop-blur-xl p-4 text-left">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border-subtle"
            />
            <span className="text-sm text-foreground/80 leading-relaxed">
              I agree purchasing digital tokens is non-refundable once delivered or consumed.
              {' '}
              <Link href="/policy/refund" className="underline underline-offset-2 hover:text-foreground">
                Refund Policy
              </Link>
              {' · '}
              <Link href="/policy/terms" className="underline underline-offset-2 hover:text-foreground">
                Terms
              </Link>
              {' · '}
              <Link href="/policy/privacy" className="underline underline-offset-2 hover:text-foreground">
                Privacy
              </Link>
            </span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
        {packages.map((pkg, index) => {
          const isPopular = index === 1; // สมมติว่าใบกลางคือยอดนิยม
          
          // Determine prices
          const regularPrice = pkg.prices.find(p => !p.isPromo);
          const promoPrice = pkg.prices.find(p => p.isPromo);
          
          // Logic: Show promo if eligible and exists
          const showPromo = isEligible && !!promoPrice;
          const activePrice = showPromo ? promoPrice! : regularPrice!;
          
          // Calculate Savings
          const savedAmount = showPromo && regularPrice ? regularPrice.amount - promoPrice!.amount : 0;
          
          // Benefits list based on package type
          const getBenefits = (type: string) => {
            if (type.includes('Starter')) return [
                'ทำนายเจาะลึก 3-Agent',
                'ดาวไม่มีวันหมดอายุ',
            ];
            if (type.includes('Premium')) return [
                'ทำนายเจาะลึก 3-Agent',
                'ดาวไม่มีวันหมดอายุ',
                'Private & Secure',
            ];
            return [
                'ทำนายเจาะลึก 3-Agent',
                'ดาวไม่มีวันหมดอายุ',
                'Private & Secure',
            ];
          };

          const benefits = getBenefits(pkg.name);

          // Custom CTA text
          const getCTA = (type: string) => {
             if (type.includes('Starter')) return 'รับสิทธิ์เริ่มต้น';
             if (type.includes('Premium')) return 'เปิดดวงจัดเต็ม';
             return 'เลือกความคุ้มค่า';
          };

          const ctaText = showPromo ? getCTA(pkg.name) : 'เลือกแพ็กเกจ';

          // Fallback if no price found (should not happen with seeded data)
          if (!activePrice) return null;

          return (
            <GlassCard
              key={pkg.id}
              className={cn(
                "relative overflow-hidden group transition-all duration-500 border-[0.5px] glass-mimi flex flex-col",
                isPopular ? "scale-105 shadow-glow-primary border-primary/50 z-10" : "hover:scale-102",
                showPromo && "border-accent/30 shadow-glow-accent/20"
              )}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-xl z-20 shadow-sm">
                  POPULAR
                </div>
              )}
              
              {showPromo && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-accent to-amber-500 text-white px-3 py-1 text-xs font-bold rounded-br-xl z-20 shadow-md">
                   ลูกค้าใหม่
                </div>
              )}

              <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${getGradient(index)} group-hover:opacity-30 transition-opacity duration-500`} />
              
              <div className="relative z-10 flex flex-col items-center text-center p-6 md:px-5 md:py-6 space-y-4 h-full">
                <div className={cn(
                  "w-14 h-14 rounded-full bg-surface-card flex items-center justify-center mb-1 shadow-warm border border-border-subtle group-hover:rotate-12 transition-transform duration-500",
                  getIconColor(index)
                )}>
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="space-y-1 w-full">
                  <h3 className="text-xl font-serif font-bold text-foreground">{pkg.name}</h3>
                   {/* Benefits List */}
                   <ul className="text-left text-sm text-muted-foreground space-y-1.5 py-2 px-2 md:px-1">
                      {benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 whitespace-nowrap">
                           <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20">
                             <Check className="w-3 h-3" />
                           </div>
                           <span className="truncate">{benefit}</span>
                        </li>
                      ))}
                   </ul>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-grow py-2 w-full">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground tracking-tighter">{pkg.stars}</span>
                    <span className="text-muted-foreground font-medium text-sm">Stars</span>
                  </div>
                  
                  <div className="mt-2 flex flex-col items-center gap-1 w-full">
                    {showPromo && regularPrice && (
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="line-through decoration-destructive/50">
                            ฿{regularPrice.amount.toFixed(0)}
                          </span>
                          <span className="text-xs bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap">
                            ประหยัด ฿{savedAmount.toFixed(0)}
                          </span>
                       </div>
                    )}
                    <div className={cn(
                      "px-6 py-2 rounded-full border w-full max-w-[180px]",
                      showPromo 
                        ? "bg-gradient-to-r from-accent/10 to-amber-500/10 border-accent/50 text-accent-foreground shadow-inner-accent" 
                        : "bg-surface-subtle border-border-subtle text-foreground"
                    )}>
                      <p className="text-2xl font-bold tracking-tight">฿{activePrice.amount.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-1 space-y-2">
                  <GlassButton
                    onClick={() => handleBuy(activePrice.id)}
                    disabled={loading === activePrice.id || !consentAccepted}
                    variant={isPopular || showPromo ? "primary" : "outline"}
                    className={cn(
                      "w-full py-6 font-bold text-lg shadow-warm transition-all duration-300",
                      showPromo && "bg-gradient-to-r from-primary to-primary-strong hover:brightness-110 border-none text-white shadow-glow-primary"
                    )}
                  >
                    {loading === activePrice.id ? 'กำลังเตรียมการ...' : ctaText}
                  </GlassButton>
                  
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
                    <span className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse"></span>
                    Secure payment processing
                  </div>
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