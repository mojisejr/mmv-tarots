'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/client/auth-client';

type LiffModule = typeof import('@line/liff');

export function LiffProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    // /liff uses dedicated gateway bootstrap flow; skip global bootstrap to avoid race.
    if (!liffId || isPending || session?.user || pathname === '/liff') {
      return;
    }

    let cancelled = false;

    const bootstrapLiffAuth = async () => {
      try {
        const liff: LiffModule['default'] = (await import('@line/liff')).default;

        await liff.init({ liffId });

        liff.getOS();

        if (!liff.isLoggedIn()) {
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
          
          // Use router replace instead of location reload for smoother transition
          const liff: LiffModule['default'] = (await import('@line/liff')).default;
          const permanentLink = liff.permanentLink?.createUrl();
          const state = permanentLink 
            ? new URL(permanentLink).searchParams.get('liff.state') 
            : null;
          
          if (state) {
            window.location.href = state;
          } else {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('[LIFF] bootstrap failed:', error);
      }
    };

    void bootstrapLiffAuth();

    return () => {
      cancelled = true;
    };
  }, [isPending, session?.user, pathname]);

  return <>{children}</>;
}