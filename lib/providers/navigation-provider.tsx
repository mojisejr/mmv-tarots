'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isLoggedIn: boolean;
  currentPage: string;
  setIsLoggedIn: (value: boolean) => void;
  setCurrentPage: (value: string) => void;
  handleMenuClick: () => void;
  handleProfileClick: () => void;
  handleBackClick: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');

  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  const handleBackClick = () => {
    console.log('Back clicked');
  };

  return (
    <NavigationContext.Provider
      value={{
        isLoggedIn,
        currentPage,
        setIsLoggedIn,
        setCurrentPage,
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