'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type LiffModule = typeof import('@line/liff');

export function resolveLiffStateTarget(rawState: string | null): string {
  if (!rawState) return '/';

  const decodedState = decodeURIComponent(rawState);
  if (!decodedState.startsWith('/')) {
    return '/';
  }

  return decodedState;
}

export function buildGatewayTarget(rawState: string | null, referralCode: string | null): string {
  const target = resolveLiffStateTarget(rawState);

  if (!referralCode || target.includes('ref=')) {
    return target;
  }

  const parsedTarget = new URL(target, 'https://local.mimi');
  parsedTarget.searchParams.set('ref', referralCode);

  return `${parsedTarget.pathname}${parsedTarget.search}`;
}

function LiffGatewayLoading() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-black to-neutral-900 text-white px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center">
        <div className="h-9 w-9 mx-auto rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
        <h1 className="mt-4 text-lg font-medium">กำลังเชื่อมต่อบัญชี LINE</h1>
        <p className="mt-2 text-sm text-white/70">กรุณารอสักครู่ ระบบกำลังพาคุณเข้าสู่หน้าที่ต้องการ</p>
      </div>
    </main>
  );
}

function LiffGatewayClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const target = buildGatewayTarget(searchParams.get('liff.state'), searchParams.get('ref'));

    if (!liffId) {
      router.replace(target);
      return;
    }

    let cancelled = false;

    const runGateway = async () => {
      try {
        const liff: LiffModule['default'] = (await import('@line/liff')).default;
        await liff.init({ liffId });

        if (liff.isInClient() && !liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const accessToken = liff.getAccessToken();
        if (!accessToken) {
          router.replace(target);
          return;
        }

        const tokenSyncKey = `mmv_liff_verified_${accessToken.slice(0, 16)}`;
        if (window.sessionStorage.getItem(tokenSyncKey) === '1') {
          router.replace(target);
          return;
        }

        const response = await fetch('/api/auth/liff-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) {
          router.replace(target);
          return;
        }

        const data = await response.json();
        if (!cancelled && data?.ok) {
          window.sessionStorage.setItem(tokenSyncKey, '1');
          router.replace(target);
          return;
        }

        router.replace('/');
      } catch (error) {
        console.error('[LIFF gateway] failed:', error);
        router.replace(target);
      }
    };

    void runGateway();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <LiffGatewayLoading />;
}

export default function LiffGatewayPage() {
  return (
    <Suspense fallback={<LiffGatewayLoading />}>
      <LiffGatewayClient />
    </Suspense>
  );
}
