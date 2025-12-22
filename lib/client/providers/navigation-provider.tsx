'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from '@/lib/client/auth-client';

interface NavigationContextType {
  isLoggedIn: boolean;
  currentPage: 'home' | 'submitted' | 'history' | 'result' | 'profile';
  currentJobId: string | null;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  setCurrentPage: (value: 'home' | 'submitted' | 'history' | 'result' | 'profile') => void;
  setCurrentJobId: (jobId: string | null) => void;
  handleMenuClick: () => void;
  handleProfileClick: () => void;
  handleBackClick: () => void;
  handleLoginClick: () => void;
  handleLogoutClick: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState<'home' | 'submitted' | 'history' | 'result' | 'profile'>('home');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const isLoggedIn = !!session?.user;
  const user = session?.user || null;

  const handleMenuClick = () => {
    console.log('Menu clicked');
    router.push('/');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
    router.push('/profile');
  };

  const handleBackClick = () => {
    console.log('Back clicked');
    // Navigate back based on current page
    if (currentPage === 'submitted' || currentPage === 'history' || currentPage === 'profile') {
      router.push('/');
      setCurrentPage('home');
    } else {
      router.back();
    }
  };

  const handleLoginClick = async () => {
    // Redirect to Line Login using Better Auth Client
    try {
      await signIn.social({
        provider: 'line',
        callbackURL: '/', // Redirect back to home after login
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogoutClick = async () => {
    // Sign out via Better Auth Client
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.reload();
          },
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        isLoggedIn,
        currentPage,
        currentJobId,
        user,
        setCurrentPage,
        setCurrentJobId,
        handleMenuClick,
        handleProfileClick,
        handleBackClick,
        handleLoginClick,
        handleLogoutClick,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}