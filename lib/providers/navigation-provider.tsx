'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isLoggedIn: boolean;
  currentPage: 'home' | 'submitted' | 'history' | 'result';
  currentJobId: string | null;
  setIsLoggedIn: (value: boolean) => void;
  setCurrentPage: (value: 'home' | 'submitted' | 'history' | 'result') => void;
  setCurrentJobId: (jobId: string | null) => void;
  handleMenuClick: () => void;
  handleProfileClick: () => void;
  handleBackClick: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentPage, setCurrentPage] = useState<'home' | 'submitted' | 'history' | 'result'>('home');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

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

  return (
    <NavigationContext.Provider
      value={{
        isLoggedIn,
        currentPage,
        currentJobId,
        setIsLoggedIn,
        setCurrentPage,
        setCurrentJobId,
        handleMenuClick,
        handleProfileClick,
        handleBackClick,
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