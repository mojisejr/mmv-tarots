'use client';

import { ChevronLeft, Menu, User } from 'lucide-react';

export interface NavigationProps {
  currentPage: string;
  isLoggedIn: boolean;
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  onBackClick?: () => void;
}

/**
 * Navigation bar component with conditional button display
 * - Shows Menu button on home page
 * - Shows Back button on other pages
 * - Shows Profile button when logged in
 */
export function Navigation({
  currentPage,
  isLoggedIn,
  onMenuClick,
  onProfileClick,
  onBackClick,
}: NavigationProps) {
  const isHomePage = currentPage === 'home';

  return (
    <nav
      data-testid="navbar"
      className="relative z-50 w-full h-20 px-6 flex justify-between items-center flex-shrink-0 bg-white/10 backdrop-blur-2xl border border-white/20"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left Navigation Button */}
      <button
        onClick={isHomePage ? onMenuClick : onBackClick}
        aria-label={isHomePage ? 'Open menu' : 'Go back'}
        data-testid={isHomePage ? 'menu-button' : 'back-button'}
        className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        {isHomePage ? (
          <Menu className="w-6 h-6 text-white" />
        ) : (
          <ChevronLeft className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Center Logo */}
      <div
        className="font-serif font-bold text-xl cursor-pointer text-white tracking-wide hover:text-[var(--primary)] transition-colors absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 drop-shadow-md"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Handle logo click if needed
          }
        }}
      >
        MimiVibe
      </div>

      {/* Right Profile Button */}
      {isLoggedIn && (
        <button
          onClick={onProfileClick}
          aria-label="User profile"
          data-testid="profile-button"
          className="relative p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <User className="w-6 h-6 text-white" />
          <span
            className="absolute top-2 right-2 w-2 h-2 bg-[var(--primary)] rounded-full border border-[#2a2a2e]"
            aria-label="Online status indicator"
          ></span>
        </button>
      )}
    </nav>
  );
}