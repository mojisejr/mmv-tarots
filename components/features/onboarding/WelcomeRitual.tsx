'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/client/auth-client';
import { WelcomeModal } from './WelcomeModal';
import { toast } from 'sonner';

export function WelcomeRitual() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check if user is loaded and onboarding status
    if (session?.user) {
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
    try {
      const res = await fetch('/api/user/onboarding', { method: 'PATCH' });
      
      if (!res.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      setIsOpen(false);
      toast.success('ได้รับพรแห่งการเริ่มต้นแล้ว! ขอให้มีความสุขกับการทำนายครับ');
      
      // Ideally we refresh the session here, but for now the UI state is sufficient
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('เกิดขัดข้องเล็กน้อย แต่คุณสามารถใช้งานต่อได้เลยครับ');
      setIsOpen(false); // Close anyway to not block user
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
    />
  );
}
