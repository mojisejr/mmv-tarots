'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Menu, User, LogIn } from 'lucide-react';

export interface NavigationProps {
  currentPage: string;
  isLoggedIn: boolean;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  onBackClick?: () => void;
  onLoginClick?: () => void;
}

/**
 * Navigation bar component with conditional button display
 * - Shows Menu button on home page
 * - Shows Back button on other pages
 * - Shows Login button when not logged in
 * - Shows Profile button with Avatar when logged in
 */
export function Navigation({
  currentPage,
  isLoggedIn,
  user,
  onMenuClick,
  onProfileClick,
  onBackClick,
  onLoginClick,
}: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = currentPage === 'home';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const navClasses = `
    fixed top-0 left-0 right-0 z-50
    w-full h-16 px-3 sm:px-6
    flex justify-between items-center
    backdrop-blur-xl border-b transition-all duration-300
    navbar-enter
    ${scrolled
      ? 'bg-black/40 border-white/20 shadow-2xl'
      : 'bg-black/20 border-white/10 shadow-lg'
    }
  `;

  return (
    <nav
      data-testid="navbar"
      className={navClasses}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left Navigation Button */}
      <button
        onClick={isHomePage ? onMenuClick : onBackClick}
        aria-label={isHomePage ? 'Open menu' : 'Go back'}
        data-testid={isHomePage ? 'menu-button' : 'back-button'}
        className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 nav-button-hover"
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

      {/* Right Authentication Button */}
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <button
            onClick={onProfileClick}
            aria-label="User profile"
            data-testid="profile-button"
            className="relative flex items-center gap-2 p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 nav-button-hover"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/20">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <span
              className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a2a2e]"
              aria-label="Online status indicator"
            ></span>
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            aria-label="Login with Line"
            data-testid="login-button"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B900] hover:bg-[#00A000] text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00B900]/50 shadow-lg"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-sm">เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </nav>
  );
}