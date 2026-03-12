'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SESSION_SHELL_TARGET_STORAGE_KEY } from '@/lib/client/auth/session-shell-contract';

type LiffModule = typeof import('@line/liff');

export function resolveLiffStateTarget(rawState: string | null): string {
  if (!rawState) return '/';

  let decodedState = '/';
  try {
    decodedState = decodeURIComponent(rawState);
  } catch {
    return '/';
  }

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

function extractReferralFromTarget(target: string | null): string | null {
  if (!target) {
    return null;
  }

  const safeTarget = resolveLiffStateTarget(target);
  if (!safeTarget || safeTarget === '/') {
    return null;
  }

  try {
    const parsedTarget = new URL(safeTarget, 'https://local.mimi');
    return parsedTarget.searchParams.get('ref');
  } catch {
    return null;
  }
}

export function resolveDurableGatewayTarget(
  rawState: string | null,
  referralCode: string | null,
  persistedTarget: string | null
): string {
  // Preserve ref from persisted target when incoming state loses query context.
  const durableReferralCode = referralCode ?? extractReferralFromTarget(persistedTarget);

  if (rawState) {
    const resolvedRaw = resolveLiffStateTarget(rawState);
    let isExplicitRootState = false;
    try {
      isExplicitRootState = decodeURIComponent(rawState) === '/';
    } catch {
      isExplicitRootState = false;
    }

    if (resolvedRaw !== '/' || isExplicitRootState) {
      return buildGatewayTarget(rawState, durableReferralCode);
    }
  }

  if (persistedTarget) {
    return buildGatewayTarget(persistedTarget, durableReferralCode);
  }

  return buildGatewayTarget(rawState, durableReferralCode);
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
    const rawState = searchParams.get('mmv_next');
    const referralCode = searchParams.get('ref');
    const persistedTarget = window.localStorage.getItem(SESSION_SHELL_TARGET_STORAGE_KEY);
    const target = resolveDurableGatewayTarget(rawState, referralCode, persistedTarget);

    if (target !== '/') {
      window.localStorage.setItem(SESSION_SHELL_TARGET_STORAGE_KEY, target);
    }

    if (!liffId) {
      router.replace(target);
      return;
    }

    let cancelled = false;

    const runGateway = async () => {
      try {
        const liff: LiffModule['default'] = (await import('@line/liff')).default;
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
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
          window.localStorage.removeItem(SESSION_SHELL_TARGET_STORAGE_KEY);
          window.location.assign(target);
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
          window.localStorage.removeItem(SESSION_SHELL_TARGET_STORAGE_KEY);
          window.location.assign(target);
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
