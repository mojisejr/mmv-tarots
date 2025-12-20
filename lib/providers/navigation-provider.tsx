'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';

interface NavigationContextType {
  isLoggedIn: boolean;
  currentPage: 'home' | 'submitted' | 'history' | 'result';
  currentJobId: string | null;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  setCurrentPage: (value: 'home' | 'submitted' | 'history' | 'result') => void;
  setCurrentJobId: (jobId: string | null) => void;
  handleMenuClick: () => void;
  handleProfileClick: () => void;
  handleBackClick: () => void;
  handleLoginClick: () => void;
  handleLogoutClick: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState<'home' | 'submitted' | 'history' | 'result'>('home');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const isLoggedIn = !!session?.user;
  const user = session?.user || null;

  const handleMenuClick = () => {
    console.log('Menu clicked');
    // Navigate to home or open menu
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
    // Navigate to profile
  };

  const handleBackClick = () => {
    console.log('Back clicked');
    // Navigate back based on current page
    if (currentPage === 'submitted' || currentPage === 'history') {
      setCurrentPage('home');
    }
  };

  const handleLoginClick = () => {
    // Redirect to Line Login
    window.location.href = '/api/auth/signin/line';
  };

  const handleLogoutClick = async () => {
    // Sign out via Better Auth
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      // Reload page to clear session
      window.location.reload();
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