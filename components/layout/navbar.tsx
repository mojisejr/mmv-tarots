'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, LogIn } from 'lucide-react';
import Image from 'next/image';
import { ProfileDropdown } from './profile-dropdown';

export interface NavigationProps {
  currentPage: string;
  isLoggedIn: boolean;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onBackClick?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

/**
 * Unified Navigation bar component
 * - Shows Back button only on detail pages
 * - Shows Page Title on main pages (Mobile)
 * - Shows Profile Dropdown on Desktop
 */
export function Navigation({
  currentPage,
  isLoggedIn,
  user,
  onHomeClick,
  onProfileClick,
  onBackClick,
  onLoginClick,
  onLogoutClick,
}: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  
  // Define main pages where Back button should be hidden
  const mainPages = ['home', 'history', 'profile', 'package'];
  const showBackButton = !mainPages.includes(currentPage);
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

  const getPageTitle = () => {
    switch (currentPage) {
      case 'history': return 'ประวัติการทำนาย';
      case 'profile': return 'ข้อมูลส่วนตัว';
      case 'package': return 'แพ็กเกจ';
      case 'result': return 'ผลการทำนาย';
      case 'submitted': return 'กำลังทำนาย';
      default: return '';
    }
  };

  const pageTitle = getPageTitle();

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
      {/* Left Navigation Button - Show Back or Logo */}
      <div className="flex items-center min-w-[48px]">
        {showBackButton ? (
          <button
            onClick={onBackClick}
            aria-label="Go back"
            data-testid="back-button"
            className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 nav-button-hover"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        ) : (
          <button
            onClick={onHomeClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg p-1"
            aria-label="Go to home"
          >
            <Image
              src="/logo.webp"
              alt="MimiVibe Logo"
              width={100}
              height={32}
              priority
              className="h-8 w-auto drop-shadow-lg"
            />
          </button>
        )}
      </div>

      {/* Center Content - Page Title (Hidden on Home) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
        {!isHomePage && (
          <div className="flex flex-col items-center">
            <span className="text-lg font-serif font-medium text-white drop-shadow-md whitespace-nowrap">
              {pageTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right Authentication Button - Hidden on mobile as it's in Bottom Nav */}
      <div className="flex items-center gap-2 justify-end w-12 md:w-auto">
        <div className="hidden md:block">
          {isLoggedIn ? (
            <ProfileDropdown 
              user={user} 
              onLogout={onLogoutClick || (() => {})} 
            />
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
      </div>
    </nav>
  );
}