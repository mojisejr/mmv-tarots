'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard, GlassButton, Sparkles } from '@/components';
import { useSession } from '@/lib/client/auth-client';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { toast } from 'sonner';

interface StarPackage {
  id: string;
  name: string;
  description: string | null;
  stars: number;
  price: number;
  active: boolean;
}

function PackagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { setCurrentPage } = useNavigation();
  const [loading, setLoading] = useState<string | null>(null);
  const [packages, setPackages] = useState<StarPackage[]>([]);

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

  const handleBuy = async (packageId: string) => {
    if (!session?.user) {
      alert('กรุณา Login ก่อนซื้อแพ็กเกจ');
      return;
    }

    setLoading(packageId);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          packageId, 
          userId: session.user.id 
        }),
      });

      if (!res.ok) throw new Error('Failed to create checkout session');

      const data = await res.json();
      
      // Redirect ไปยังหน้า Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการสร้างการชำระเงิน');
    } finally {
      setLoading(null);
    }
  };

  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-400 to-cyan-500',
      'from-purple-400 to-pink-500',
      'from-amber-400 to-orange-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="max-w-4xl mx-auto pt-10 px-4 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 drop-shadow-lg">
          เติม Star
        </h1>
        <p className="text-white/60 text-lg">
          เลือกแพ็กเกจที่เหมาะกับคุณเพื่อเปิดคำทำนาย
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
        {packages.map((pkg, index) => (
          <GlassCard
            key={pkg.id}
            className="relative overflow-hidden group transition-all duration-300 border-[0.5px]"
          >
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${getGradient(index)}`} />
            
            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center mb-2 shadow-lg`}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
              
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-yellow-400">{pkg.stars}</span>
                <span className="text-white/80">Stars</span>
              </div>

              <p className="text-white/60 text-sm min-h-[40px]">
                {pkg.description || 'แพ็กเกจพิเศษสำหรับคุณ'}
              </p>

              <div className="w-full pt-4">
                <GlassButton
                  onClick={() => handleBuy(pkg.id)}
                  disabled={loading === pkg.id}
                  className={`w-full py-3 font-semibold bg-gradient-to-r ${getGradient(index)} border-none hover:opacity-90`}
                >
                  {loading === pkg.id ? 'กำลังเตรียมการชำระเงิน...' : `ซื้อ ${pkg.stars} Stars`}
                </GlassButton>
              </div>
              
              <p className="text-sm text-white/60 mt-2">฿{pkg.price.toFixed(2)}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function PackagePage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto pt-10 px-4 pb-24">
        <div className="text-center text-white/60">กำลังโหลด...</div>
      </div>
    }>
      <PackagePageContent />
    </Suspense>
  );
}