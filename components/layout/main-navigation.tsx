'use client';

import { Navigation } from './navbar';
import { useNavigation } from '@/lib/providers/navigation-provider';

/**
 * Main Navigation component that uses Navigation context
 * This component is meant to be used within NavigationProvider
 */
export function MainNavigation() {
  const {
    isLoggedIn,
    currentPage,
    handleMenuClick,
    handleProfileClick,
    handleBackClick,
  } = useNavigation();

  return (
    <Navigation
      currentPage={currentPage}
      isLoggedIn={isLoggedIn}
      onMenuClick={handleMenuClick}
      onProfileClick={handleProfileClick}
      onBackClick={handleBackClick}
    />
  );
}