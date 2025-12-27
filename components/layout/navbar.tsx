'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, User, LogIn } from 'lucide-react';
import Image from 'next/image';

export interface NavigationProps {
  currentPage: string;
  isLoggedIn: boolean;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onBackClick?: () => void;
  onLoginClick?: () => void;
}

/**
 * Unified Navigation bar component
 * - Shows Back button on all pages except home
 * - Logo always acts as Home button
 * - Shows Login/Profile on desktop only (mobile uses BottomNav)
 */
export function Navigation({
  currentPage,
  isLoggedIn,
  user,
  onHomeClick,
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
      {/* Left Navigation Button - Only show Back when not on home */}
      <div className="flex items-center w-12">
        {!isHomePage && (
          <button
            onClick={onBackClick}
            aria-label="Go back"
            data-testid="back-button"
            className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 nav-button-hover"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Center Logo - Always acts as Home button */}
      <button
        onClick={onHomeClick}
        className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg p-1"
        aria-label="Go to home"
      >
        <Image
          src="/logo.webp"
          alt="MimiVibe Logo"
          width={120}
          height={40}
          priority
          className="h-10 w-auto drop-shadow-lg"
        />
      </button>

      {/* Right Authentication Button - Hidden on mobile as it's in Bottom Nav */}
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <button
            onClick={onProfileClick}
            aria-label="User profile"
            data-testid="profile-button"
            className="hidden md:flex relative items-center gap-2 p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 nav-button-hover"
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
              className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
              aria-label="Online status indicator"
            ></span>
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            aria-label="Login with Line"
            data-testid="login-button"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-success hover:bg-success-600 text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success/50 shadow-lg"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-sm">เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </nav>
  );
}