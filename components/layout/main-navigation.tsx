'use client';

import { Navigation } from './navbar';
import { useNavigation } from '@/lib/client/providers/navigation-provider';

/**
 * Main Navigation component that uses Navigation context
 * This component is meant to be used within NavigationProvider
 */
export function MainNavigation() {
  const {
    isLoggedIn,
    currentPage,
    user,
    handleHomeClick,
    handleProfileClick,
    handleBackClick,
    handleLoginClick,
    handleLogoutClick,
  } = useNavigation();

  return (
    <Navigation
      currentPage={currentPage}
      isLoggedIn={isLoggedIn}
      user={user}
      onHomeClick={handleHomeClick}
      onProfileClick={handleProfileClick}
      onBackClick={handleBackClick}
      onLoginClick={handleLoginClick}
      onLogoutClick={handleLogoutClick}
    />
  );
}