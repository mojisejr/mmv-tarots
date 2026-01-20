'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/client/auth-client';
import { WelcomeModal } from './WelcomeModal';
import { toast } from 'sonner';
import { useNavigation } from '@/lib/client/providers/navigation-provider';

export function WelcomeRitual() {
  const { data: session } = useSession();
  const { refreshBalance } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);

  useEffect(() => {
    // Check if user is loaded and onboarding status
    if (session?.user) {
      // Check for referral cookie (client-side check for UI only)
      // Real check is done safely on server
      const match = document.cookie.match(new RegExp('(^| )mmv_ref=([^;]+)'));
      if (match) {
        setHasReferral(true);
      }

      // Cast to any because the type inference from better-auth might not pick up auxiliary fields immediately without full rebuild/generation
      const user = session.user as any;
      if (user.onboardingCompleted === false && !hasChecked) {
        setIsOpen(true);
        setHasChecked(true); // Prevent re-opening in this session instance if closed manually (though we enforce API call)
      }
    }
  }, [session, hasChecked]);

  const handleComplete = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch('/api/user/onboarding', { method: 'PATCH' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      // Success Path
      setIsOpen(false);
      
      // Dynamic Toast based on actual server response if available, or fallback
      const rewardAmount = data.reward || (hasReferral ? 2 : 1);
      const message = rewardAmount > 1 
         ? 'ได้รับพรแห่งการเริ่มต้น (+1) และมิตรภาพ (+1) แล้ว!' 
         : 'ได้รับพรแห่งการเริ่มต้นแล้ว! ขอให้มีความสุขกับการทำนายครับ';

      toast.success(message);
      
      // Force UI Sync: Update local balance immediately
      await refreshBalance();
      
    } catch (error) {
      console.error('Onboarding error:', error);
      setIsError(true);
      toast.error('เกิดขัดข้องในการทำพิธี กรุณาลองใหม่ครับ');
      // DO NOT close modal here - enforce the hard gate
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <WelcomeModal 
      isOpen={isOpen} 
      onClose={handleComplete}
      isLoading={isLoading}
      isError={isError}
      hasReferral={hasReferral}
    />
  );
}
