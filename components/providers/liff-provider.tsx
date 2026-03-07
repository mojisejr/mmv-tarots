'use client';

import { ReactNode, useEffect } from 'react';
import { useSession } from '@/lib/client/auth-client';

type LiffModule = typeof import('@line/liff');

export function LiffProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!liffId || isPending || session?.user) {
      return;
    }

    let cancelled = false;

    const bootstrapLiffAuth = async () => {
      try {
        const liff: LiffModule['default'] = (await import('@line/liff')).default;

        await liff.init({ liffId });

        const isInClient = liff.isInClient();
        liff.getOS();

        if (isInClient && !liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const accessToken = liff.getAccessToken();
        if (!accessToken) {
          return;
        }

        const tokenSyncKey = `mmv_liff_verified_${accessToken.slice(0, 16)}`;
        if (window.sessionStorage.getItem(tokenSyncKey) === '1') {
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
          return;
        }

        const data = await response.json();
        if (!cancelled && data?.ok) {
          window.sessionStorage.setItem(tokenSyncKey, '1');
          window.location.reload();
        }
      } catch (error) {
        console.error('[LIFF] bootstrap failed:', error);
      }
    };

    void bootstrapLiffAuth();

    return () => {
      cancelled = true;
    };
  }, [isPending, session?.user]);

  return <>{children}</>;
}