'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassButton, Sparkles, Coins } from '@/components';
import { useSession } from '@/lib/client/auth-client';

const PACKAGES = [
  {
    id: '1',
    stars: 100,
    name: 'Starter Pack',
    price: 'Free (Mockup)',
    description: 'เหมาะสำหรับผู้เริ่มต้น',
    color: 'from-blue-400 to-cyan-500',
  },
  {
    id: '2',
    stars: 200,
    name: 'Pro Pack',
    price: 'Free (Mockup)',
    description: 'สำหรับผู้ที่ต้องการคำทำนายต่อเนื่อง',
    color: 'from-purple-400 to-pink-500',
  },
];

export default function PackagePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (packageId: string) => {
    if (!session) {
      alert('Please login first');
      return;
    }

    setLoading(packageId);
    try {
      const res = await fetch('/api/credits/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) throw new Error('Failed to buy package');

      const data = await res.json();
      alert(data.message);
      router.push('/profile');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to process transaction');
    } finally {
      setLoading(null);
    }
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

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {PACKAGES.map((pkg) => (
          <GlassCard
            key={pkg.id}
            className="relative overflow-hidden group hover:scale-105 transition-transform duration-300"
          >
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${pkg.color}`} />
            
            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-2 shadow-lg`}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
              
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-yellow-400">{pkg.stars}</span>
                <span className="text-white/80">Stars</span>
              </div>

              <p className="text-white/60 text-sm min-h-[40px]">
                {pkg.description}
              </p>

              <div className="w-full pt-4">
                <GlassButton
                  onClick={() => handleBuy(pkg.id)}
                  disabled={loading === pkg.id}
                  className={`w-full py-3 font-semibold bg-gradient-to-r ${pkg.color} border-none hover:opacity-90`}
                >
                  {loading === pkg.id ? 'Processing...' : `รับ ${pkg.stars} Stars`}
                </GlassButton>
              </div>
              
              <p className="text-xs text-white/40 mt-2">{pkg.price}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
